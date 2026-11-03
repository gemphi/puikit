// Persona chat through a model the server holds the key for. Two providers:
//   PHI_MODEL_PROVIDER=openai     (default) any OpenAI-compatible /chat/completions — Ollama, LM Studio, vLLM, a Phiano server…
//                                 PHI_MODEL_URL (e.g. http://localhost:11434/v1), PHI_MODEL (default llama3.1), PHI_MODEL_KEY (optional)
//   PHI_MODEL_PROVIDER=anthropic  Anthropic Messages API — ANTHROPIC_API_KEY, PHI_MODEL (a claude-… model id), PHI_MODEL_URL optional
// With no model configured, replies with a short canned line so the apps still work offline.
const SYSTEM = (app, persona) =>
  `You are ${persona || 'the assistant'} inside the ${app || 'Phiace'} app — a world of fashion clubs, virtual cities and PFT looks. ` +
  'Stay in persona, be warm and specific, and answer in at most three short sentences.';

const clean = (messages) => (Array.isArray(messages) ? messages : [])
  .filter((m) => m && typeof m.text === 'string' && m.text.trim())
  .slice(-20)
  .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text.slice(0, 2000) }));

export function modelFromEnv(env, fetchImpl = fetch) {
  const provider = (env.PHI_MODEL_PROVIDER || (env.ANTHROPIC_API_KEY && !env.PHI_MODEL_URL ? 'anthropic' : 'openai')).toLowerCase();
  const configured = provider === 'anthropic' ? !!env.ANTHROPIC_API_KEY : !!env.PHI_MODEL_URL;
  const timeoutMs = Number(env.PHI_MODEL_TIMEOUT_MS || 30000);

  async function reply({ app, persona, messages }) {
    const turns = clean(messages);
    const last = turns.filter((m) => m.role === 'user').at(-1)?.text ?? '';
    if (!configured) return { text: `Noted — "${last.slice(0, 80)}". (Phiora has no model configured yet; set PHI_MODEL_URL or ANTHROPIC_API_KEY.)`, offline: true };
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      if (provider === 'anthropic') {
        // The Messages API needs the first turn to be the user's; drop leading assistant greetings.
        while (turns.length && turns[0].role !== 'user') turns.shift();
        const r = await fetchImpl((env.PHI_MODEL_URL || 'https://api.anthropic.com').replace(/\/$/, '') + '/v1/messages', {
          method: 'POST', signal: ctrl.signal,
          headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: env.PHI_MODEL, max_tokens: 400, system: SYSTEM(app, persona), messages: turns.map((m) => ({ role: m.role, content: m.text })) }),
        });
        if (!r.ok) throw new Error('model ' + r.status);
        const j = await r.json();
        return { text: (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim() };
      }
      const r = await fetchImpl(env.PHI_MODEL_URL.replace(/\/$/, '') + '/chat/completions', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'content-type': 'application/json', ...(env.PHI_MODEL_KEY ? { authorization: 'Bearer ' + env.PHI_MODEL_KEY } : {}) },
        body: JSON.stringify({ model: env.PHI_MODEL || 'llama3.1', max_tokens: 400, messages: [{ role: 'system', content: SYSTEM(app, persona) }, ...turns.map((m) => ({ role: m.role, content: m.text }))] }),
      });
      if (!r.ok) throw new Error('model ' + r.status);
      const j = await r.json();
      return { text: String(j.choices?.[0]?.message?.content ?? '').trim() };
    } finally { clearTimeout(timer); }
  }
  return { provider, configured, reply };
}
