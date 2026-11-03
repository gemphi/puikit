import { describe, expect, it } from 'vitest';
import { buildDB, kindLabel } from './kinds';
import { indexRelations, outName, relationsOfDB, specsFromDB } from './relations';

const sources = [
  { kind: 'person', rows: [{ id: 'p1', name: 'Noor', clubIds: ['c1', 'c2'] }, { id: 'p2', name: 'Ada', clubIds: ['c1'] }] },
  { kind: 'club', rows: [{ id: 'c1', name: 'Opal', founderId: 'p1' }, { id: 'c2', name: 'Fern', founderId: 'p9' }] },
];

describe('relations index', () => {
  it('names fields and kinds plainly', () => {
    expect(outName('founderId')).toBe('Founder');
    expect(outName('clubIds')).toBe('Clubs');
    expect(outName('hostAgentId')).toBe('Host agent');
    expect(kindLabel('city')).toBe('Cities');
    expect(kindLabel('series')).toBe('Series');
    expect(kindLabel('worldCard')).toBe('World cards');
    expect(kindLabel('person')).toBe('People');
  });

  it('indexes both ways, counts links and finds values that resolve to nothing', () => {
    const ix = indexRelations(sources, [
      { from: 'person', field: 'clubIds', to: 'club', out: 'Clubs', in: 'Members' },
      { from: 'club', field: 'founderId', to: 'person' },
    ]);
    expect(ix.links).toBe(4);
    expect(ix.unresolved).toEqual([{ from: { kind: 'club', id: 'c2' }, field: 'founderId', value: 'p9', to: 'person' }]);
    const c1 = ix.relationsOf({ kind: 'club', id: 'c1' });
    expect(c1.map((g) => [g.rel, g.dir, g.refs.length])).toEqual([['Founder', 'out', 1], ['Members', 'in', 2]]);
    const p1 = ix.relationsOf({ kind: 'person', id: 'p1' });
    expect(p1.find((g) => g.rel === 'Clubs founded')?.refs).toEqual([{ kind: 'club', id: 'c1' }]);
    expect(ix.degreeOf({ kind: 'person', id: 'p1' })).toBe(3);
    expect(ix.ranked()[0].ref).toEqual({ kind: 'club', id: 'c1' });
    expect(ix.schema.find((s) => s.field === 'founderId')).toMatchObject({ links: 1, unresolved: 1, in: 'Clubs founded' });
    expect(ix.linksOf('person.clubIds>club')).toHaveLength(3);
  });

  it('takes links to kinds it has no rows for on trust', () => {
    const ix = indexRelations([{ kind: 'host', rows: [{ id: 'h1', roleTypeId: 'r1' }] }], [{ from: 'host', field: 'roleTypeId', to: 'role' }]);
    expect(ix.links).toBe(1);
    expect(ix.relationsOf({ kind: 'role', id: 'r1' })[0]).toMatchObject({ rel: 'Hosts', dir: 'in' });
  });

  it('derives link types from global ids', () => {
    const db = buildDB([...sources, { kind: 'shot', rows: [{ id: 's1', authorId: 'p2', campaignId: 'x1' }] }]);
    const specs = specsFromDB(db);
    expect(specs).toContainEqual({ from: 'shot', field: 'authorId', to: 'person' });
    expect(specs).toContainEqual({ from: 'shot', field: 'campaignId', to: '' });
    const ix = relationsOfDB(db);
    expect(ix.schema.find((s) => s.field === 'campaignId')).toMatchObject({ links: 0, unresolved: 1 });
    expect(ix.relationsOf({ kind: 'person', id: 'p2' }).map((g) => g.rel)).toEqual(['Clubs', 'Shots']);
  });
});
