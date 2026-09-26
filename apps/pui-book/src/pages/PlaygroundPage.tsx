'use client';

import React, { useMemo, useState } from 'react';
import {
  Row, Col, Stack, Card, CardBody, Title, Text, Tag, Button, Input, Select, Checkbox,
  Radio, Switch, Callout, FormGroup, Divider, Badge, PreferencesModal, usePuiTheme,
} from '@pui/components';
import { Price } from '@pui/shop';
import { Check, Copy, SlidersHorizontal } from 'lucide-react';
import { PageShell } from '../layouts/PageShell';
import { PLAYGROUND_COMPONENTS, toCode, type ComponentSpec } from '../content/playground';
import { Code } from '../components/Code';

/** Initial values for one component, read off its own spec. */
const initialValues = (spec: ComponentSpec): Record<string, unknown> =>
  Object.fromEntries(spec.controls.map((c) => [c.prop, c.initial]));

/**
 * Renders the subject with the values the inspector currently holds. This is
 * the one place that maps a spec id to a real element; everything else in the
 * page is derived from the spec data.
 */
const Preview: React.FC<{ spec: ComponentSpec; values: Record<string, any> }> = ({ spec, values }) => {
  switch (spec.id) {
    case 'button':
      return <Button {...values}>{values.children}</Button>;
    case 'tag':
      return <Tag {...values}>{values.children}</Tag>;
    case 'input':
      return <Input {...values} onChange={() => {}} />;
    case 'select':
      return (
        <Select
          {...values}
          defaultValue="relevance"
          options={[
            { value: 'relevance', label: 'Featured' },
            { value: 'price-asc', label: 'Price, low to high' },
            { value: 'price-desc', label: 'Price, high to low' },
            { value: 'rating', label: 'Best rated' },
          ]}
        />
      );
    case 'checkbox':
      return <Checkbox {...values} onChange={() => {}} />;
    case 'radio':
      return <Radio {...values} onChange={() => {}} />;
    case 'switch':
      return <Switch {...values} onChange={() => {}} />;
    case 'callout':
      return <Callout {...values}>{values.children}</Callout>;
    case 'card':
      return <Card {...values}>{values.children}</Card>;
    case 'price':
      return <Price amount={Number(values.amount)} {...values} />;
    default:
      return null;
  }
};

export const PlaygroundPage: React.FC = () => {
  const [activeId, setActiveId] = useState(PLAYGROUND_COMPONENTS[0].id);
  const spec = PLAYGROUND_COMPONENTS.find((c) => c.id === activeId)!;

  const [store, setStore] = useState<Record<string, Record<string, unknown>>>(() =>
    Object.fromEntries(PLAYGROUND_COMPONENTS.map((c) => [c.id, initialValues(c)]))
  );
  const values = store[activeId];
  const set = (prop: string, value: unknown) =>
    setStore((s) => ({ ...s, [activeId]: { ...s[activeId], [prop]: value } }));

  const [copied, setCopied] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const { theme } = usePuiTheme();

  const code = useMemo(() => toCode(spec, values), [spec, values]);

  const copy = () => {
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => {}
    );
  };

  return (
    <PageShell
      title="Playground"
      description="Every control below is generated from the component's own prop spec, and the snippet is the code that produces what you see."
      badge={<Tag intent="success" round minimal>Live</Tag>}
    >
      <Stack direction="column" gap={4}>
        {/* Subject picker. The list is the spec, so a new component appears
            here by being described rather than by being wired in. */}
        <Stack direction="row" gap={1} wrap>
          {PLAYGROUND_COMPONENTS.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={c.id === activeId ? 'primary' : 'outline'}
              onClick={() => setActiveId(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </Stack>

        <Row gap={4} align="stretch" wrap>
          <Col xs={12} md={4}>
            <Card padding="md">
              <CardBody>
                <Stack direction="column" gap={3}>
                  <Stack direction="row" align="center" justify="between" gap={2}>
                    <Title level={5}>Props</Title>
                    <Badge variant="count">{spec.controls.length}</Badge>
                  </Stack>

                  {spec.controls.map((control) => {
                    if (control.kind === 'boolean') {
                      return (
                        <Switch
                          key={control.prop}
                          label={control.label}
                          checked={Boolean(values[control.prop])}
                          onChange={(e) => set(control.prop, e.target.checked)}
                        />
                      );
                    }
                    if (control.kind === 'text') {
                      return (
                        <FormGroup key={control.prop} label={control.label}>
                          <Input
                            value={String(values[control.prop] ?? '')}
                            onChange={(e) => set(control.prop, e.target.value)}
                          />
                        </FormGroup>
                      );
                    }
                    const options =
                      control.kind === 'number'
                        ? control.options.map((n) => ({ value: n, label: String(n) }))
                        : control.options.map((o) => ({ value: o, label: o }));
                    return (
                      <FormGroup key={control.prop} label={control.label}>
                        <Select
                          value={values[control.prop] as string | number}
                          options={options}
                          onChange={(e) =>
                            set(control.prop, control.kind === 'number' ? Number(e.target.value) : e.target.value)
                          }
                        />
                      </FormGroup>
                    );
                  })}

                  <Divider />

                  <Button
                    variant="outline"
                    size="sm"
                    icon={<SlidersHorizontal size={14} />}
                    onClick={() => setPrefsOpen(true)}
                  >
                    Theme &amp; density
                  </Button>
                </Stack>
              </CardBody>
            </Card>
          </Col>

          <Col xs={12} md={8}>
            <Stack direction="column" gap={4}>
              <Card padding="lg">
                <CardBody>
                  <Stack direction="column" gap={3}>
                    <Stack direction="row" align="center" justify="between" gap={2}>
                      <Title level={5}>{spec.name}</Title>
                      <Tag size="sm" minimal>{theme}</Tag>
                    </Stack>
                    <Text size="sm" intent="secondary">{spec.summary}</Text>
                    <Divider />
                    <Stack direction="row" align="center" justify="center" gap={3} wrap>
                      <Preview spec={spec} values={values} />
                    </Stack>
                  </Stack>
                </CardBody>
              </Card>

              <Card padding="md" variant="flat">
                <CardBody>
                  <Stack direction="column" gap={2}>
                    <Stack direction="row" align="center" justify="between" gap={2}>
                      <Title level={6}>Code</Title>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copy}
                        icon={copied ? <Check size={14} /> : <Copy size={14} />}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </Stack>
                    <Code>{code}</Code>
                  </Stack>
                </CardBody>
              </Card>
            </Stack>
          </Col>
        </Row>
      </Stack>

      <PreferencesModal isOpen={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </PageShell>
  );
};
