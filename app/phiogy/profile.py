"""A person's profile, as Phiegg's shows it, brought into Phiogy (server.json `profile`).

For everyone of Phiegg: Phiegg's own counts of them (shots, followers, following, puts), the pictures of the shots
they posted (feed.json), newest first, the clubs they hold with each club's mark and how many hold it, and whether
Phiegg says they are who they say. Nothing is made up: a person Phiegg counts nothing of gets no counts.
"""
import os


class Profile:
    def __init__(self, src, core, cfg, read, face):
        self.cfg, self.face = cfg, face
        self.club = {c['id']: c for c in core['clubs']}
        self.shot = {}
        for shot in sorted(read(os.path.join(src, 'feed.json'))['shots'], key=lambda x: x.get('createdAt', ''), reverse=True):
            self.shot.setdefault(shot['authorId'], []).append(shot)

    def add(self, out, owner, u):
        """Put what Phiegg's profile shows of `u` into the person `out`."""
        rule, key = self.cfg['profile'], self.cfg.get('key', '')
        counted = [[word, u[field]] for word, field in rule['count'] if isinstance(u.get(field), int)]
        if counted:
            out['count'] = counted
        shots = [key + s['media']['src'] for s in self.shot.get(owner, []) if s['media'].get('src')]
        if shots:
            out['picture'] = shots[:rule['picture']]
        clubs = [self.club[c] for c in u.get('clubIds', []) if c in self.club]
        if clubs:
            out['club'] = []
            for club in clubs:
                sheet, cell = self.face(club['id'])
                out['club'].append({'id': club['id'], 'name': club['name'], 'sheet': sheet, 'face': cell, 'holder': club.get('holders', 0)})
        if u.get('verified'):
            out['verified'] = True
        return out
