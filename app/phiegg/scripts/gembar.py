"""The old site's gembar brought into Phiegg (the user, 25 November 2026: "the old ts/js gembar ... bring a lot of
stories from it").

    py -3.13 app/phiegg/scripts/gembar.py        (from puikit)

Reads scripts/gembar.json for where the old site is. Its reels are finished renders (REELS/reel-NN/0K.png, about 1 GB):
each is written small and large as webp under public/gembar/ (git-ignored, served by the CDN like every picture).
Its captions (mockReels.ts, by featured person) and stories (mockStories.ts, three a person, their slides drawn from
the reels) are written into src/data/gembar.json: every reel its pictures, its caption and who told it; every story
its title, its teller and its slides. Emoji are left out: the house's face does not draw them. Nothing is invented.
"""
import io
import json
import os
import re
import sys

from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(io.open(os.path.join(HERE, 'scripts', 'gembar.json'), encoding='utf-8'))
SRC = cfg['source']
MOCK = os.path.join(SRC, cfg['mocks'])
EMOJI = re.compile('[\U0001F000-\U0001FFFF☀-➿️‍]')


def words(text):
    return re.sub(r'\s+', ' ', EMOJI.sub('', text)).strip(' .,')


def ts(name):
    return io.open(os.path.join(MOCK, name), encoding='utf-8').read()


def captions():
    """The featured people's captions, in the order the old site keeps them: handle -> captions."""
    block = ts('mockReels.ts').split('FEATURED_CAPTIONS', 1)[1].split('};', 1)[0]
    out = {}
    for handle, body in re.findall(r'\n\s{4}(\w+): \[(.*?)\n\s{4}\]', block, re.S):
        out[handle] = [words(c.encode().decode('unicode_escape') if '\\u' in c else c.replace("\\'", "'")) for c in re.findall(r"'((?:[^'\\]|\\.)*)'", body)]
    return {k: v for k, v in out.items() if v}


def people():
    """Handle -> name, as the old site's users have them (handle and displayName on one line)."""
    return {h: n for h, n in re.findall(r"handle:\s*'@?([^']+)',\s*displayName:\s*'([^']+)'", ts('mockUsers.ts'))}


def stories():
    """Short handle -> [(title, slides)] from mockStories.ts."""
    out = {}
    for short, titles, counts in re.findall(r"(\w+):\s*\{\s*titles:\s*\[([^\]]*)\],\s*slideCount:\s*\[([^\]]*)\]", ts('mockStories.ts')):
        out[short] = list(zip([words(t) for t in re.findall(r"'([^']*)'", titles)], [int(n) for n in re.findall(r'\d+', counts)]))
    return out


def write_pictures(reels):
    """Each reel's pictures, small and large, as webp; the keys they are named by."""
    out_dir = os.path.join(HERE, *cfg['out'].split('/'))
    made = {}
    for folder in reels:
        n = int(folder.split('-')[-1])
        frames = sorted(f for f in os.listdir(os.path.join(SRC, cfg['reels'], folder)) if f.lower().endswith('.png'))
        made[n] = []
        for frame in frames:
            k = int(os.path.splitext(frame)[0])
            stem = 'reel-%03d-%d' % (n, k)
            for size, wide in cfg['size'].items():
                path = os.path.join(out_dir, '%s-%s.webp' % (stem, size))
                if not os.path.exists(path):
                    os.makedirs(out_dir, exist_ok=True)
                    im = Image.open(os.path.join(SRC, cfg['reels'], folder, frame)).convert('RGB')
                    if im.size[0] > wide:
                        im = im.resize((wide, round(im.size[1] * wide / im.size[0])), Image.LANCZOS)
                    im.save(path, 'WEBP', quality=cfg['quality'])
            made[n].append('%s/%s' % (cfg['key'], stem))
    return made


def main():
    reels = sorted(d for d in os.listdir(os.path.join(SRC, cfg['reels'])) if d.startswith('reel-'))
    pictures = write_pictures(reels)
    said, named, told = captions(), people(), stories()
    order = list(said)
    data = {'_': 'From the old site\'s gembar by scripts/gembar.py: its reels (pictures under public/gembar, each named '
                 'by its key and -sm or -lg), their captions and who told them, and the stories its featured people told.',
            'reel': [], 'story': []}
    for n, keys in sorted(pictures.items()):
        handle = order[(n - 1) % len(order)]
        caption = said[handle][(n - 1) // len(order) % len(said[handle])]
        data['reel'].append({'id': 'gr_%03d' % n, 'by': handle, 'name': named.get(handle, handle.replace('_', ' ').title()), 'caption': caption, 'picture': keys})
    for u, (short, list_) in enumerate(told.items()):
        handle = next((h for h in order if h.startswith(short)), short)
        for s, (title, count) in enumerate(list_):
            slides = []
            for k in range(count):
                n = (u * 4 + s * 3 + k) % len(pictures) + 1
                keys = pictures.get(n, [])
                if keys:
                    slides.append(keys[k % len(keys)])
            data['story'].append({'id': 'gs_%s_%d' % (short, s + 1), 'by': handle, 'name': named.get(handle, short.title()), 'title': title, 'picture': slides})
    io.open(os.path.join(HERE, *cfg['data'].split('/')), 'w', encoding='utf-8', newline='\n').write(json.dumps(data, indent=1, ensure_ascii=False) + '\n')
    print('reels %d, pictures %d, stories %d' % (len(data['reel']), sum(len(v) for v in pictures.values()), len(data['story'])))


if __name__ == '__main__':
    sys.exit(main())
