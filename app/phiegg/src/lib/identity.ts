// With Phiora, "me" is whoever the session cookie belongs to: a seeded member after demo sign-in,
// a registered account, or a guest. Without it, the prototype's seeded currentUserId stays.
import { useEffect } from 'react';
import { useMe, type Me } from '@phi-kit/auth';
import { D } from './data';
import { phieggStore } from '../state/phieggStore';
import type { User } from '../types/phiegg';

export function applyIdentity(me?: Me) {
  if (!me) return;
  if (!D.core.users.some((u) => u.id === me.id)) {
    D.core.users.push({ id: me.id, handle: me.handle ?? 'guest', name: me.guest ? 'Guest' : me.name, tone: 'accent', bio: me.guest ? 'Browsing as a guest.' : 'New on Phiegg.',
      verified: false, wallet: '', followers: 0, following: 0, clubIds: [], badges: [], hostIds: [], postCount: 0, putCount: 0 } as unknown as User);
  } else if (!me.guest) {
    const u = D.core.users.find((x) => x.id === me.id)!; if (me.name) u.name = me.name;
  }
  if (D.core.currentUserId !== me.id) { D.core.currentUserId = me.id; phieggStore.setState({}); }
}

/** Keep Phiegg's "me" in step with the Phiora session. */
export const useIdentity = () => { const me = useMe(); useEffect(() => applyIdentity(me), [me]); return me; };
