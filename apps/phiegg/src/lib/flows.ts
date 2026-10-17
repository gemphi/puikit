// Studio flows: a scenario (data/scenarios.json) with your items linked to its steps, your persona (voice, audience),
// the greeting and the customer agent. One `/state/flows` document; saving is recorded (lib/activity).
import { persisted } from '@phi-kit/api';
import scenariosJson from '../data/scenarios.json';
import { record } from './activity';
import type { ID } from '../types/phiegg';

export type StepType = 'pft' | 'egg' | 'sum' | 'host' | 'title' | 'agent' | 'profile';
export type Step = { id: string; type: StepType; kind?: string; label: string; hint: string };
export type Scenario = { id: string; title: string; summary: string; steps: Step[]; greeting: Record<string, string>; model: { visitors: number; gateConversion: number; lookConversion: number } };
export const SC = scenariosJson as unknown as { voices: string[]; audiences: string[]; scenarios: Scenario[] };
export type Flow = { id: string; scenarioId: string; picks: Record<string, ID>; voice: string; audience: string; greeting: string; agentId: ID; at: number };

const F = persisted<Flow[]>('flows', []);
export const useFlows = () => F.use();
export function saveFlow(f: Omit<Flow, 'id' | 'at'>) { const flow = { ...f, id: 'fl' + Date.now().toString(36), at: Date.now() }; F.set([flow, ...F.get()].slice(0, 64)); record('save', flow.id, { refKind: 'flow', note: f.scenarioId }); return flow; }
export const removeFlow = (id: string) => F.set(F.get().filter((x) => x.id !== id));
/** The greeting with its names filled in. */
export const fill = (text: string, names: Record<string, string>) => text.replace(/\{(\w+)\}/g, (m, k) => names[k] ?? m);
