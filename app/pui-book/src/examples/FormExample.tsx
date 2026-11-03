'use client';

import React, { useState } from 'react';
import { FormGroup, Input, Select, Switch, Slider, Stack } from '@pui/components';

export const FormExample: React.FC = () => {
  const [switchVal, setSwitchVal] = useState(true);
  const [sliderVal, setSliderVal] = useState(72);

  return (
    <Stack direction="column" gap={3}>
      <FormGroup label="Agent Node ID" helperText="Unique identifier across GemPhi mesh">
        <Input placeholder="e.g. phigen-alpha" defaultValue="phigen-alpha" />
      </FormGroup>

      <FormGroup label="Ontology Domain Schema">
        <Select defaultValue="finance" options={[
          { value: 'finance', label: 'FinanceTransaction (Axiom Topos)' },
          { value: 'geo', label: 'GeoProperty (Geotemporal Series)' },
          { value: 'media', label: 'MediaProperty (Multi-Modal Stream)' },
        ]} />
      </FormGroup>

      <FormGroup label="Kuramoto Real-Time Phase Coupling">
        <Switch
          label="Enable Continuous Phase Entrainment"
          checked={switchVal}
          onChange={(e) => setSwitchVal(e.target.checked)}
        />
      </FormGroup>

      <FormGroup label={`Harmonic Resonance Threshold: ${sliderVal}%`}>
        <Slider
          min={0}
          max={100}
          value={sliderVal}
          onChange={setSliderVal}
        />
      </FormGroup>
    </Stack>
  );
};
