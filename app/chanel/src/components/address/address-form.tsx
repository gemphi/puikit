import React from 'react';
import { Card, CardBody, Stack, Row, Col, Title, Button, FormGroup, Input } from '@pui/components';
import { useAddressBook, useForm, validators } from '@pui/shop';
import { t } from '../../locales/t';

const v = validators({
  required: t.checkout.requiredField,
  email: t.checkout.invalidEmail,
  card: t.checkout.invalidCard,
  expiry: t.checkout.invalidExpiry,
  postalCode: t.checkout.invalidPostal,
});

/** Capture a shipping address. Validation rules come from the shop module. */
export const AddressForm: React.FC<{ onSaved?: (id: string) => void }> = ({ onSaved }) => {
  const book = useAddressBook();
  const form = useForm(
    { recipient: '', street: '', city: '', postalCode: '', country: '' },
    {
      recipient: v.required,
      street: v.required,
      city: v.required,
      postalCode: v.postalCode,
      country: v.required,
    }
  );

  const submit = () => {
    if (!form.validate()) return;
    const id = book.add(form.values);
    form.reset();
    onSaved?.(id);
  };

  return (
    <Card>
      <CardBody>
        <Stack direction="column" gap={3}>
          <Title level={5}>{t.checkout.addAddress}</Title>

          <FormGroup floating label={t.checkout.recipient} helperText={form.errors.recipient}>
            <Input
              value={form.values.recipient}
              error={Boolean(form.errors.recipient)}
              onChange={(e) => form.setField('recipient', e.target.value)}
            />
          </FormGroup>

          <FormGroup floating label={t.checkout.street} helperText={form.errors.street}>
            <Input
              value={form.values.street}
              error={Boolean(form.errors.street)}
              onChange={(e) => form.setField('street', e.target.value)}
            />
          </FormGroup>

          {/* City and postcode belong on one row; the grid's gap keeps them
              apart instead of per-field margins. */}
          <Row gap={3} align="start" wrap>
            <Col xs={12} md={7}>
              <FormGroup floating label={t.checkout.city} helperText={form.errors.city}>
                <Input
                  value={form.values.city}
                  error={Boolean(form.errors.city)}
                  onChange={(e) => form.setField('city', e.target.value)}
                />
              </FormGroup>
            </Col>
            <Col xs={12} md={5}>
              <FormGroup floating label={t.checkout.postalCode} helperText={form.errors.postalCode}>
                <Input
                  value={form.values.postalCode}
                  error={Boolean(form.errors.postalCode)}
                  onChange={(e) => form.setField('postalCode', e.target.value)}
                />
              </FormGroup>
            </Col>
          </Row>

          <FormGroup floating label={t.checkout.country} helperText={form.errors.country}>
            <Input
              value={form.values.country}
              error={Boolean(form.errors.country)}
              onChange={(e) => form.setField('country', e.target.value)}
            />
          </FormGroup>

          <Stack direction="row">
            <Button variant="primary" onClick={submit}>
              {t.checkout.saveAddress}
            </Button>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
};
