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
        <Select defaultValue="finance">
          <option value="finance">FinanceTransaction (Axiom Topos)</option>
          <option value="geo">GeoProperty (Geotemporal Series)</option>
          <option value="media">MediaProperty (Multi-Modal Stream)</option>
        </Select>
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
