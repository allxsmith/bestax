import { useState } from 'react';
import {
  Section,
  Container,
  Columns,
  Column,
  Box,
  Title,
  SubTitle,
  Input,
  Button,
  Notification,
  Span,
} from '@allxsmith/bestax-bulma';

export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const error =
    touched && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
      ? 'Please enter a valid work email.'
      : undefined;

  return (
    <Section id="waitlist">
      <Container>
        <Columns isCentered>
          <Column size="half" sizeTablet="two-thirds" sizeDesktop="half">
            <Box textAlign="centered" p="6">
              <Title size="2">Get API access to SkyNet</Title>
              <SubTitle size="5" textColor="grey" mt="3">
                Join the developer waitlist. Free tier, no card required —
                start building on the frontier today.
              </SubTitle>

              {submitted ? (
                <Notification color="primary" isLight mt="5">
                  <Span textWeight="semibold">You&rsquo;re on the list.</Span>{' '}
                  We&rsquo;ll email <Span textWeight="semibold">{email}</Span>{' '}
                  your API keys shortly.
                </Notification>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    setTouched(true);
                    if (!error && email) setSubmitted(true);
                  }}
                >
                  <Input
                    label="Work email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    color={error ? 'danger' : undefined}
                    message={error}
                    messageColor={error ? 'danger' : undefined}
                    mt="4"
                  />
                  <Button
                    color="primary"
                    size="large"
                    isFullWidth
                    type="submit"
                    mt="4"
                  >
                    Request access
                  </Button>
                  <Span
                    textSize="7"
                    textColor="grey"
                    display="block"
                    mt="3"
                  >
                    By requesting access you agree to Netadyne&rsquo;s
                    acceptable use policy.
                  </Span>
                </form>
              )}
            </Box>
          </Column>
        </Columns>
      </Container>
    </Section>
  );
}
