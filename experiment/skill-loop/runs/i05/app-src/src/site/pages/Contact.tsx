import { useState } from 'react';
import type React from 'react';
import {
  Hero,
  Section,
  Container,
  Columns,
  Column,
  Box,
  Title,
  Paragraph,
  Span,
  Icon,
  IconText,
  Input,
  Select,
  TextArea,
  Checkbox,
  Field,
  Button,
  Buttons,
  Notification,
  Divider,
} from '@allxsmith/bestax-bulma';
import { SectionHeading } from '../components/SectionHeading';
import { MODELS } from '../data';
import { href } from '../routes';

interface FormState {
  name: string;
  email: string;
  company: string;
  model: string;
  volume: string;
  message: string;
  terms: boolean;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  company: '',
  model: 'Skynet Pro',
  volume: '1M – 50M tokens / month',
  message: '',
  terms: false,
};

const VOLUMES = [
  'Under 1M tokens / month',
  '1M – 50M tokens / month',
  '50M – 1B tokens / month',
  'Over 1B tokens / month',
];

type Errors = Partial<Record<keyof FormState, string>>;

/** All validation lives here — bestax ships no form library on purpose. */
function validate(values: FormState): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Tell us who to address the key to.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email))
    errors.email = 'Enter a valid work email address.';
  if (!values.company.trim()) errors.company = 'Company or team name is required.';
  if (values.message.trim().length > 0 && values.message.trim().length < 20)
    errors.message = 'A little more detail helps us route this correctly.';
  if (!values.terms)
    errors.terms = 'You need to accept the acceptable-use policy to get a key.';
  return errors;
}

export function Contact() {
  const [values, setValues] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(values);
  const errorFor = (field: keyof FormState) =>
    touched[field] ? errors[field] : undefined;

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setValues(prev => ({ ...prev, [field]: value }));

  const blur = (field: keyof FormState) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({
      name: true,
      email: true,
      company: true,
      message: true,
      terms: true,
    });
    if (Object.keys(errors).length === 0) {
      setSubmitted(true);
    }
  };

  return (
    <>
      <Hero size="small" className="hero-wash">
        <Hero.Body>
          <Container>
            <SectionHeading
              align="left"
              size="1"
              eyebrow="Get started"
              title="Get an API key"
              subtitle="Keys are issued instantly with $25 of credit. Tell us a little about the workload and we will pre-provision the right rate limits."
            />
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="large">
        <Container>
          <Columns>
            <Column sizeDesktop={7}>
              <Box p="5">
                {submitted ? (
                  <Notification color="success" isLight>
                    <Title as="p" size="4" mb="3">
                      You&rsquo;re in, {values.name.split(' ')[0]}.
                    </Title>
                    <Paragraph mb="4">
                      A key scoped to <Span textWeight="semibold">{values.model}</Span>{' '}
                      is on its way to{' '}
                      <Span textWeight="semibold">{values.email}</Span>, with
                      rate limits sized for {values.volume.toLowerCase()}.
                    </Paragraph>
                    <Buttons>
                      <Button
                        color="primary"
                        onClick={() => {
                          setValues(EMPTY);
                          setTouched({});
                          setSubmitted(false);
                        }}
                      >
                        Request another key
                      </Button>
                      <Button as="a" href={href('/models')} color="primary" isLight>
                        Read the quickstart
                      </Button>
                    </Buttons>
                  </Notification>
                ) : (
                  <form onSubmit={handleSubmit} noValidate>
                    <Title as="p" size="4" mb="5">
                      Request access
                    </Title>

                    <Input
                      label="Full name"
                      placeholder="Ada Lovelace"
                      value={values.name}
                      onChange={e => set('name', e.target.value)}
                      onBlur={() => blur('name')}
                      color={errorFor('name') ? 'danger' : undefined}
                      message={errorFor('name')}
                      messageColor={errorFor('name') ? 'danger' : undefined}
                      iconLeftName="user"
                    />

                    <Input
                      label="Work email"
                      type="email"
                      placeholder="ada@yourcompany.com"
                      value={values.email}
                      onChange={e => set('email', e.target.value)}
                      onBlur={() => blur('email')}
                      color={errorFor('email') ? 'danger' : undefined}
                      message={errorFor('email')}
                      messageColor={errorFor('email') ? 'danger' : undefined}
                      iconLeftName="envelope"
                    />

                    <Input
                      label="Company or team"
                      placeholder="Analytical Engines Ltd."
                      value={values.company}
                      onChange={e => set('company', e.target.value)}
                      onBlur={() => blur('company')}
                      color={errorFor('company') ? 'danger' : undefined}
                      message={errorFor('company')}
                      messageColor={errorFor('company') ? 'danger' : undefined}
                      iconLeftName="building"
                    />

                    <Columns>
                      <Column sizeTablet="half">
                        <Select
                          label="Starting model"
                          value={values.model}
                          onChange={e => set('model', e.target.value)}
                          isFullwidth
                        >
                          {MODELS.map(model => (
                            <option key={model.name}>{model.name}</option>
                          ))}
                        </Select>
                      </Column>
                      <Column sizeTablet="half">
                        <Select
                          label="Expected volume"
                          value={values.volume}
                          onChange={e => set('volume', e.target.value)}
                          isFullwidth
                        >
                          {VOLUMES.map(volume => (
                            <option key={volume}>{volume}</option>
                          ))}
                        </Select>
                      </Column>
                    </Columns>

                    <TextArea
                      label="What are you building? (optional)"
                      placeholder="An agent that reconciles freight invoices against carrier contracts…"
                      rows={4}
                      value={values.message}
                      onChange={e => set('message', e.target.value)}
                      onBlur={() => blur('message')}
                      color={errorFor('message') ? 'danger' : undefined}
                      message={errorFor('message')}
                      messageColor={errorFor('message') ? 'danger' : undefined}
                    />

                    <Field>
                      <Checkbox
                        checked={values.terms}
                        onChange={e => {
                          set('terms', e.target.checked);
                          blur('terms');
                        }}
                        color={errorFor('terms') ? 'danger' : undefined}
                      >
                        <Span ml="2">
                          I accept the acceptable-use policy and the API terms.
                        </Span>
                      </Checkbox>
                      {errorFor('terms') && (
                        <Paragraph textColor="danger" textSize="7" mt="2" mb="0">
                          {errorFor('terms')}
                        </Paragraph>
                      )}
                    </Field>

                    <Buttons mt="5">
                      <Button type="submit" color="primary" size="medium">
                        <Icon name="key" aria-hidden="true" />
                        <span>Create my key</span>
                      </Button>
                      <Button
                        type="button"
                        color="primary"
                        isLight
                        size="medium"
                        onClick={() => {
                          setValues(EMPTY);
                          setTouched({});
                        }}
                      >
                        Reset
                      </Button>
                    </Buttons>
                  </form>
                )}
              </Box>
            </Column>

            <Column sizeDesktop={5}>
              <Box p="5" mb="4">
                <Title as="p" size="5" mb="4">
                  Or reach us directly
                </Title>
                <IconText mb="3">
                  <Icon name="envelope" textColor="primary" aria-hidden="true" />
                  <Span>sales@netadyne.ai</Span>
                </IconText>
                <IconText mb="3">
                  <Icon name="life-ring" textColor="primary" aria-hidden="true" />
                  <Span>support@netadyne.ai</Span>
                </IconText>
                <IconText mb="0">
                  <Icon name="shield-halved" textColor="primary" aria-hidden="true" />
                  <Span>security@netadyne.ai</Span>
                </IconText>
                <Divider />
                <Paragraph textSize="7" textColor="grey" mb="0">
                  Enterprise procurement, security questionnaires and DPAs are
                  handled by the trust team — expect a reply within one business
                  day.
                </Paragraph>
              </Box>

              <Box p="5">
                <Title as="p" size="5" mb="4">
                  What happens next
                </Title>
                {[
                  'Your key is generated and emailed immediately.',
                  'Rate limits are pre-sized to the volume you selected.',
                  'A solutions architect reaches out only if you asked.',
                ].map(step => (
                  <IconText key={step} mb="3">
                    <Icon name="circle-check" textColor="success" aria-hidden="true" />
                    <Span textSize="7">{step}</Span>
                  </IconText>
                ))}
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
