// The kit's shared rooms (phi-kit/src/room.ts): a room's messages are the app's own then its people's, marks add to
// the app's counts, a muted person is hidden, accounts join the people as members, and without Phiora a stand-in
// keeps what the page does.
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { marksOf, memberOf, messagesOf, markedOf, spoken, useRoom, withPeople, type Live } from '../../phi-kit/src/room';
import type { People } from '../../phi-kit/src/people';

const NOW = Date.now();
const live: Live = {
  key: 'club/lobby', kind: 'host', can: ['see', 'write'], stamp: '1',
  message: [{ id: 'm1', by: 'acct_ben', at: NOW, text: 'Hi from Ben' }, { id: 'm2', by: 'acct_cai', at: NOW, text: 'Muted words' }],
  mark: { a01: { mark: { heart: { n: 2, mine: true } }, vote: { count: [], mine: [] }, pin: true } },
  people: [{ id: 'acct_ben', name: 'Ben', handle: 'ben', presence: 'busy', state: 'At the bench' }],
};

describe('room', () => {
  it('reads the app\'s messages first, then the people\'s, as a stream does, without anyone muted', () => {
    const all = messagesOf([{ id: 'a01', by: 'lora', day: 'Yesterday', at: '17:40', text: 'Hello' }], live, { acct_cai: true });
    expect(all.map((x) => x.text)).toEqual(['Hello', 'Hi from Ben']);
    expect(all[1].day).toBe('Today');
    expect(spoken({ id: 'p', by: 'x', at: NOW, reply: 'm1' }).reply).toBe('m1');
  });

  it('adds the people\'s marks to the app\'s counts, and keeps those only they gave', () => {
    expect(marksOf([{ icon: 'heart', n: 3 }], markedOf(live, 'a01').mark)).toEqual([{ icon: 'heart', n: 5, on: true }]);
    expect(marksOf([], { star: { n: 1, mine: false } })).toEqual([{ icon: 'star', n: 1, on: false }]);
    expect(markedOf(live, 'a01').pin).toBe(true);
    expect(markedOf(live, 'nobody')).toEqual({ mark: {}, vote: { count: [], mine: [] } });
  });

  it('counts accounts among the people, as members with an account, and knows the viewer by theirs', () => {
    const file: People = { me: 'you', member: [{ id: 'you', name: 'You' }, { id: 'lora', name: 'Lora' }] };
    const with_ = withPeople(file, live.people, 'acct_ana')!;
    expect(with_.member.map((m) => m.id)).toEqual(['you', 'lora', 'acct_ben']);
    expect(with_.member[2]).toEqual(memberOf(live.people[0]));
    expect(with_.member[2].live).toBe(true);
    expect(with_.self).toBe('acct_ana');
    expect(withPeople(file, [{ id: 'lora', name: 'Lora' }])).toBe(file);
  });

  it('without Phiora, a stand-in keeps what the page writes, marks, pins and votes', async () => {
    const { result } = renderHook(() => useRoom('club', 'stand-in'));
    await act(async () => { await result.current.send({ text: 'Kept here' }); });
    const id = result.current.live!.message[0].id;
    expect(result.current.live!.message.map((x) => x.text)).toEqual(['Kept here']);
    await act(async () => { await result.current.mark(id, 'heart', true); await result.current.pin(id, true); });
    expect(markedOf(result.current.live, id).mark.heart).toEqual({ n: 1, mine: true });
    expect(markedOf(result.current.live, id).pin).toBe(true);
    await act(async () => { await result.current.vote(id, [1]); });
    expect(markedOf(result.current.live, id).vote.mine).toEqual([1]);
    expect(result.current.live!.can).toContain('write');
  });
});
