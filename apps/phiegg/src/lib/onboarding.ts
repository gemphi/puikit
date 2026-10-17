import { persisted } from '@phi-kit/api';

/** Offline sign-in (site.signin flow): provider, role and whether it was finished. Phiora `/state/onboarding` when VITE_PHI_API is set. */
export type Onboarding = { done: boolean; provider: string; role: string };
export const ONBOARDING = persisted<Onboarding>('onboarding', { done: false, provider: '', role: '' });
export const useOnboarding = () => ONBOARDING.use();
