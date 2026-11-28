"""Talk: what is said in Phiogy's rooms, from what Phiegg's people say.

Phiegg keeps tens of thousands of comments in threads (`threads.json`, `threads/*.json`): who wrote, what, and which
comment each answers. Every text room of a space is given between `message.least` and `message.most` of them, a
number the room's id decides, from a place in that list its id decides too, so the same room always says the same
things. Each is said by one of the people seated in the room's space (never by the person reading), spread over the
days `message.day` names, the room's own messages last; a comment that answers one the room has answers it here too.
Nothing is made up and nothing is fetched: every word is Phiegg's.
"""
import glob
import io
import json
import os


def said(src):
    """Every comment Phiegg keeps, in its order: the threads, then the post comments."""
    out = []
    for path in sorted(glob.glob(os.path.join(src, 'threads', '*.json'))) + [os.path.join(src, 'threads.json')]:
        with io.open(path, encoding='utf-8') as f:
            out.extend(c for c in json.load(f).get('comments', []) if c.get('text'))
    return out


def clock(minute):
    return '%02d:%02d' % (minute // 60, minute % 60)


def fill(rooms, cfg, fnv, src):
    """Give every text room of a space its talk; how many messages were added."""
    words, rule = said(src), cfg['message']
    days, open_, span = rule['day'], rule['from'], rule['until'] - rule['from']
    added = 0
    for rid, room in rooms['room'].items():
        if room.get('kind') == 'voice' or room.get('with') or not room.get('space'):
            continue
        seated = [rooms['member'][i]['id'] for i in rooms['space'].get(room['space'], [])]
        seated = [q for q in seated if q != 'you']
        if not seated:
            continue
        want = rule['least'] + fnv(rid + '/talk') % (rule['most'] - rule['least'] + 1)
        own = room.get('message', [])
        count = want - len(own)
        if count <= 0:
            continue
        start = fnv(rid) % len(words)
        taken = [words[(start + k) % len(words)] for k in range(count)]
        ids, out = {}, []
        for k, c in enumerate(taken):
            day_at = k * len(days) // count
            first = day_at * count // len(days)
            many = max(1, ((day_at + 1) * count // len(days)) - first)
            mid = '%s-t%d' % (rid, k)
            ids[c['id']] = mid
            message = {'id': mid, 'by': seated[fnv(c['authorId'] + '/' + rid) % len(seated)], 'day': days[day_at],
                       'at': clock(open_ + (k - first) * span // many), 'text': c['text']}
            if c.get('parentId') in ids:
                message['reply'] = ids[c['parentId']]
            out.append(message)
        room['message'] = out + own
        room['member'] = list(dict.fromkeys(room.get('member', []) + [m['by'] for m in out]))
        added += len(out)
    return added
