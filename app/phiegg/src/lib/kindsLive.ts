// Kind declarations (fields, facets, sorts, steps) from Phiora: GET /tree?kind=kindSpec, the rows of app phiegg.
import { apiSend } from '@phi-kit/api';
import { applyKinds } from './fields';

type Tree = { sources: { kind: string; rows: Record<string, unknown>[] }[] };
export async function bootKinds(): Promise<number> {
  const r = await apiSend<Tree>('GET', '/tree?kind=kindSpec');
  return r.ok ? applyKinds(r.body.sources.find((x) => x.kind === 'kindSpec')?.rows ?? []) : 0;
}
