"""Reading and writing the app's data files (src/data) from a generator: each file keeps the form it had (indent,
line ends, final newline), so a run changes only the records it means to. Shared by city-life.py and ladder.py."""
import json
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
DATA = APP / 'src' / 'data'
SHARDS = 16
EOL = {}  # each file keeps the line ends it had


def load(name):
    """A data file: its path, its text (line ends as \\n) and its value."""
    p = DATA / name; raw = p.read_bytes(); EOL[p] = '\r\n' if b'\r\n' in raw else '\n'
    text = raw.decode('utf8').replace('\r\n', '\n'); return p, text, json.loads(text)


def dump(path, text, value):
    """Write a value back in the form the file's text had."""
    match text[:3]:
        case '{\n ' if text[3] != ' ': out = json.dumps(value, ensure_ascii=False, indent=1)
        case '{\n ': out = json.dumps(value, ensure_ascii=False, indent=2)
        case _: out = json.dumps(value, ensure_ascii=False, separators=(',', ':'))
    path.write_text(out + ('\n' if text.endswith('\n') else ''), encoding='utf8', newline=EOL.get(path, '\n'))


def shard(record_id):
    """The comment shard the app reads for a post (lib/lazy.ts shardOf)."""
    h = 7
    for c in record_id:
        h = (h * 31 + ord(c)) & 0xFFFFFFFF
    return h % SHARDS


def spec(name):
    """A generator's data file (puikit/scripts/media/<name>.json)."""
    return json.loads((APP.parents[1] / 'scripts' / 'media' / f'{name}.json').read_text(encoding='utf8'))
