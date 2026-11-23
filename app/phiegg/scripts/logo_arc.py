"""Lines and true arcs for a drawn mark: a closed path from straight
runs and arcs of circles, each corner as round as it is said to be.
scripts/logo-mark.py draws Phiegg's mark with it.

X runs right and Y down. A path is a list of steps: ('M', (x, y)) where
it begins, ('L', (x, y)) a straight run to a point, or
('A', (cx, cy), r, (x, y), sweep) an arc of a circle to a point, sweep
1 clockwise on the screen and -1 the other way."""
import math


def unit(a, b):
    d = math.hypot(b[0] - a[0], b[1] - a[1])
    return ((b[0] - a[0]) / d, (b[1] - a[1]) / d)


class Line:
    def __init__(self, a, b):
        self.a, self.b = a, b

    def offset(self, r, side):
        """The same line moved r to one side (side 1 = right of travel
        on the screen, Y down)."""
        ux, uy = unit(self.a, self.b)
        nx, ny = -uy * side, ux * side
        return ('line', (self.a[0] + nx * r, self.a[1] + ny * r), (ux, uy))

    def foot(self, p):
        ux, uy = unit(self.a, self.b)
        t = (p[0] - self.a[0]) * ux + (p[1] - self.a[1]) * uy
        return (self.a[0] + ux * t, self.a[1] + uy * t)


class Arc:
    def __init__(self, c, r, sweep):
        self.c, self.r, self.sweep = c, r, sweep

    def offset(self, r, side):
        """Its circle grown or shrunk: side 1 is the right of travel."""
        grow = -side * self.sweep
        return ('circle', self.c, self.r + grow * r)

    def foot(self, p):
        ux, uy = unit(self.c, p)
        return (self.c[0] + ux * self.r, self.c[1] + uy * self.r)


def meet(one, two, near):
    """Where two offset curves cross, the crossing nearest a point."""
    found = []
    if one[0] == 'line' and two[0] == 'line':
        (p, d), (q, e) = one[1:], two[1:]
        det = d[0] * -e[1] + e[0] * d[1]
        t = ((q[0] - p[0]) * -e[1] + e[0] * (q[1] - p[1])) / det
        found = [(p[0] + d[0] * t, p[1] + d[1] * t)]
    elif one[0] == 'line' or two[0] == 'line':
        line, circle = (one, two) if one[0] == 'line' else (two, one)
        (p, d), (c, r) = line[1:], circle[1:]
        fx, fy = p[0] - c[0], p[1] - c[1]
        b = fx * d[0] + fy * d[1]
        root = math.sqrt(max(b * b - (fx * fx + fy * fy - r * r), 0.0))
        found = [(p[0] + d[0] * t, p[1] + d[1] * t) for t in (-b - root, -b + root)]
    else:
        (c, r), (k, s) = one[1:], two[1:]
        dist = math.hypot(k[0] - c[0], k[1] - c[1])
        along = (r * r - s * s + dist * dist) / (2 * dist)
        up = math.sqrt(max(r * r - along * along, 0.0))
        ux, uy = (k[0] - c[0]) / dist, (k[1] - c[1]) / dist
        mx, my = c[0] + ux * along, c[1] + uy * along
        found = [(mx - uy * up, my + ux * up), (mx + uy * up, my - ux * up)]
    return min(found, key=lambda f: math.hypot(f[0] - near[0], f[1] - near[1]))


def cross(one, two, near):
    return meet(one.offset(0, 1), two.offset(0, 1), near)


def loop(piece, corner):
    """A closed path from pieces (Line or Arc, in order, clockwise on
    the screen) and how round the corner after each is. `turn` says
    which way the corner turns: 1 a corner that sticks out, -1 one that
    goes in. A corner of nothing is left sharp."""
    count = len(piece)
    joint = []
    for i in range(count):
        one, two = piece[i], piece[(i + 1) % count]
        r, turn, near = corner[i]
        sharp = cross(one, two, near)
        if r <= 0:
            joint.append((sharp, sharp, None))
            continue
        middle = meet(one.offset(r, turn), two.offset(r, turn), sharp)
        joint.append((one.foot(middle), two.foot(middle), (middle, r, turn)))
    path = []
    for i in range(count):
        one = piece[i]
        start, end = joint[i - 1][1], joint[i][0]
        if i == 0:
            path.append(('M', start))
        if isinstance(one, Line):
            path.append(('L', end))
        else:
            path.append(('A', one.c, one.r, end, one.sweep))
        if joint[i][2]:
            middle, r, turn = joint[i][2]
            path.append(('A', middle, r, joint[i][1], turn))
    return path


def turn(piece):
    if isinstance(piece, Line):
        return Line((-piece.a[0], -piece.a[1]), (-piece.b[0], -piece.b[1]))
    return Arc((-piece.c[0], -piece.c[1]), piece.r, piece.sweep)


def about(path):
    out = []
    for step in path:
        if step[0] in 'ML':
            out.append((step[0], (-step[1][0], -step[1][1])))
        else:
            out.append(('A', (-step[1][0], -step[1][1]), step[2], (-step[3][0], -step[3][1]), step[4]))
    return out


def dots(path, fine=0.05):
    """A path as dots close together, for laying over a picture."""
    out, at = [], None
    for step in path:
        if step[0] == 'M':
            at = step[1]
            out.append(at)
            continue
        if step[0] == 'L':
            far = math.hypot(step[1][0] - at[0], step[1][1] - at[1])
            steps = max(1, int(far / fine))
            out.extend((at[0] + (step[1][0] - at[0]) * k / steps, at[1] + (step[1][1] - at[1]) * k / steps) for k in range(1, steps + 1))
            at = step[1]
            continue
        _, c, r, end, sweep = step
        a0 = math.atan2(at[1] - c[1], at[0] - c[0])
        a1 = math.atan2(end[1] - c[1], end[0] - c[0])
        span = (a1 - a0) * sweep
        while span < 0:
            span += 2 * math.pi
        steps = max(2, int(span * r / fine))
        out.extend((c[0] + r * math.cos(a0 + sweep * span * k / steps), c[1] + r * math.sin(a0 + sweep * span * k / steps)) for k in range(1, steps + 1))
        at = end
    return out


def place(path, lean, scale, mid):
    """A path leant (turned by degrees, clockwise on the screen),
    scaled and moved."""
    co, si = math.cos(math.radians(lean)), math.sin(math.radians(lean))

    def to(p):
        return (mid[0] + scale * (p[0] * co - p[1] * si), mid[1] + scale * (p[0] * si + p[1] * co))

    out = []
    for step in path:
        if step[0] in 'ML':
            out.append((step[0], to(step[1])))
        else:
            out.append(('A', to(step[1]), step[2] * scale, to(step[3]), step[4]))
    return out


def svg(path):
    out = []
    for step in path:
        if step[0] in 'ML':
            out.append('%s%.3f %.3f' % (step[0], step[1][0], step[1][1]))
        else:
            out.append('A%.3f %.3f 0 0 %d %.3f %.3f' % (step[2], step[2], 1 if step[4] == 1 else 0, step[3][0], step[3][1]))
    return ' '.join(out) + ' Z'
