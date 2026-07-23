import { useState } from 'react';
import {
  Box,
  Button,
  Buttons,
  Checkbox,
  Column,
  Columns,
  Container,
  Hero,
  Icon,
  IconText,
  Input,
  Notification,
  Section,
  Select,
  Span,
  TextArea,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';

const USE_CASES = [
  'Coding agents and developer tools',
  'Customer support automation',
  'Document analysis and extraction',
  'Research and data science',
  'Regulated / on-premise deployment',
  'Something else',
];

const VOLUMES = [
  'Under 10M tokens / month',
  '10M – 500M tokens / month',
  '500M – 10B tokens / month',
  'Over 10B tokens / month',
  'Not sure yet',
];

interface Values {
  name: string;
  email: string;
  company: string;
  useCase: string;
  volume: string;
  message: string;
}

const EMPTY: Values = {
  name: '',
  email: '',
  company: '',
  useCase: '',
  volume: '',
  message: '',
};

type Errors = Partial<Record<keyof Values | 'terms', string>>;

const FREE_EMAIL = /@(gmail|yahoo|hotmail|outlook|icloud|proton)\./i;

function validate(values: Values, terms: boolean): Errors {
  const errors: Errors = {};

  if (!values.name.trim()) errors.name = 'Tell us who you are.';

  if (!values.email.trim()) {
    errors.email = 'A work email address is required.';
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
    errors.email = 'That does not look like an email address.';
  } else if (FREE_EMAIL.test(values.email)) {
    errors.email = 'Please use your work address so we can find your account.';
  }

  if (!values.company.trim()) errors.company = 'Company or team name, please.';
  if (!values.useCase) errors.useCase = 'Pick the closest match.';
  if (values.message.trim().length > 0 && values.message.trim().length < 20) {
    errors.message = 'A sentence or two helps us route this correctly.';
  }
  if (!terms) errors.terms = 'Please accept the terms to continue.';

  return errors;
}

export function ContactPage() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);

  const errors = validate(values, terms);
  const show = (field: keyof Errors) =>
    (touched[field] || submitted) && errors[field] ? errors[field] : undefined;

  const set = (field: keyof Values) => (value: string) =>
    setValues(previous => ({ ...previous, [field]: value }));

  const blur = (field: keyof Errors) => () =>
    setTouched(previous => ({ ...previous, [field]: true }));

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length === 0) {
      // Demo site: no backend. A real deployment posts to the CRM here.
      setSent(true);
      setValues(EMPTY);
      setTerms(false);
      setTouched({});
      setSubmitted(false);
    }
  };

  return (
    <>
      <Hero size="small" className="hero-wash">
        <Hero.Body>
          <Container>
            <SectionHeading
              as="h1"
              align="left"
              eyebrow="Get access"
              title="Start with Skynet"
              lede="Teams under 50 seats are provisioned same-day. Larger deployments get a solutions architect on the first call."
            />
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="medium">
        <Container>
          <Columns>
            <Column sizeDesktop={7}>
              <Box p="5">
                {sent && (
                  <Notification
                    color="success"
                    isLight
                    onDelete={() => setSent(false)}
                  >
                    <strong>Request received.</strong> A solutions engineer will
                    reply within one business day with your key and $5 in
                    credits.
                  </Notification>
                )}

                <Title as="h2" size="4" mb="5">
                  Request API access
                </Title>

                <form onSubmit={onSubmit} noValidate>
                  <Columns>
                    <Column sizeTablet="half">
                      <Input
                        label="Full name"
                        value={values.name}
                        onChange={event => set('name')(event.target.value)}
                        onBlur={blur('name')}
                        placeholder="Ada Lovelace"
                        iconLeftName="user"
                        color={show('name') ? 'danger' : undefined}
                        message={show('name')}
                        messageColor="danger"
                      />
                    </Column>
                    <Column sizeTablet="half">
                      <Input
                        label="Work email"
                        type="email"
                        value={values.email}
                        onChange={event => set('email')(event.target.value)}
                        onBlur={blur('email')}
                        placeholder="ada@yourcompany.com"
                        iconLeftName="envelope"
                        color={show('email') ? 'danger' : undefined}
                        message={show('email')}
                        messageColor="danger"
                      />
                    </Column>
                  </Columns>

                  <Columns>
                    <Column sizeTablet="half">
                      <Input
                        label="Company"
                        value={values.company}
                        onChange={event => set('company')(event.target.value)}
                        onBlur={blur('company')}
                        placeholder="Halcyon Logistics"
                        iconLeftName="building"
                        color={show('company') ? 'danger' : undefined}
                        message={show('company')}
                        messageColor="danger"
                      />
                    </Column>
                    <Column sizeTablet="half">
                      <Select
                        label="Expected volume"
                        value={values.volume}
                        onChange={event => set('volume')(event.target.value)}
                        isFullwidth
                      >
                        <option value="">Select one (optional)</option>
                        {VOLUMES.map(volume => (
                          <option key={volume} value={volume}>
                            {volume}
                          </option>
                        ))}
                      </Select>
                    </Column>
                  </Columns>

                  <Select
                    label="Primary use case"
                    value={values.useCase}
                    onChange={event => set('useCase')(event.target.value)}
                    onBlur={blur('useCase')}
                    isFullwidth
                    color={show('useCase') ? 'danger' : undefined}
                    message={show('useCase')}
                    messageColor="danger"
                  >
                    <option value="">Select one</option>
                    {USE_CASES.map(useCase => (
                      <option key={useCase} value={useCase}>
                        {useCase}
                      </option>
                    ))}
                  </Select>

                  <TextArea
                    label="What are you building?"
                    value={values.message}
                    onChange={event => set('message')(event.target.value)}
                    onBlur={blur('message')}
                    rows={5}
                    placeholder="Optional — but the more we know, the better the first call goes."
                    color={show('message') ? 'danger' : undefined}
                    message={show('message')}
                    messageColor="danger"
                  />

                  <Checkbox
                    checked={terms}
                    onChange={event => {
                      setTerms(event.target.checked);
                      setTouched(previous => ({ ...previous, terms: true }));
                    }}
                    mt="4"
                  >
                    <Span ml="2">
                      I agree to the Netadyne acceptable use policy and to being
                      contacted about this request.
                    </Span>
                  </Checkbox>
                  {show('terms') && (
                    <Span
                      display="block"
                      textColor="danger"
                      textSize="7"
                      mt="2"
                    >
                      {show('terms')}
                    </Span>
                  )}

                  <Buttons mt="5">
                    <Button type="submit" color="primary" size="medium">
                      Request access
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setValues(EMPTY);
                        setTerms(false);
                        setTouched({});
                        setSubmitted(false);
                      }}
                    >
                      Clear
                    </Button>
                  </Buttons>
                </form>
              </Box>
            </Column>

            <Column sizeDesktop={5}>
              <Box p="5">
                <Title as="h2" size="5" mb="4">
                  Other ways in
                </Title>
                <IconText mb="4">
                  <Icon name="envelope" textColor="primary" aria-hidden />
                  <Span>sales@netadyne.ai</Span>
                </IconText>
                <IconText mb="4">
                  <Icon name="life-ring" textColor="primary" aria-hidden />
                  <Span>support@netadyne.ai — 24/7 on Scale and above</Span>
                </IconText>
                <IconText mb="4">
                  <Icon name="shield-halved" textColor="primary" aria-hidden />
                  <Span>security@netadyne.ai — PGP key on the docs site</Span>
                </IconText>
                <IconText>
                  <Icon name="location-dot" textColor="primary" aria-hidden />
                  <Span>1104 Rainier Ave, Seattle, WA 98144</Span>
                </IconText>
              </Box>

              <Box p="5" mt="4">
                <Title as="h2" size="5" mb="3">
                  What happens next
                </Title>
                <Span display="block" textColor="grey" mb="3">
                  1. We provision a project and send a key with $5 in credits.
                </Span>
                <Span display="block" textColor="grey" mb="3">
                  2. You run the eval harness against your own workload.
                </Span>
                <Span display="block" textColor="grey">
                  3. If the numbers hold up, we talk about capacity. If they do
                  not, we want the trace.
                </Span>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
