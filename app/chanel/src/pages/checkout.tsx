import React from 'react';
import {
  Section, Container, Row, Col, Stack, Title, Text, Button,
  FormGroup, Input, ProgressSteps, Card, CardBody, Callout, Divider,
} from '@pui/components';
import { useCheckout, useCart, AddressList, PaymentList, Price } from '@pui/shop';
import { useRouter } from '../router';
import { routes } from '../lib/routes';
import { t } from '../locales/t';
import { AddressForm } from '../components/address/address-form';
import { PaymentForm } from '../components/payment/payment-form';

const STEP_LABELS: Record<string, string> = {
  contact: t.checkout.stepContact,
  shipping: t.checkout.stepShipping,
  payment: t.checkout.stepPayment,
  review: t.checkout.stepReview,
};

/**
 * Checkout. The step machine, validation and order assembly all live in
 * `useCheckout`; this page renders the fields for the current step.
 */
export const CheckoutPage: React.FC = () => {
  const { navigate } = useRouter();
  const cart = useCart();
  const co = useCheckout();

  const place = async () => {
    const order = await co.place();
    if (order) navigate(routes.checkoutSuccess());
  };

  return (
    <Section>
      <Container size="lg">
        <Stack direction="column" gap={5}>
          <Title level={1}>{t.checkout.title}</Title>

          <ProgressSteps
            steps={co.steps.map((id) => ({ id, label: STEP_LABELS[id] }))}
            activeIndex={co.stepIndex}
            onStepClick={(_i, step) => co.goTo(step.id as typeof co.step)}
          />

          {co.isGuest && <Callout intent="primary">{t.checkout.guestNotice}</Callout>}
          {co.placeError && <Callout intent="error">{co.placeError}</Callout>}

          <Row gap={6} align="start" wrap>
            <Col span={8} fill gap={4}>
              {co.step === 'contact' && (
                <Card>
                  <CardBody>
                    <FormGroup floating label={t.checkout.email} helperText={co.errors.email ?? t.checkout.emailHelp}>
                      <Input
                        type="email"
                        value={co.email}
                        error={Boolean(co.errors.email)}
                        onChange={(e) => co.setEmail(e.target.value)}
                      />
                    </FormGroup>
                  </CardBody>
                </Card>
              )}

              {co.step === 'shipping' && (
                <Stack direction="column" gap={3}>
                  <AddressList
                    variant="row"
                    selectable
                    addresses={co.address.items}
                    selected={false}
                    onSelect={co.address.select}
                    labels={{ default: t.account.default }}
                  />
                  <AddressForm />
                </Stack>
              )}

              {co.step === 'payment' && (
                <Stack direction="column" gap={3}>
                  <PaymentList
                    variant="row"
                    selectable
                    methods={co.payment.items}
                    selected={false}
                    onSelect={co.payment.select}
                    labels={{ default: t.account.default }}
                  />
                  <PaymentForm />
                </Stack>
              )}

              {co.step === 'review' && (
                <Card>
                  <CardBody>
                    <Stack direction="column" gap={3}>
                      <Title level={4}>{t.checkout.reviewTitle}</Title>
                      <Text size="sm" intent="secondary">
                        {t.checkout.shippingTo}: {co.address.selected?.street}, {co.address.selected?.city}
                      </Text>
                      <Text size="sm" intent="secondary">
                        {t.checkout.payingWith}: ···· {co.payment.selected?.lastFour}
                      </Text>
                      <Divider />
                      {cart.items.map((item) => (
                        <Stack key={String(item.id)} direction="row" justify="between">
                          <Text>
                            {item.title} × {item.quantity}
                          </Text>
                          <Price amount={item.price * item.quantity} currency="EUR" />
                        </Stack>
                      ))}
                    </Stack>
                  </CardBody>
                </Card>
              )}

              {/* The actions stand clear of the step above them. */}
              <Stack direction="row" gap={2} justify="between" paddingTop={4}>
                <Button variant="outline" disabled={co.isFirst} onClick={co.back}>
                  {t.checkout.back}
                </Button>
                {co.isLast ? (
                  <Button variant="primary" loading={co.isPlacing} onClick={() => void place()}>
                    {co.isPlacing ? t.checkout.placing : t.checkout.placeOrder}
                  </Button>
                ) : (
                  <Button variant="primary" disabled={!co.canAdvance} onClick={co.next}>
                    {t.checkout.next}
                  </Button>
                )}
              </Stack>
            </Col>

            <Col span={4}>
              <Card>
                <CardBody>
                  <Stack direction="column" gap={2}>
                    <Stack direction="row" justify="between">
                      <Text size="sm">{t.cart.subtotal}</Text>
                      <Text size="sm">{cart.formatted.subtotal}</Text>
                    </Stack>
                    <Stack direction="row" justify="between">
                      <Text size="sm">{t.cart.shipping}</Text>
                      <Text size="sm">{t.cart.shippingFree}</Text>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justify="between">
                      <Text weight="semibold">{t.cart.total}</Text>
                      <Text weight="semibold">{cart.formatted.total}</Text>
                    </Stack>
                  </Stack>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Stack>
      </Container>
    </Section>
  );
};
