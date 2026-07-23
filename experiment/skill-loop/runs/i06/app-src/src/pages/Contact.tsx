import { useState, type FormEvent } from 'react';
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
  Tag,
  TextArea,
  Title,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import type { PageProps } from '../routes';

const USE_CASES = [
  'Coding agents and developer tools',
  'Research and analysis',
  'Customer operations',
  'Document and long-context workloads',
  'Something else',
];

const VOLUMES = [
  'Evaluating — no volume yet',
  'Under 100M tokens / month',
  '100M – 1B tokens / month',
  '1B – 20B tokens / month',
  'Over 20B tokens / month',
];

interface FormState {
  name: string;
  email: string;
  company: string;
  useCase: string;
  volume: string;
  message: string;
  agreed: boolean;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  company: '',
  useCase: '',
  volume: '',
  message: '',
  agreed: false,
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(values: FormState): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Tell us who to reply to.';
  if (!values.email.trim()) {
    errors.email = 'A work email address is required.';
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
    errors.email = 'That does not look like a valid email address.';
  }
  if (!values.company.trim()) errors.company = 'Company or team name, please.';
  if (!values.useCase) errors.useCase = 'Pick the closest match.';
  if (!values.agreed) {
    errors.agreed = 'We need your consent before we can get in touch.';
  }
  return errors;
}

export function Contact({ onNavigate }: PageProps) {
  const [values, setValues] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(values);
  const showError = (field: keyof FormState) =>
    touched[field] ? errors[field] : undefined;

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setValues(current => ({ ...current, [field]: value }));

  const markTouched = (field: keyof FormState) =>
    setTouched(current => ({ ...current, [field]: true }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched({
      name: true,
      email: true,
      company: true,
      useCase: true,
      volume: true,
      message: true,
      agreed: true,
    });
    if (Object.keys(errors).length === 0) {
      setSubmitted(true);
    }
  };

  return (
    <>
      <Hero className="hero-wash">
        <Hero.Body>
          <Container>
            <Tag color="primary" isRounded mb="4">
              Get started
            </Tag>
            <Title size="1" mb="4">
              Bring your hardest eval.
            </Title>
            <SubTitle size="4" textColor="grey" mb="0">
              Tell us what your current model keeps getting wrong. We will run it
              against Skynet and send you the transcripts — the failures
              included.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section>
        <Container>
          <Columns>
            <Column sizeDesktop={7}>
              <Box>
                {submitted ? (
                  <>
                    <Title size="4" mb="3">
                      <IconText
                        iconProps={{
                          name: 'check-circle',
                          'aria-hidden': 'true',
                          textColor: 'primary',
                        }}
                      >
                        Request received
                      </IconText>
                    </Title>
                    <Content>
                      <p>
                        Thanks, {values.name.trim()}. A solutions engineer will
                        reply to <Strong>{values.email.trim()}</Strong> within
                        one business day with API keys and a shared workspace
                        for your evaluation.
                      </p>
                      <p>
                        Nothing was actually sent — this is a demonstration
                        site and the form does not post anywhere.
                      </p>
                    </Content>
                    <Button
                      color="primary"
                      isInverted
                      onClick={() => {
                        setValues(EMPTY);
                        setTouched({});
                        setSubmitted(false);
                      }}
                    >
                      Submit another request
                    </Button>
                  </>
                ) : (
                  <form onSubmit={handleSubmit} noValidate>
                    <Title size="4" mb="4">
                      Request access
                    </Title>

                    <Columns>
                      <Column sizeTablet="half">
                        <Input
                          label="Full name"
                          aria-label="Full name"
                          value={values.name}
                          onChange={e => set('name', e.target.value)}
                          onBlur={() => markTouched('name')}
                          color={showError('name') ? 'danger' : undefined}
                          message={showError('name')}
                          messageColor={showError('name') ? 'danger' : undefined}
                          placeholder="Ada Lovelace"
                        />
                      </Column>
                      <Column sizeTablet="half">
                        <Input
                          label="Work email"
                          aria-label="Work email"
                          type="email"
                          value={values.email}
                          onChange={e => set('email', e.target.value)}
                          onBlur={() => markTouched('email')}
                          color={showError('email') ? 'danger' : undefined}
                          message={showError('email')}
                          messageColor={
                            showError('email') ? 'danger' : undefined
                          }
                          placeholder="ada@company.com"
                        />
                      </Column>
                    </Columns>

                    <Input
                      label="Company"
                      aria-label="Company"
                      value={values.company}
                      onChange={e => set('company', e.target.value)}
                      onBlur={() => markTouched('company')}
                      color={showError('company') ? 'danger' : undefined}
                      message={showError('company')}
                      messageColor={showError('company') ? 'danger' : undefined}
                      placeholder="Corvid Robotics"
                    />

                    <Columns>
                      <Column sizeTablet="half">
                        <Select
                          label="Primary use case"
                          aria-label="Primary use case"
                          isFullwidth
                          value={values.useCase}
                          onChange={e => set('useCase', e.target.value)}
                          onBlur={() => markTouched('useCase')}
                          color={showError('useCase') ? 'danger' : undefined}
                          message={showError('useCase')}
                          messageColor={
                            showError('useCase') ? 'danger' : undefined
                          }
                        >
                          <option value="">Choose one…</option>
                          {USE_CASES.map(item => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </Select>
                      </Column>
                      <Column sizeTablet="half">
                        <Select
                          label="Expected volume"
                          aria-label="Expected volume"
                          isFullwidth
                          value={values.volume}
                          onChange={e => set('volume', e.target.value)}
                        >
                          <option value="">Not sure yet</option>
                          {VOLUMES.map(item => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </Select>
                      </Column>
                    </Columns>

                    <TextArea
                      label="What is your current model getting wrong?"
                      aria-label="What is your current model getting wrong?"
                      rows={5}
                      value={values.message}
                      onChange={e => set('message', e.target.value)}
                      placeholder="Long-horizon refactors stall after ~40 tool calls and we end up babysitting every run…"
                      message="Optional, but it is the fastest way to get a useful answer."
                    />

                    <Field mt="4">
                      <Checkbox
                        checked={values.agreed}
                        onChange={e => {
                          set('agreed', e.target.checked);
                          markTouched('agreed');
                        }}
                      >
                        <Span ml="2">
                          Netadyne may contact me about Skynet access.
                        </Span>
                      </Checkbox>
                      {showError('agreed') && (
                        <Paragraph mt="2" mb="0">
                          <Span textSize="7" textColor="danger">
                            {showError('agreed')}
                          </Span>
                        </Paragraph>
                      )}
                    </Field>

                    <Button color="primary" type="submit" size="medium" mt="5">
                      <Icon name="rocket-launch" aria-hidden="true" />
                      <Span>Request access</Span>
                    </Button>
                  </form>
                )}
              </Box>
            </Column>

            <Column sizeDesktop={5}>
              <SectionHeading
                eyebrow="What happens next"
                title="Three steps, one week"
                size="3"
                mb="5"
              />
              <Content>
                <ol>
                  <li>
                    <Strong>Day 1.</Strong> Keys, a shared workspace, and a
                    solutions engineer assigned to your account.
                  </li>
                  <li>
                    <Strong>Day 2–4.</Strong> We port your eval suite and run it
                    against Skynet Core and Ultra, unattended.
                  </li>
                  <li>
                    <Strong>Day 5.</Strong> You get the full transcripts, the
                    cost model, and an honest list of what Skynet still fails.
                  </li>
                </ol>
              </Content>

              <Block mt="5">
                <IconText
                  iconProps={{ name: 'email-outline', 'aria-hidden': 'true' }}
                >
                  sales@netadyne.ai
                </IconText>
              </Block>
              <Block>
                <IconText
                  iconProps={{ name: 'shield-check', 'aria-hidden': 'true' }}
                >
                  security@netadyne.ai
                </IconText>
              </Block>
              <Block>
                <IconText
                  iconProps={{
                    name: 'office-building-outline',
                    'aria-hidden': 'true',
                  }}
                >
                  Netadyne Research, Seattle and Zürich
                </IconText>
              </Block>

              <Notification color="primary" isLight mt="5" mb="0">
                <Strong>Already building?</Strong> Skip the call — the free tier
                gives you $25 of credit and production keys immediately.{' '}
                <Button
                  color="primary"
                  isInverted
                  size="small"
                  mt="3"
                  onClick={() => onNavigate('docs')}
                >
                  Read the quickstart
                </Button>
              </Notification>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
