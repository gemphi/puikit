// What each person may do in a host and its rooms: the host's rule, which is the role file's (role.json, named by the
// app's people file) with what its people changed since kept in the host's record over it, and whether someone may
// do a thing in a room by it. A host the file has no rule for, and nobody changed, is open to all; a host someone
// made starts with the file's `default` roles and is theirs. Phiora is the only one to decide: the apps show what it
// answers (room.mjs, host.mjs).

/**
 * The rule of a host (by its name in the role file), the record's changes over the file's: its owner, its roles and
 * what each can, who holds which, and the rooms where only some roles may see, write, call or pin. `null` for a host
 * open to all. `fallback` is the roles a host starts with when the role file has none.
 */
export function ruleOf(roleFile, label, rec, fallback) {
  const own = roleFile?.space?.[label]; const k = rec ?? {}; const made = !!k.made;
  if (!own && !made && !k.role && !k.give && !k.right && !k.owner) return null;
  const base = own?.role ?? roleFile?.default ?? fallback;
  const role = [...base.map((r) => k.role?.find((x) => x.id === r.id) ?? r), ...(k.role ?? []).filter((x) => !base.some((r) => r.id === x.id))];
  const room = { ...own?.room };
  for (const [id, v] of Object.entries(k.right ?? {})) room[id] = { ...room[id], ...v };
  return { owner: k.owner ?? own?.owner ?? (made ? k.ownerId : null) ?? null, role, give: { ...own?.give, ...k.give }, room, everyone: roleFile?.everyone ?? 'everyone' };
}

/** The roles someone holds by a rule: everyone's, and those given to any name they answer to. */
export const heldBy = (rule, who) => [rule.everyone, ...new Set(who.flatMap((w) => rule.give[w] ?? []))];

/** Whether someone (every name they answer to) may do that in a room of a host ('' for the host as a whole). */
export function can(rule, who, room, verb) {
  if (!rule || who.includes(rule.owner)) return true;
  const held = heldBy(rule, who); const only = rule.room[room]?.[verb];
  return only ? held.some((id) => only.includes(id)) : rule.role.some((x) => held.includes(x.id) && x.can.includes(verb));
}
