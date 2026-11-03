import React from 'react';
import { Drawer, Input, Select, StepForm, type StepFormStep, Stack, TabList, Text, Textarea } from '@pui/components';
import { CircleUser, MapPin, CreditCard, ClipboardCheck } from 'lucide-react';

type Form = {
  displayName: string; handle: string; email: string;
  line1: string; city: string; region: string; postcode: string;
  method: string; reference: string;
};
const EMPTY: Form = { displayName: '', handle: '', email: '', line1: '', city: '', region: 'Opalia', postcode: '', method: 'PhiWallet', reference: '' };
const REGIONS = ['Opalia', 'Lora Land', 'Lumen', 'Satin Reach', 'Velour'];
const METHODS = ['PhiWallet', 'Card', 'Bank transfer'];

/**
 * Enrol a PhiOne identity: the same {@link StepForm} the rest of the house uses, so register, address and payment
 * wear the identical rail, icons, active highlight and bordered field groups as every other form. Declared here as
 * fields; the walk, the layout and the full-screen expand all come from the shared component.
 */
export const EnrollFlow: React.FC<{ isOpen: boolean; onClose: () => void; onDone: (f: Form) => void; busy?: boolean }> = ({ isOpen, onClose, onDone, busy }) => {
  const [f, setF] = React.useState<Form>(EMPTY);
  const set = (k: keyof Form) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  React.useEffect(() => { if (isOpen) setF(EMPTY); }, [isOpen]);
  if (!isOpen) return null;

  const hint = (parts: Array<string | undefined>) => { const l = parts.filter(Boolean).join(' · '); return l ? (l.length > 36 ? l.slice(0, 35) + '…' : l) : undefined; };

  const steps: StepFormStep[] = [
    {
      id: 'account', label: 'Register', icon: <CircleUser size={16} />, title: 'Register', lede: 'Who the identity is on PhiOne.',
      hint: hint([f.displayName, f.handle && '@' + f.handle]),
      fields: [
        { label: 'Display name', control: <Input value={f.displayName} onChange={(e) => set('displayName')(e.target.value)} placeholder="Noor Hale" /> },
        { label: 'Handle', control: <Input value={f.handle} onChange={(e) => set('handle')(e.target.value)} placeholder="noor.hale" /> },
        { label: 'Email', full: true, control: <Input value={f.email} onChange={(e) => set('email')(e.target.value)} placeholder="noor@maisonopal.phi" /> },
      ],
    },
    {
      id: 'address', label: 'Address', icon: <MapPin size={16} />, title: 'Address', lede: 'Where the identity is based.',
      hint: hint([f.city, f.region]),
      fields: [
        { label: 'Address line', full: true, control: <Input value={f.line1} onChange={(e) => set('line1')(e.target.value)} placeholder="12 Opal Row" /> },
        { label: 'City', control: <Input value={f.city} onChange={(e) => set('city')(e.target.value)} placeholder="Opalia" /> },
        { label: 'Region', control: <Select value={f.region} onChange={(e) => set('region')(e.target.value)} options={REGIONS.map((r) => ({ value: r, label: r }))} /> },
        { label: 'Postcode', control: <Input value={f.postcode} onChange={(e) => set('postcode')(e.target.value)} placeholder="OP-2211" /> },
      ],
    },
    {
      id: 'payment', label: 'Payment', icon: <CreditCard size={16} />, title: 'Payment', lede: 'How the identity settles on Phiora.',
      hint: hint([f.method]),
      fields: [
        { label: 'Method', full: true, control: <TabList size="sm" variant="pills" activeId={f.method} onChange={(id) => set('method')(String(id))} items={METHODS.map((m) => ({ id: m, label: m }))} /> },
        { label: 'Reference', full: true, control: <Textarea value={f.reference} rows={3} onChange={(e) => set('reference')(e.target.value)} placeholder="Wallet address or account reference" /> },
      ],
    },
    {
      id: 'review', label: 'Review', icon: <ClipboardCheck size={16} />, title: 'Review', lede: 'Confirm and enrol.',
      content: <Stack direction="column" gap={2}>
        {[['Name', f.displayName || '·'], ['Handle', f.handle ? '@' + f.handle : '·'], ['Email', f.email || '·'],
          ['Address', [f.line1, f.city, f.region, f.postcode].filter(Boolean).join(', ') || '·'], ['Payment', f.method + (f.reference ? ' · ' + f.reference : '')]].map(([k, v]) => (
          <Stack key={k} direction="row" justify="between" gap={3}><Text size="sm" intent="muted">{k}</Text><Text size="sm" truncate>{v}</Text></Stack>
        ))}
      </Stack>,
    },
  ];

  return (
    <Drawer isOpen onClose={onClose} position="right" size="lg" expandable title="Enrol identity">
      <StepForm steps={steps} onSubmit={() => onDone(f)} submitLabel="Enrol" onCancel={onClose} busy={busy}
        title="Enrol identity" sub="Register, address and payment, on the shared form." fill />
    </Drawer>
  );
};
