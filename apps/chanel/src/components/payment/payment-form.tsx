import React from 'react';
import { Card, CardBody, Stack, Title, Button, FormGroup, Input, Row, Col } from '@pui/components';
import { usePaymentMethods, useForm, validators } from '@pui/shop';
import { t } from '../../locales/t';

const v = validators({
  required: t.checkout.requiredField,
  email: t.checkout.invalidEmail,
  card: t.checkout.invalidCard,
  expiry: t.checkout.invalidExpiry,
  postalCode: t.checkout.invalidPostal,
});

/**
 * Capture a card. Only the last four digits and the detected brand are ever
 * stored — the shop module strips the rest before it reaches the store.
 */
export const PaymentForm: React.FC<{ onSaved?: (id: string) => void }> = ({ onSaved }) => {
  const methods = usePaymentMethods();
  const form = useForm(
    { cardholderName: '', cardNumber: '', expiry: '' },
    { cardholderName: v.required, cardNumber: v.card, expiry: v.expiry }
  );

  const submit = () => {
    if (!form.validate()) return;
    const id = methods.add(form.values);
    form.reset();
    onSaved?.(id);
  };

  return (
    <Card>
      <CardBody>
        <Stack direction="column" gap={3}>
          <Title level={5}>{t.checkout.addCard}</Title>

          <FormGroup floating label={t.checkout.cardholder} helperText={form.errors.cardholderName}>
            <Input
              value={form.values.cardholderName}
              error={Boolean(form.errors.cardholderName)}
              onChange={(e) => form.setField('cardholderName', e.target.value)}
            />
          </FormGroup>

          <FormGroup floating label={t.checkout.cardNumber} helperText={form.errors.cardNumber}>
            <Input
              value={form.values.cardNumber}
              inputMode="numeric"
              autoComplete="cc-number"
              error={Boolean(form.errors.cardNumber)}
              onChange={(e) => form.setField('cardNumber', e.target.value)}
            />
          </FormGroup>

          <Row gap={3}>
            <Col span={6}>
              <FormGroup floating label={t.checkout.expiry} helperText={form.errors.expiry}>
                <Input
                  value={form.values.expiry}
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                  error={Boolean(form.errors.expiry)}
                  onChange={(e) => form.setField('expiry', e.target.value)}
                />
              </FormGroup>
            </Col>
          </Row>

          <Stack direction="row">
            <Button variant="primary" onClick={submit}>
              {t.checkout.saveCard}
            </Button>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
};
