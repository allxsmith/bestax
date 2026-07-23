import { useState } from 'react';
import {
  Block,
  Box,
  Button,
  Checkbox,
  Column,
  Columns,
  Container,
  Content,
  Field,
  IconText,
  Input,
  Notification,
  Section,
  Select,
  TextArea,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHead } from '../components/SectionHead';

interface Values {
  name: string;
  email: string;
  company: string;
  model: string;
  volume: string;
  message: string;
  agree: boolean;
}

const EMPTY: Values = {
  name: '',
  email: '',
  company: '',
  model: '',
  volume: '',
  message: '',
  agree: false,
};

function validate(values: Values) {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (!values.name.trim()) errors.name = 'Tell us who you are.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email))
    errors.email = 'Enter a work email we can reply to.';
  if (!values.company.trim()) errors.company = 'Company is required.';
  if (!values.model) errors.model = 'Pick the model you want to start with.';
  if (values.message.trim().length < 20)
    errors.message = 'A sentence or two about the workload, please.';
  if (!values.agree) errors.agree = 'We need consent to reply to you.';
  return errors;
}

const CONTACTS = [
  {
    icon: 'envelope',
    label: 'Sales',
    value: 'sales@netadyne.ai',
    note: 'Volume pricing, procurement, security review.',
  },
  {
    icon: 'code',
    label: 'Developer support',
    value: 'support@netadyne.ai',
    note: 'API behaviour, SDKs, rate limits. Under an hour on Scale.',
  },
  {
    icon: 'shield-halved',
    label: 'Security',
    value: 'security@netadyne.ai',
    note: 'Disclosure, trust centre access, sub-processor list.',
  },
];

export function Contact() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);

  const errors = validate(values);
  const show = (key: keyof Values) => (submitted ? errors[key] : undefined);
  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues(prev => ({ ...prev, [key]: value }));

  return (
    <Section size="medium">
      <Container>
        <SectionHead
          eyebrow="Get started"
          title="Get API access"
          subtitle="Free-tier keys are issued instantly. Everything else — volume pricing, provisioned throughput, an Edge licence — starts with this form."
        />

        <Columns>
          <Column sizeDesktop={7}>
            <Box>
              {sent ? (
                <Notification color="success" isLight>
                  <IconText
                    iconProps={{ name: 'circle-check', 'aria-hidden': 'true' }}
                    textWeight="semibold"
                  >
                    Request received
                  </IconText>
                  <Content mt="3">
                    <p>
                      Thanks, {values.name.split(' ')[0] || 'there'}. A solutions
                      engineer will reply to {values.email} within one business
                      day, usually with a sandbox key attached.
                    </p>
                  </Content>
                  <Button
                    color="success"
                    isOutlined
                    onClick={() => {
                      setValues(EMPTY);
                      setSubmitted(false);
                      setSent(false);
                    }}
                  >
                    Send another request
                  </Button>
                </Notification>
              ) : (
                <form
                  noValidate
                  onSubmit={event => {
                    event.preventDefault();
                    setSubmitted(true);
                    if (Object.keys(errors).length === 0) setSent(true);
                  }}
                >
                  <Columns>
                    <Column sizeTablet={6}>
                      <Input
                        label="Name"
                        value={values.name}
                        onChange={e => set('name', e.target.value)}
                        color={show('name') ? 'danger' : undefined}
                        message={show('name')}
                        messageColor="danger"
                        iconLeftName="user"
                        placeholder="Ada Lovelace"
                      />
                    </Column>
                    <Column sizeTablet={6}>
                      <Input
                        label="Work email"
                        type="email"
                        value={values.email}
                        onChange={e => set('email', e.target.value)}
                        color={show('email') ? 'danger' : undefined}
                        message={show('email')}
                        messageColor="danger"
                        iconLeftName="envelope"
                        placeholder="ada@company.com"
                      />
                    </Column>
                  </Columns>

                  <Columns>
                    <Column sizeTablet={6}>
                      <Input
                        label="Company"
                        value={values.company}
                        onChange={e => set('company', e.target.value)}
                        color={show('company') ? 'danger' : undefined}
                        message={show('company')}
                        messageColor="danger"
                        iconLeftName="building"
                        placeholder="Halcyon Systems"
                      />
                    </Column>
                    <Column sizeTablet={6}>
                      <Select
                        label="Starting model"
                        value={values.model}
                        onChange={e => set('model', e.target.value)}
                        color={show('model') ? 'danger' : undefined}
                        message={show('model')}
                        messageColor="danger"
                        isFullwidth
                      >
                        <option value="">Select a model…</option>
                        <option value="nova">Skynet Nova</option>
                        <option value="flash">Skynet Flash</option>
                        <option value="edge">Skynet Edge (on-prem)</option>
                        <option value="auto">Not sure — use the router</option>
                      </Select>
                    </Column>
                  </Columns>

                  <Select
                    label="Expected monthly volume"
                    value={values.volume}
                    onChange={e => set('volume', e.target.value)}
                    isFullwidth
                    message="Optional — a rough order of magnitude is fine."
                  >
                    <option value="">No idea yet</option>
                    <option value="under-10m">Under 10M tokens</option>
                    <option value="10m-500m">10M – 500M tokens</option>
                    <option value="500m-5b">500M – 5B tokens</option>
                    <option value="over-5b">Over 5B tokens</option>
                  </Select>

                  <TextArea
                    label="What are you building?"
                    value={values.message}
                    onChange={e => set('message', e.target.value)}
                    color={show('message') ? 'danger' : undefined}
                    message={show('message')}
                    messageColor="danger"
                    rows={4}
                    placeholder="Agentic code review across a 2M-line monorepo. Currently on another provider, blocked on context length and tool-call reliability."
                  />

                  <Field>
                    <Checkbox
                      checked={values.agree}
                      onChange={e => set('agree', e.target.checked)}
                    >
                      {' '}
                      Netadyne may contact me about this request.
                    </Checkbox>
                    {show('agree') && (
                      <p className="help is-danger">{show('agree')}</p>
                    )}
                  </Field>

                  {submitted && Object.keys(errors).length > 0 && (
                    <Notification color="danger" isLight mt="4">
                      <IconText
                        iconProps={{
                          name: 'triangle-exclamation',
                          'aria-hidden': 'true',
                        }}
                      >
                        {Object.keys(errors).length} field
                        {Object.keys(errors).length === 1 ? '' : 's'} need
                        attention before we can send this.
                      </IconText>
                    </Notification>
                  )}

                  <Button color="primary" size="medium" type="submit" mt="4">
                    <IconText
                      iconProps={{ name: 'paper-plane', 'aria-hidden': 'true' }}
                    >
                      Request access
                    </IconText>
                  </Button>
                </form>
              )}
            </Box>
          </Column>

          <Column sizeDesktop={5}>
            <Box mb="5">
              <Title size="5" as="h2" mb="4">
                Prefer email?
              </Title>
              {CONTACTS.map(contact => (
                <Block key={contact.label} mb="4">
                  <IconText
                    iconProps={{ name: contact.icon, 'aria-hidden': 'true' }}
                    textColor="primary"
                    textWeight="semibold"
                  >
                    {contact.label}
                  </IconText>
                  <Content mb="0" mt="1">
                    <p>
                      <a href={`mailto:${contact.value}`}>{contact.value}</a>
                    </p>
                    <p className="is-size-7 has-text-grey">{contact.note}</p>
                  </Content>
                </Block>
              ))}
            </Box>

            <Box>
              <Title size="5" as="h2" mb="4">
                What happens next
              </Title>
              <Content>
                <ol>
                  <li>A sandbox key, usually the same day.</li>
                  <li>
                    We run your eval set against Nova and Flash and send you the
                    raw results — including whatever it loses on.
                  </li>
                  <li>
                    If the numbers hold up, a 30-day pilot at production volume.
                  </li>
                </ol>
              </Content>
              <Block mt="4">
                <IconText
                  iconProps={{ name: 'lock', 'aria-hidden': 'true' }}
                  textColor="grey"
                  textSize="7"
                >
                  Your eval data is never used for training. Ever.
                </IconText>
              </Block>
            </Box>
          </Column>
        </Columns>
      </Container>
    </Section>
  );
}
