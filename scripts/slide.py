"""Sliding: how the Phi fonts are made wider or shorter without bending a letter.

A letter is never stretched and no point moves "by its share", which is what bends a round out of true. Every
outline is cut where it turns, and each piece between two turns moves whole; only the straight runs at the turns
get longer or shorter. Two moves are made this way:

    opened   the space inside each letter wider, across: pieces move right, level runs at tops and bottoms grow
    stretch  a letter cut across one level, and the part on one side moved up or down along the straight strokes
             the cut crosses, which get longer or shorter along themselves

`dna` says whether a made letter is its source's, short of those runs. Used by phiopen.py and phifing.py; it
needs only fontTools.
"""
from statistics import median

from fontTools.pens.recordingPen import DecomposingRecordingPen

STEP, TALL = 2, 60  # a level is cut every 2 units; a space shorter than 60 is two strokes passing
LEVEL = 0.01        # an edge that rises less than this runs level
STRAIGHT = 30       # an edge this long is a straight stroke; shorter, it is one of the many that draw a round


def polygons(glyphs, name):
    """A glyph as point lists, one for each contour. The Phi fonts draw only straight lines."""
    pen = DecomposingRecordingPen(glyphs)
    glyphs[name].draw(pen)
    out = []
    for op, args in pen.value:
        match op:
            case 'moveTo':
                out.append([args[0]])
            case 'lineTo':
                out[-1].append(args[0])
            case 'closePath' | 'endPath':
                pass
            case _:
                raise SystemExit(f'{name}: {op} - only straight outlines are handled')
    return [pts[:-1] if len(pts) > 1 and pts[0] == pts[-1] else pts for pts in out]


def runs(polys, y):
    """The runs of ink along the level at y, as (left, right) pairs."""
    hits = sorted(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0])
                  for p in polys for a, b in zip(p, p[1:] + p[:1]) if min(a[1], b[1]) <= y < max(a[1], b[1]))
    return list(zip(hits[0::2], hits[1::2]))


def closed(polys, level, lo, hi):
    """Whether one run of ink goes right across the white (lo, hi) on that level: the white ends there. Two runs
    under 4 units apart are one, as where the arms of a V meet."""
    joined = []
    for a, b in runs(polys, level + 0.25):
        match joined:
            case [*_, (c, d)] if a - d < 4:
                joined[-1] = (c, max(b, d))
            case _:
                joined.append((a, b))
    return any(a <= lo + 1 and b >= hi - 1 for a, b in joined)


def weighed(space):
    """A space with each of its whites as (left, right, weight): how many spaces the white is. Where two spaces
    side by side meet into one white, as at the top of a W, that white is both and weighs two, so a stroke right of
    it moves twice there as it does below. A white weighs what the whites it goes on from weigh together, counted
    from the bottom up and from the top down, whichever is more."""
    levels = sorted(space)

    def flow(order):
        weight = {}
        for k, past in zip(order, [None] + order[:-1]):
            for lo, hi in space[k]:
                came = [weight[(past, a, b)] for a, b in space.get(past, []) if a < hi and b > lo] if past is not None and abs(past - k) == STEP else []
                weight[(k, lo, hi)] = sum(came) or 1
        return weight

    up, down = flow(levels), flow(levels[::-1])
    return {k: [(lo, hi, max(up[(k, lo, hi)], down[(k, lo, hi)])) for lo, hi in space[k]] for k in levels}


def columns(polys):
    """The spaces inside a letter, as columns: each a table from a level to the whites there, (left, right) each.
    Spaces that are over one another are one column; spaces side by side that meet (the two of a W) are one space
    with two whites on its lower levels."""
    ys = [y for p in polys for _, y in p]
    rows = {}
    for k in range(int(min(ys)) - STEP, int(max(ys)) + STEP, STEP):
        line = runs(polys, k + 0.25)
        rows[k] = [(a[1], b[0]) for a, b in zip(line, line[1:]) if b[0] - a[1] >= 4]
    # A white joins the space of every white under it that it shares some width with.
    spaces = []
    for k in sorted(rows):
        for lo, hi in rows[k]:
            under = [s for s in spaces if any(a < hi and b > lo for a, b in s.get(k - STEP, []))]
            match under:
                case [first, *rest]:
                    first.setdefault(k, []).append((lo, hi))
                    for other in rest:
                        for level, whites in other.items():
                            first.setdefault(level, []).extend(whites)
                        spaces.remove(other)
                case _:
                    spaces.append({k: [(lo, hi)]})

    # A space is inside a letter when one run of ink closes it right across, at its top or its bottom. The gap of a
    # quote mark, open at both ends, and the gap between the slash and a ring of %, which opens out to the side,
    # are the space between two marks, not inside one.
    def inside(space):
        top, bottom = max(space), min(space)
        return max(space) - min(space) >= TALL and (any(closed(polys, top + STEP, lo, hi) for lo, hi in space[top])
                                                    or any(closed(polys, bottom - STEP, lo, hi) for lo, hi in space[bottom]))

    spaces = [weighed(s) for s in spaces if inside(s)]
    middle = lambda s: median((lo + hi) / 2 for whites in s.values() for lo, hi, _ in whites)
    out = []
    for space in sorted(spaces, key=middle):
        lo = min(a for whites in space.values() for a, _, _ in whites)
        hi = max(b for whites in space.values() for _, b, _ in whites)
        over = [c for c in out if not set(c) & set(space)
                and min(a for w in c.values() for a, _, _ in w) < hi and max(b for w in c.values() for _, b, _ in w) > lo]
        match over:
            case [column, *_]:
                column.update(space)
            case _:
                out.append(dict(space))
    return out


def beside(points, col):
    """How many of a column's whites are left of a piece, on the levels the piece stands on: what most of its
    points agree on, so the piece between the two spaces of a W counts one and the one after both counts two.
    None when the piece stands on none of the column's levels."""
    counts = []
    for x, y in points:
        whites = col.get(int(y // STEP) * STEP, [])
        if whites:
            counts.append(sum(w for lo, hi, w in whites if (lo + hi) / 2 < x))
    return max(set(counts), key=counts.count) if counts else None


def near(points, col):
    """How many of a column's whites are left of a piece that stands on none of its levels: counted on the
    column's level nearest the piece, so the end of g's tail, under the left of the bowl, counts none."""
    x = sum(p[0] for p in points) / len(points)
    y = sum(p[1] for p in points) / len(points)
    level = min(col, key=lambda k: abs(k - y))
    return sum(w for lo, hi, w in col[level] if (lo + hi) / 2 < x)


def opens(col, turn, long):
    """Whether a turn has the column's space right over or under it: some of it within the space's whole width (a
    round counter is narrow at its very top and bottom), and only one level stroke between them, which is never
    thicker than a stem and a half; a turn further off, as where the foot of a p meets its stem, is not under the
    space."""
    _, start, end, y = turn
    level = min(col, key=lambda k: abs(k - y))
    left = min(lo for whites in col.values() for lo, _, _ in whites)
    right = max(hi for whites in col.values() for _, hi, _ in whites)
    return abs(level - y) <= 3 * long and min(start, end) <= right + 1 and max(start, end) >= left - 1


def shifts(points, link, cols, grows, long):
    """How far right each piece of a contour moves: GROW for each white left of it, column by column, so a stroke
    that stands beside two columns, as the slash of %, moves as one.

    A piece that stands on none of a column's levels goes with the pieces it is joined to by a short turn, as the
    round end of a stroke is to the stroke: they are one stroke. Where it is joined only by long level runs, as the
    end of g's tail is to the stem it hangs from, those runs are the stroke and may grow; and so may a turn of any
    length with the space right over or under it, as the round bottom of g's bowl, where the white opens. The piece
    then goes by where it stands beside the column (`near`). `link` is, for the turn after each piece, the length of
    its level runs, where it begins and ends across, and its height; `long` is how long a level run must be to be a
    stroke; `grows` is how much each column's white grows."""
    order = sorted(points)
    n = len(order)
    after = {p: order[(i + 1) % n] for i, p in enumerate(order)}
    before = {q: p for p, q in after.items()}
    total = {p: 0.0 for p in order}
    for col, grow in zip(cols, grows):
        found = {p: beside(points[p], col) for p in order}
        for p in [p for p in order if found[p] is None]:
            # The unknown pieces joined to p by short turns, and the known ones at the ends of that chain.
            group, reached = {p}, []
            held = lambda turn: turn[0] < long and not opens(col, turn, long)
            for step, joined in ((after, lambda a, b: link[a]), (before, lambda a, b: link[b])):
                q = p
                while held(joined(q, step[q])) and step[q] not in group:
                    q = step[q]
                    match found[q]:
                        case None:
                            group.add(q)
                        case value:
                            reached.append((len(points[q]), value))
                            break
            match reached:
                case []:
                    value = near([pt for q in group for pt in points[q]], col)
                case _:
                    value = max(reached)[1]
            for q in group:
                found[q] = value
        for p in order:
            total[p] += grow * found[p]
    return total


def slid(contour, cols, grows, long, nearly=0):
    """A contour with each of its pieces moved whole. A piece is a run of edges that all rise or all fall; it ends
    where the outline turns or runs level. With `nearly`, an edge that runs nearly level (at least `nearly` times
    longer across than up, and rising no more than a unit and a half) counts as level too: where a round flows on
    into a stem with no level run, as under the bowl of Phi-Soft's p, it is where the round can grow."""
    n = len(contour)
    rise = []
    for i in range(n):
        dx, dy = contour[(i + 1) % n][0] - contour[i][0], contour[(i + 1) % n][1] - contour[i][1]
        flat = abs(dy) < LEVEL or (nearly and abs(dy) <= 1.5 and abs(dx) >= nearly * abs(dy))
        rise.append(0 if flat else (1 if dy > 0 else -1))
    if not any(rise):
        return contour
    # The piece each edge is of: a new one begins wherever the rise changes.
    piece, count = [None] * n, 0
    start = next(i for i in range(n) if rise[i] and rise[i] != rise[i - 1])
    for step in range(n):
        i = (start + step) % n
        if rise[i]:
            if rise[i] != rise[i - 1]:
                count += 1
            piece[i] = count
    points = {}
    for i in range(n):
        if piece[i] is not None:
            a, b = contour[i], contour[(i + 1) % n]
            # Points along the edge, one a level, so a long stem counts as much as it is long.
            steps = max(1, int(abs(b[1] - a[1]) // STEP))
            points.setdefault(piece[i], []).extend((a[0] + (b[0] - a[0]) * t / steps, a[1] + (b[1] - a[1]) * t / steps) for t in range(steps + 1))
    # The turn after each piece, before the next begins: how long its level runs are, where it begins and ends
    # across, and its height.
    link, now = {p: [0.0, 0.0, None, 0.0] for p in points}, None
    for step in range(n):
        i = (start + step) % n
        match piece[i]:
            case None:
                link[now][0] += abs(contour[(i + 1) % n][0] - contour[i][0])
            case p:
                if now is not None and p != now:
                    link[now][2] = contour[i][0]
                now = p
                link[p][1], link[p][3] = contour[(i + 1) % n]
    for turn in link.values():
        turn[2] = contour[start][0] if turn[2] is None else turn[2]
    shift = shifts(points, link, cols, grows, long)

    def before(i):  # the piece that ends at or before vertex i, and where it ends
        j = i - 1
        while piece[j % n] is None:
            j -= 1
        return shift[piece[j % n]], contour[(j + 1) % n][0]

    def after(i):   # the piece that begins at or after vertex i, and where it begins
        j = i
        while piece[j % n] is None:
            j += 1
        return shift[piece[j % n]], contour[j % n][0]

    out = []
    for i in range(n):
        x, y = contour[i]
        (was, from_x), (will, to_x) = before(i), after(i)
        match (piece[i - 1] is None, piece[i] is None):
            case (False, False):                      # between two edges that rise or fall
                out.append((x + was, y))
                if will != was:                       # the outline turns here: a level run opens
                    out.append((x + will, y))
            case (False, True):                       # a piece ends, a level run begins
                out.append((x + was, y))
            case (True, False):                       # a level run ends, a piece begins
                out.append((x + will, y))
            case _:                                   # on a level run: it keeps its place along the run
                share = (x - from_x) / (to_x - from_x) if to_x != from_x else 0.0
                out.append((x + was + (will - was) * min(max(share, 0.0), 1.0), y))
    return out


def crossing(polys):
    """Whether any two edges of a glyph cross: an outline that crosses itself or another is not one to keep."""
    lines = [(a, b) for p in polys for a, b in zip(p, p[1:] + p[:1]) if a != b]

    def side(p, q, r):
        return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])

    for i, (a, b) in enumerate(lines):
        for c, d in lines[i + 1:]:
            if max(a[0], b[0]) < min(c[0], d[0]) or max(c[0], d[0]) < min(a[0], b[0]):
                continue
            if max(a[1], b[1]) < min(c[1], d[1]) or max(c[1], d[1]) < min(a[1], b[1]):
                continue
            if side(a, b, c) * side(a, b, d) < -1e-6 and side(c, d, a) * side(c, d, b) < -1e-6:
                return True
    return False


def opened(polys, grow, long, cols=None, nearly=0):
    """A glyph's contours with every space inside it wider, or None when that would cross an outline. `grow` is
    how much a space grows: a number, or what a column gives it, from its widest white. `cols` are the spaces,
    when they are not the ones `columns` finds. A space that is a V (`tapered`) is left as drawn."""
    cols = [col for col in (columns(polys) if cols is None else cols) if not tapered(col, polys)]
    if not cols:
        return polys
    grows = [grow(widest(col)) if callable(grow) else grow for col in cols]
    out = [slid(contour, cols, grows, long, nearly) for contour in polys]
    return None if crossing(out) else out


def widest(col):
    """How wide a column's white usually is, of those that are one space each: the middle of its widths, so the
    flare of the white between the feet of n or H, far wider than the rest, does not count as the space's width."""
    found = sorted(hi - lo for whites in col.values() for lo, hi, w in whites if w == 1)
    return median(found) if found else 0.0


def stretch(polys, level, dy, part):
    """The letter cut across `level`, and the part `below` or `above` it moved up by dy (down when dy is less than
    nothing). Each piece of ink the cut leaves on that side moves along the strokes the cut crosses, so they stay
    straight and keep their slant and only grow or shrink along themselves: the stem of g gets shorter under its
    bowl, the arms of a V longer above the point of a v. None when the cut crosses a piece of ink in strokes that are
    not parallel (the two arms of an A above its bar), or when a stroke would shrink to nothing."""
    if any(abs(y - level) < 0.01 for p in polys for _, y in p):
        level += 0.37
    side = (lambda y: y < level) if part == 'below' else (lambda y: y > level)
    line = runs(polys, level)
    run_of = lambda x: next((i for i, (a, b) in enumerate(line) if a - 0.5 <= x <= b + 0.5), None)
    parent = list(range(len(line)))

    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    crossings, arcs = [], []  # (run, slope, edge) for every edge the cut crosses; (contour, vertices, runs) for each arc
    for c, p in enumerate(polys):
        n, cut = len(p), []
        for i in range(n):
            a, b = p[i], p[(i + 1) % n]
            if min(a[1], b[1]) < level < max(a[1], b[1]):
                x = a[0] + (level - a[1]) / (b[1] - a[1]) * (b[0] - a[0])
                cut.append((i, run_of(x), (b[0] - a[0]) / (b[1] - a[1])))
        crossings.extend((r, slope, (c, i)) for i, r, slope in cut)
        if not cut:
            arcs.append((c, list(range(n)) if side(p[0][1]) else [], []))
            continue
        for (i, r, _), (j, s, _) in zip(cut, cut[1:] + cut[:1]):
            # The vertices after crossing i up to crossing j lie on one side of the cut.
            span = [(i + 1 + k) % n for k in range(((j - i) % n) or n)]
            if span and side(p[span[0]][1]):
                arcs.append((c, span, [r, s]))
                if r is not None and s is not None:
                    parent[root(r)] = root(s)
    # The way each piece of ink on that side goes: along the strokes the cut crosses, which must be straight (an
    # edge at least STRAIGHT long: the edges of a round are short) and parallel.
    way = {}
    for r, slope, (c, i) in crossings:
        a, b = polys[c][i], polys[c][(i + 1) % len(polys[c])]
        if r is None or ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) ** 0.5 < STRAIGHT:
            return None
        found = way.setdefault(root(r), slope)
        if abs(found - slope) > 1e-3 * max(1.0, abs(found)):
            return None
    move = {r: (dy * slope, dy) for r, slope in way.items()}
    # A stroke the cut crosses shrinks when its far end comes toward the cut: it must not shrink to nothing.
    for r, _, (c, i) in crossings:
        a, b = polys[c][i], polys[c][(i + 1) % len(polys[c])]
        moving, fixed = (a, b) if side(a[1]) else (b, a)
        if (fixed[1] - moving[1]) * (fixed[1] - moving[1] - dy) <= 1:
            return None
    out = [list(p) for p in polys]
    for c, span, ends in arcs:
        roots = {root(r) for r in ends if r is not None}
        match sorted(roots):
            case [r]:
                vector = move[r]
            case []:
                # A contour wholly on that side, as the hole of a bowl: it moves with the piece of ink it sits over.
                xs = [out[c][k][0] for k in span] or [0.0]
                middle = (min(xs) + max(xs)) / 2
                near_run = min(range(len(line)), key=lambda i: abs((line[i][0] + line[i][1]) / 2 - middle), default=None)
                vector = move.get(root(near_run), (0.0, dy)) if near_run is not None else (0.0, dy)
            case _:
                return None
        for k in span:
            x, y = out[c][k]
            out[c][k] = (x + vector[0], y + vector[1])
    return None if crossing(out) else out


def tapered(col, polys, share=0.25):
    """Whether a space is a V, closed by slanted strokes rather than by a round or a stem: long straight edges
    that are neither upright nor level border its white over at least `share` of its height. Opened by sliding,
    such a space would have its point drawn out flat, which is no longer a v; so it is left as drawn."""
    levels = sorted(col)
    height = levels[-1] - levels[0] or 1
    slanted = []
    for p in polys:
        for a, b in zip(p, p[1:] + p[:1]):
            dx, dy = b[0] - a[0], b[1] - a[1]
            if (dx * dx + dy * dy) ** 0.5 >= STRAIGHT and abs(dy) > LEVEL and 0.15 < abs(dx / dy) < 6:
                slanted.append((a, b))
    bordered = 0
    for k in levels:
        y = k + 0.25
        xs = [a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]) for a, b in slanted if min(a[1], b[1]) <= y < max(a[1], b[1])]
        if any(abs(x - lo) <= 1.5 or abs(x - hi) <= 1.5 for x in xs for lo, hi, _ in col[k]):
            bordered += 1
    return bordered * STEP >= share * height
