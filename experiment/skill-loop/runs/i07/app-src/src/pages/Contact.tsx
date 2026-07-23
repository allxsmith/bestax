import { useState, type FormEvent } from 'react';
import {
  Box,
  Button,
  Buttons,
  Checkbox,
  Column,
  Columns,
  Container,
  Content,
  Icon,
  IconText,
  Input,
  Notification,
  Paragraph,
  Section,
  Select,
  Span,
  TextArea,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';

const TEAM_SIZES = ['1–10', '11–50', '51–250', '251–1,000', '1,000+'];

const USE_CASES = [
  'Customer support automation',
  'Coding agents',
  'Document and contract analysis',
  'Research and discovery',
  'Something else',
];

const VOLUMES = [
  'Under 50M tokens / month',
  '50M – 500M tokens / month',
  '500M – 5B tokens / month',
  'Over 5B tokens / month',
];

interface Values {
  name: string;
  email: string;
  company: string;
  teamSize: string;
  useCase: string;
  volume: string;
  message: string;
}

const EMPTY: Values = {
  name: '',
  email: '',
  company: '',
  teamSize: '',
  useCase: '',
  volume: '',
  message: '',
};

type Errors = Partial<Record<keyof Values, string>>;

/** No form library ships with bestax — validation is ours to own. */
function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Tell us who you are.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email))
    errors.email = 'Enter a valid work email address.';
  if (!values.company.trim()) errors.company = 'Which company are you with?';
  if (!values.teamSize) errors.teamSize = 'Pick the closest range.';
  if (values.message.trim().length < 20)
    errors.message = 'A sentence or two about the workload helps us route you.';
  return errors;
}

export function Contact() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);
  const [subscribe, setSubscribe] = useState(true);

  const errors = validate(values);
  // Errors only surface after a submit attempt — not while someone is typing.
  const errorFor = (field: keyof Values) =>
    submitted ? errors[field] : undefined;

  const set = (field: keyof Values) => (value: string) =>
    setValues(previous => ({ ...previous, [field]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length === 0) {
      setSent(true);
    }
  };

  return (
    <Section size="medium" className="hero-wash">
      <Container>
        <Columns>
          <Column sizeDesktop={5}>
            <SectionHeading
              eyebrow="Contact sales"
              title="Bring us your hardest evaluation."
              subtitle="We will run your own test set against Skynet, send you every transcript including the failures, and size a plan around what you actually need."
              as="h1"
              size="2"
              mb="5"
            />
            <Content>
              <ul>
                <li>Typical first response: under four business hours.</li>
                <li>
                  Proof-of-concept credits and a solutions architect for
                  qualified pilots.
                </li>
                <li>
                  Security review packet — SOC 2, HIPAA, DPA — available before
                  the first call.
                </li>
              </ul>
            </Content>
            <Paragraph textColor="grey">
              Prefer email?{' '}
              <Span textWeight="semibold">sales@netadyne.example</Span>
            </Paragraph>
          </Column>

          <Column sizeDesktop={7}>
            <Box p="5">
              {sent ? (
                <Notification color="success" mb="0">
                  <Title as="h2" size="5" mb="2">
                    <IconText>
                      <Icon name="circle-check" aria-hidden="true" />
                      <Span>Thanks — that landed.</Span>
                    </IconText>
                  </Title>
                  <Paragraph mb="4">
                    A solutions architect will reply to{' '}
                    <Span textWeight="semibold">{values.email}</Span> within four
                    business hours. This is a demo form, so nothing was actually
                    sent anywhere.
                  </Paragraph>
                  <Button
                    color="success"
                    isInverted
                    onClick={() => {
                      setValues(EMPTY);
                      setSubmitted(false);
                      setSent(false);
                    }}
                  >
                    Send another
                  </Button>
                </Notification>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <Title as="h2" size="4" mb="5">
                    Talk to sales
                  </Title>

                  <Columns>
                    <Column sizeTablet="half">
                      <Input
                        id="contact-name"
                        label="Full name"
                        labelProps={{ htmlFor: 'contact-name' }}
                        placeholder="Ada Lovelace"
                        value={values.name}
                        onChange={event => set('name')(event.target.value)}
                        color={errorFor('name') ? 'danger' : undefined}
                        message={errorFor('name')}
                        messageColor={errorFor('name') ? 'danger' : undefined}
                      />
                    </Column>
                    <Column sizeTablet="half">
                      <Input
                        id="contact-email"
                        type="email"
                        label="Work email"
                        labelProps={{ htmlFor: 'contact-email' }}
                        placeholder="you@company.com"
                        value={values.email}
                        onChange={event => set('email')(event.target.value)}
                        color={errorFor('email') ? 'danger' : undefined}
                        message={errorFor('email')}
                        messageColor={errorFor('email') ? 'danger' : undefined}
                      />
                    </Column>
                  </Columns>

                  <Columns>
                    <Column sizeTablet="half">
                      <Input
                        id="contact-company"
                        label="Company"
                        labelProps={{ htmlFor: 'contact-company' }}
                        placeholder="Acme Corp"
                        value={values.company}
                        onChange={event => set('company')(event.target.value)}
                        color={errorFor('company') ? 'danger' : undefined}
                        message={errorFor('company')}
                        messageColor={
                          errorFor('company') ? 'danger' : undefined
                        }
                      />
                    </Column>
                    <Column sizeTablet="half">
                      <Select
                        id="contact-team-size"
                        label="Team size"
                        labelProps={{ htmlFor: 'contact-team-size' }}
                        isFullwidth
                        value={values.teamSize}
                        onChange={event => set('teamSize')(event.target.value)}
                        color={errorFor('teamSize') ? 'danger' : undefined}
                        message={errorFor('teamSize')}
                        messageColor={
                          errorFor('teamSize') ? 'danger' : undefined
                        }
                      >
                        <option value="">Select a range…</option>
                        {TEAM_SIZES.map(size => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </Select>
                    </Column>
                  </Columns>

                  <Columns>
                    <Column sizeTablet="half">
                      <Select
                        id="contact-use-case"
                        label="Primary use case"
                        labelProps={{ htmlFor: 'contact-use-case' }}
                        isFullwidth
                        value={values.useCase}
                        onChange={event => set('useCase')(event.target.value)}
                      >
                        <option value="">Optional…</option>
                        {USE_CASES.map(useCase => (
                          <option key={useCase} value={useCase}>
                            {useCase}
                          </option>
                        ))}
                      </Select>
                    </Column>
                    <Column sizeTablet="half">
                      <Select
                        id="contact-volume"
                        label="Expected volume"
                        labelProps={{ htmlFor: 'contact-volume' }}
                        isFullwidth
                        value={values.volume}
                        onChange={event => set('volume')(event.target.value)}
                      >
                        <option value="">Optional…</option>
                        {VOLUMES.map(volume => (
                          <option key={volume} value={volume}>
                            {volume}
                          </option>
                        ))}
                      </Select>
                    </Column>
                  </Columns>

                  <TextArea
                    id="contact-message"
                    label="What are you building?"
                    labelProps={{ htmlFor: 'contact-message' }}
                    rows={4}
                    placeholder="We route 40k support conversations a week and want to cut escalations…"
                    value={values.message}
                    onChange={event => set('message')(event.target.value)}
                    color={errorFor('message') ? 'danger' : undefined}
                    message={errorFor('message')}
                    messageColor={errorFor('message') ? 'danger' : undefined}
                  />

                  <Checkbox
                    checked={subscribe}
                    onChange={event => setSubscribe(event.target.checked)}
                    my="4"
                  >
                    <Span ml="2">
                      Send me the Netadyne research digest, monthly.
                    </Span>
                  </Checkbox>

                  {submitted && Object.keys(errors).length > 0 && (
                    <Notification color="danger" isLight mb="4">
                      Some fields need another look before this can be sent.
                    </Notification>
                  )}

                  <Buttons>
                    <Button type="submit" color="primary" size="medium">
                      Send message
                    </Button>
                    <Button
                      type="button"
                      color="text"
                      onClick={() => {
                        setValues(EMPTY);
                        setSubmitted(false);
                      }}
                    >
                      Clear
                    </Button>
                  </Buttons>
                  <Paragraph textSize="7" textColor="grey" mt="4" mb="0">
                    Demo form — nothing is submitted or stored anywhere.
                  </Paragraph>
                </form>
              )}
            </Box>
          </Column>
        </Columns>
      </Container>
    </Section>
  );
}
