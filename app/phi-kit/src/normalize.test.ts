import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { md5 } from './md5';
import { buildIdMap, mapKeys, remapDeep, reverseOf, slugify, treeId } from './normalize';

describe('client-side ids match the database', () => {
  it('md5 equals node crypto md5 (so client ids equal seed ids)', () => {
    for (const s of ['', 'a', 'person:u_noor', 'club:c_opal', 'look:ls-s08-01', 'Côte d’Azur — eggs & 🥚', 'x'.repeat(200)])
      expect(md5(s)).toBe(createHash('md5').update(s).digest('hex'));
  });
  it('treeId and slugify follow the seed rules', () => {
    expect(treeId('club', 'c_opal')).toBe(createHash('md5').update('club:c_opal').digest('hex'));
    expect(slugify('Maison Opal!')).toBe('maison_opal');
    expect(slugify('Côte d’Azur 7')).toBe('cote_d_azur_7');
  });
  it('remaps ids, slugs and references in place, nested ones included', () => {
    const files = {
      core: { users: [{ id: 'u1', name: 'Noor Hale' }], clubs: [{ id: 'c1', name: 'Maison Opal', founderId: 'u1', members: [{ userId: 'u1' }], tags: ['u1'] }] },
    };
    const map = buildIdMap([{ kind: 'person', file: 'core', list: 'users' }, { kind: 'club', file: 'core', list: 'clubs' }], files);
    remapDeep(files, map);
    const club = files.core.clubs[0] as any;
    expect(club.id).toBe(treeId('club', 'c1'));
    expect(club.slug).toBe('maison_opal');
    expect(club.founderId).toBe(treeId('person', 'u1'));
    expect(club.members[0].userId).toBe(treeId('person', 'u1'));
    expect(club.tags).toEqual(['u1']); // not a reference field
    expect(reverseOf(map)[treeId('person', 'u1')]).toBe('u1');
    expect(mapKeys({ u1: 3, other: 1 }, map)).toEqual({ [treeId('person', 'u1')]: 3, other: 1 });
  });
});
