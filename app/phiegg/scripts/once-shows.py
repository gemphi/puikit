"""Once City's own shows, from their stories (scripts/media/once-city-show.json and ching-maid-show.json): each
written into src/data/series.json as a series of four seasons of 32 episodes, its world and people kept beside it.
What a story does not say (its cast, its pictures, its director, its themes) is taken from the show Once City
already has (`sr_once2`). A rerun replaces exactly these series. Run from puikit/app/phiegg:
py -3.13 scripts/once-shows.py"""
from data_file import dump, load, spec

STORY = ['once-city-show', 'ching-maid-show']
# What a series takes from the city's own show where its story says nothing.
BORROW = ['cast', 'poolId', 'directorId', 'themes']


def series(story, base):
    """A story as a series record: every episode numbered through the seasons, with its season beside it."""
    episode = [{'n': n + 1, 'season': s + 1, 'title': title, 'tone': story['tone'], 'runtime': story['runtime'], 'synopsis': said}
               for n, (s, (title, said)) in enumerate((s, e) for s, season in enumerate(story['seasons']) for e in season['episodes'])]
    season = [{'n': s + 1, 'title': one['title'], 'arc': one['arc'], 'episodeCount': len(one['episodes'])} for s, one in enumerate(story['seasons'])]
    own = {key: story[key] for key in ['id', 'kind', 'title', 'clubId', 'hostId', 'worldId', 'tone', 'synopsis', 'runtime', 'genre', 'era']}
    more = {key: story[key] for key in ['formerly', 'world', 'rating', 'views'] if key in story}
    borrowed = {key: base[key] for key in BORROW if key in base}
    return {**own, **borrowed, 'rating': more.pop('rating', base.get('rating', 0)), 'views': more.pop('views', 0), 'episodes': episode,
            'seasons': season, 'castCount': len(borrowed.get('cast', [])), 'seasonCount': len(season), 'episodeCount': len(episode), **more}


def main():
    path, text, value = load('series.json')
    base = next(one for one in value['series'] if one['id'] == 'sr_once2')
    made = [series(spec(name), base) for name in STORY]
    ids = {one['id'] for one in made}
    value['series'] = [one for one in value['series'] if one['id'] not in ids] + made
    dump(path, text, value)
    for one in made:
        print(one['id'], one['title'], one['seasonCount'], 'seasons', one['episodeCount'], 'episodes')


if __name__ == '__main__':
    main()
