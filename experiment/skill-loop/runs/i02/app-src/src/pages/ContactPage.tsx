import { useState } from 'react';
import {
  Block,
  Box,
  Button,
  Buttons,
  Checkbox,
  Column,
  Columns,
  Container,
  Content,
  Field,
  Hero,
  Icon,
  IconText,
  Input,
  Notification,
  Paragraph,
  Section,
  Select,
  Span,
  Strong,
  SubTitle,
  TextArea,
  Title,
} from '@allxsmith/bestax-bulma';

interface FormState {
  name: string;
  email: string;
  company: string;
  useCase: string;
  volume: string;
  message: string;
  consent: boolean;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  company: '',
  useCase: '',
  volume: '',
  message: '',
  consent: false,
};

const USE_CASES = [
  'Coding agents',
  'Customer support',
  'Document analysis',
  'Research',
  'Data extraction',
  'Something else',
];

const VOLUMES = [
  'Under 10M tokens / month',
  '10M – 100M tokens / month',
  '100M – 1B tokens / month',
  'Over 1B tokens / month',
];

type Errors = Partial<Record<keyof FormState, string>>;

// No validation library ships with bestax — errors are computed here and fed
// back through each input's color / message / messageColor props.
function validate(values: FormState): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Tell us who to reply to.';
  if (!values.email.trim()) {
    errors.email = 'A work email is required.';
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
    errors.email = 'That does not look like an email address.';
  }
  if (!values.company.trim()) errors.company = 'Company or team name, please.';
  if (!values.useCase) errors.useCase = 'Pick the closest use case.';
  if (!values.volume) errors.volume = 'A rough estimate is fine.';
  if (!values.consent) {
    errors.consent = 'We need permission to email you back.';
  }
  return errors;
}

export default function ContactPage() {
  const [values, setValues] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);

  const errors = validate(values);
  // Errors only surface after a submit attempt, so the form isn't red on load.
  const shown: Errors = submitted ? errors : {};

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setValues(current => ({ ...current, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length === 0) {
      setDone(true);
      setValues(EMPTY);
      setSubmitted(false);
    }
  };

  return (
    <>
      <Hero size="small" className="hero-backdrop">
        <Hero.Body>
          <Container>
            <Title size="1">Request access</Title>
            <SubTitle size="4" textColor="grey" mt="4">
              Tell us what you are building. Solutions engineering replies
              within one business day, usually with a benchmark suggestion.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Columns>
            <Column sizeDesktop={7}>
              <Box>
                {done && (
                  <Notification
                    color="success"
                    isLight
                    onDelete={() => setDone(false)}
                  >
                    <Strong>Request received.</Strong> Check your inbox for a
                    sandbox key and $25 in credits. (Demo form — nothing was
                    actually sent.)
                  </Notification>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <Columns>
                    <Column sizeTablet="half">
                      <Input
                        label="Full name"
                        value={values.name}
                        onChange={event => set('name', event.target.value)}
                        placeholder="Ada Okonjo"
                        iconLeftName="user"
                        color={shown.name ? 'danger' : undefined}
                        message={shown.name}
                        messageColor={shown.name ? 'danger' : undefined}
                      />
                    </Column>
                    <Column sizeTablet="half">
                      <Input
                        label="Work email"
                        type="email"
                        value={values.email}
                        onChange={event => set('email', event.target.value)}
                        placeholder="ada@company.com"
                        iconLeftName="envelope"
                        color={shown.email ? 'danger' : undefined}
                        message={shown.email}
                        messageColor={shown.email ? 'danger' : undefined}
                      />
                    </Column>
                  </Columns>

                  <Input
                    label="Company"
                    value={values.company}
                    onChange={event => set('company', event.target.value)}
                    placeholder="Halcyon Logistics"
                    iconLeftName="building"
                    color={shown.company ? 'danger' : undefined}
                    message={shown.company}
                    messageColor={shown.company ? 'danger' : undefined}
                  />

                  <Columns>
                    <Column sizeTablet="half">
                      <Select
                        label="Primary use case"
                        value={values.useCase}
                        onChange={event => set('useCase', event.target.value)}
                        isExpanded
                        color={shown.useCase ? 'danger' : undefined}
                        message={shown.useCase}
                        messageColor={shown.useCase ? 'danger' : undefined}
                      >
                        <option value="">Choose one…</option>
                        {USE_CASES.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    </Column>
                    <Column sizeTablet="half">
                      <Select
                        label="Expected volume"
                        value={values.volume}
                        onChange={event => set('volume', event.target.value)}
                        isExpanded
                        color={shown.volume ? 'danger' : undefined}
                        message={shown.volume}
                        messageColor={shown.volume ? 'danger' : undefined}
                      >
                        <option value="">Choose one…</option>
                        {VOLUMES.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    </Column>
                  </Columns>

                  <TextArea
                    label="What are you building?"
                    rows={5}
                    value={values.message}
                    onChange={event => set('message', event.target.value)}
                    placeholder="We run an incident triage agent over ~40k tickets a month and want to cut false escalations."
                    message="Optional, but it gets you a better first reply."
                  />

                  <Field mt="4">
                    <Checkbox
                      checked={values.consent}
                      onChange={event => set('consent', event.target.checked)}
                      color={shown.consent ? 'danger' : undefined}
                    >
                      <Span ml="2">
                        Netadyne may email me about this request.
                      </Span>
                    </Checkbox>
                    {shown.consent && (
                      <Paragraph
                        textColor="danger"
                        textSize="7"
                        mt="2"
                        role="alert"
                      >
                        {shown.consent}
                      </Paragraph>
                    )}
                  </Field>

                  <Buttons mt="5">
                    <Button color="primary" size="medium" type="submit">
                      <Icon name="paper-plane" aria-hidden="true" />
                      <span>Send request</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setValues(EMPTY);
                        setSubmitted(false);
                        setDone(false);
                      }}
                    >
                      Clear
                    </Button>
                  </Buttons>
                </form>
              </Box>
            </Column>

            <Column sizeDesktop={5}>
              <Box>
                <Title size="5" mb="4">
                  What happens next
                </Title>
                <Content textColor="grey">
                  <ol>
                    <li>A sandbox key lands in your inbox with $25 in credits.</li>
                    <li>
                      We send an eval harness matched to the use case you picked.
                    </li>
                    <li>
                      If the numbers hold up, a solutions engineer scopes
                      provisioned throughput.
                    </li>
                  </ol>
                </Content>
              </Box>

              <Box mt="5">
                <Title size="5" mb="4">
                  Other ways in
                </Title>
                <Block mb="3">
                  <IconText
                    iconProps={{ name: 'envelope', 'aria-hidden': 'true' }}
                  >
                    sales@netadyne.example
                  </IconText>
                </Block>
                <Block mb="3">
                  <IconText
                    iconProps={{ name: 'life-ring', 'aria-hidden': 'true' }}
                  >
                    support@netadyne.example
                  </IconText>
                </Block>
                <Block mb="3">
                  <IconText
                    iconProps={{ name: 'shield-halved', 'aria-hidden': 'true' }}
                  >
                    security@netadyne.example
                  </IconText>
                </Block>
                <Block>
                  <IconText
                    iconProps={{ name: 'location-dot', 'aria-hidden': 'true' }}
                  >
                    Sunnyvale · London · Singapore
                  </IconText>
                </Block>
              </Box>

              <Notification color="info" isLight mt="5">
                This is a template form. Nothing is submitted anywhere, and
                Netadyne is not a real company.
              </Notification>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
