// Offline agent brain: in-persona replies + tool-like actions (style a look,
// RSVP, open a world). Intents, templates and wardrobes all come from data.
// To use an LLM instead, replace reply(), keep the AgentResult contract.
import { D, eventOf, t } from "./data";
import { site } from "./data";
import type { Agent, AgentChatMessage, ID } from "../types/phiegg";

export interface AgentResult { msgs: AgentChatMessage[]; rsvp?: ID; href?: string }

export function reply(a: Agent, text: string): AgentResult {
  const q = text.toLowerCase();
  const I = site.agentIntents;
  const has = (keys: string[]) => keys.some((k) => q.includes(k));
  if (has(I.style)) {
    return { msgs: [
      { role: "agent", look: { title: a.wardrobe.title, pieces: a.wardrobe.pieces, note: a.style, tone: a.tone } },
      { role: "agent", text: t("agentStyled", { line: a.bio.split(".")[0] }) },
    ] };
  }
  if (has(I.event)) {
    const e = eventOf(has(I.party) ? I.partyEvent : I.defaultEvent);
    if (e) return { rsvp: e.id, msgs: [{ role: "agent", action: t("rsvpConfirmed", { title: e.title }) }, { role: "agent", text: t("agentRsvp") }] };
  }
  if (has(I.world)) {
    const w = D.core.worlds.find((x) => a.home.includes(x.name)) ?? D.core.worlds[0];
    return { href: `/world?id=${w.id}`, msgs: [{ role: "agent", action: t("openedWorld", { name: w.name }) }, { role: "agent", text: t("agentWorld") }] };
  }
  return { msgs: [{ role: "agent", text: t("agentDefault", { hint: a.askHint }) }] };
}
