import { useState } from 'react';
import {
  Hero,
  Section,
  Container,
  Columns,
  Column,
  Box,
  Title,
  SubTitle,
  Content,
  Input,
  Select,
  TextArea,
  Checkbox,
  Switch,
  Field,
  Button,
  Buttons,
  Icon,
  IconText,
  Notification,
  Message,
  Tag,
  Block,
  Span,
  Paragraph,
  Divider,
  UnorderedList,
  ListItem,
} from '@allxsmith/bestax-bulma';
import { COMPETITOR, DISCLAIMER } from '../data/content';
import { useRouter } from '../router';

interface FormState {
  name: string;
  email: string;
  company: string;
  teamSize: string;
  useCase: string;
  volume: string;
  migratingFrom: string;
  details: string;
  sovereign: boolean;
  acceptedPolicy: boolean;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  company: '',
  teamSize: '',
  useCase: '',
  volume: '',
  migratingFrom: '',
  details: '',
  sovereign: false,
  acceptedPolicy: false,
};

type FieldName = keyof FormState;
type Errors = Partial<Record<FieldName, string>>;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FREE_EMAIL = /@(gmail|yahoo|hotmail|outlook|icloud|proton(mail)?)\./i;

function validate(values: FormState): Errors {
  const errors: Errors = {};

  if (!values.name.trim()) {
    errors.name = 'Tell us who to address the key to.';
  }
  if (!values.email.trim()) {
    errors.email = 'A work email is required.';
  } else if (!EMAIL_RE.test(values.email)) {
    errors.email = 'That does not look like an email address.';
  } else if (FREE_EMAIL.test(values.email)) {
    errors.email = 'Please use your work email — we provision keys per domain.';
  }
  if (!values.company.trim()) {
    errors.company = 'Which company or project is this for?';
  }
  if (!values.teamSize) {
    errors.teamSize = 'Pick the closest range.';
  }
  if (!values.useCase) {
    errors.useCase = 'Pick a primary use case.';
  }
  if (values.details.trim().length > 0 && values.details.trim().length < 20) {
    errors.details = 'A sentence or two, please — or leave it empty.';
  }
  if (!values.acceptedPolicy) {
    errors.acceptedPolicy = 'You must accept the acceptable-use policy.';
  }

  return errors;
}

export function WaitlistPage() {
  const { navigate } = useRouter();
  const [values, setValues] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);

  const errors = validate(values);
  // Only surface an error once the field has been visited or the form submitted.
  const errorFor = (field: FieldName) =>
    touched[field] || submitted ? errors[field] : undefined;

  const set = <K extends FieldName>(field: K, value: FormState[K]) =>
    setValues(current => ({ ...current, [field]: value }));

  const blur = (field: FieldName) =>
    setTouched(current => ({ ...current, [field]: true }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length === 0) {
      setDone(true);
    }
  };

  if (done) {
    return (
      <Section size="large">
        <Container>
          <Columns isCentered>
            <Column sizeDesktop={6}>
              <Box p="6" textAlign="centered">
                <Icon
                  name="circle-check"
                  size="large"
                  textColor="success"
                  mb="4"
                  aria-hidden="true"
                />
                <Title size="3">Your key is on its way</Title>
                <Paragraph textColor="grey" mt="3">
                  Thanks, {values.name.split(' ')[0]}. We sent a provisioning
                  link to <Span textWeight="semibold">{values.email}</Span>. It
                  is valid for 24 hours and lands you on the Build plan with 5M
                  free tokens.
                </Paragraph>
                {values.sovereign && (
                  <Notification color="info" isLight mt="5">
                    You asked about a sovereign deployment — a solutions
                    engineer will follow up within one business day.
                  </Notification>
                )}
                <Buttons isCentered mt="5">
                  <Button color="primary" onClick={() => navigate('docs')}>
                    Read the quickstart
                  </Button>
                  <Button
                    color="text"
                    onClick={() => {
                      setValues(EMPTY);
                      setTouched({});
                      setSubmitted(false);
                      setDone(false);
                    }}
                  >
                    Request another
                  </Button>
                </Buttons>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>
    );
  }

  return (
    <>
      <Hero color="primary" size="small" className="hero-wash">
        <Hero.Body>
          <Container textAlign="centered">
            <Title size="2">Get a Skynet API key</Title>
            <SubTitle size="5" mt="3">
              Build accounts are free and provisioned instantly. No card, no
              call.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="medium">
        <Container>
          <Columns isCentered gap={6}>
            <Column sizeDesktop={7}>
              <Box p="6">
                <Title size="4" mb="5">
                  Tell us where to send it
                </Title>

                <form onSubmit={handleSubmit} noValidate>
                  <Columns>
                    <Column sizeTablet="half">
                      <Input
                        label="Full name"
                        placeholder="Ada Lovelace"
                        value={values.name}
                        onChange={event => set('name', event.target.value)}
                        onBlur={() => blur('name')}
                        color={errorFor('name') ? 'danger' : undefined}
                        message={errorFor('name')}
                        messageColor={errorFor('name') ? 'danger' : undefined}
                        iconLeftName="user"
                        hasIconsLeft
                      />
                    </Column>
                    <Column sizeTablet="half">
                      <Input
                        label="Work email"
                        type="email"
                        placeholder="you@company.com"
                        value={values.email}
                        onChange={event => set('email', event.target.value)}
                        onBlur={() => blur('email')}
                        color={errorFor('email') ? 'danger' : undefined}
                        message={errorFor('email')}
                        messageColor={errorFor('email') ? 'danger' : undefined}
                        iconLeftName="envelope"
                        hasIconsLeft
                      />
                    </Column>
                  </Columns>

                  <Columns>
                    <Column sizeTablet="half">
                      <Input
                        label="Company or project"
                        placeholder="Halcyon Freight"
                        value={values.company}
                        onChange={event => set('company', event.target.value)}
                        onBlur={() => blur('company')}
                        color={errorFor('company') ? 'danger' : undefined}
                        message={errorFor('company')}
                        messageColor={
                          errorFor('company') ? 'danger' : undefined
                        }
                        iconLeftName="building"
                        hasIconsLeft
                      />
                    </Column>
                    <Column sizeTablet="half">
                      <Select
                        label="Team size"
                        value={values.teamSize}
                        onChange={event => set('teamSize', event.target.value)}
                        onBlur={() => blur('teamSize')}
                        color={errorFor('teamSize') ? 'danger' : undefined}
                        message={errorFor('teamSize')}
                        messageColor={
                          errorFor('teamSize') ? 'danger' : undefined
                        }
                        isFullwidth
                      >
                        <option value="">Select a range…</option>
                        <option value="solo">Just me</option>
                        <option value="2-20">2 – 20</option>
                        <option value="21-200">21 – 200</option>
                        <option value="201-2000">201 – 2,000</option>
                        <option value="2000+">2,000+</option>
                      </Select>
                    </Column>
                  </Columns>

                  <Columns>
                    <Column sizeTablet="half">
                      <Select
                        label="Primary use case"
                        value={values.useCase}
                        onChange={event => set('useCase', event.target.value)}
                        onBlur={() => blur('useCase')}
                        color={errorFor('useCase') ? 'danger' : undefined}
                        message={errorFor('useCase')}
                        messageColor={
                          errorFor('useCase') ? 'danger' : undefined
                        }
                        isFullwidth
                      >
                        <option value="">What are you building?</option>
                        <option value="agents">Autonomous engineering</option>
                        <option value="assistant">Customer assistant</option>
                        <option value="research">Research &amp; analysis</option>
                        <option value="extraction">
                          Extraction &amp; classification
                        </option>
                        <option value="other">Something else</option>
                      </Select>
                    </Column>
                    <Column sizeTablet="half">
                      <Select
                        label="Migrating from"
                        value={values.migratingFrom}
                        onChange={event =>
                          set('migratingFrom', event.target.value)
                        }
                        message="Optional — helps us pre-fill your migration guide."
                        isFullwidth
                      >
                        <option value="">Nothing yet</option>
                        <option value="fable">{COMPETITOR}</option>
                        <option value="inhouse">An in-house model</option>
                        <option value="oss">Open-weights model</option>
                        <option value="other">Another provider</option>
                      </Select>
                    </Column>
                  </Columns>

                  <TextArea
                    label="What are you building? (optional)"
                    placeholder="A 40-hour agent that triages our incident backlog…"
                    rows={4}
                    value={values.details}
                    onChange={event => set('details', event.target.value)}
                    onBlur={() => blur('details')}
                    color={errorFor('details') ? 'danger' : undefined}
                    message={errorFor('details')}
                    messageColor={errorFor('details') ? 'danger' : undefined}
                  />

                  <Field mt="5">
                    <Switch
                      color="link"
                      isRounded
                      checked={values.sovereign}
                      onChange={event =>
                        set('sovereign', event.target.checked)
                      }
                    >
                      I need a sovereign or on-premise deployment
                    </Switch>
                  </Field>

                  <Field mt="4">
                    <Checkbox
                      color={errorFor('acceptedPolicy') ? 'danger' : 'link'}
                      checked={values.acceptedPolicy}
                      onChange={event =>
                        set('acceptedPolicy', event.target.checked)
                      }
                      onBlur={() => blur('acceptedPolicy')}
                    >
                      <Span ml="2">
                        I accept the Netadyne acceptable-use policy and confirm
                        this deployment keeps a human accountable for
                        consequential actions.
                      </Span>
                    </Checkbox>
                    {errorFor('acceptedPolicy') && (
                      <Paragraph textColor="danger" textSize="7" mt="2">
                        {errorFor('acceptedPolicy')}
                      </Paragraph>
                    )}
                  </Field>

                  {submitted && Object.keys(errors).length > 0 && (
                    <Notification color="danger" isLight mt="5">
                      {Object.keys(errors).length} field
                      {Object.keys(errors).length === 1 ? '' : 's'} still need
                      attention before we can provision a key.
                    </Notification>
                  )}

                  <Buttons mt="5">
                    <Button color="primary" size="medium" type="submit">
                      <Icon name="key" mr="2" aria-hidden="true" />
                      Request my key
                    </Button>
                    <Button
                      color="text"
                      type="button"
                      onClick={() => navigate('pricing')}
                    >
                      Compare plans first
                    </Button>
                  </Buttons>

                  <Paragraph textColor="grey" textSize="7" mt="4">
                    We never train on your API traffic. Unsubscribe from
                    anything with one click.
                  </Paragraph>
                </form>
              </Box>
            </Column>

            <Column sizeDesktop={5}>
              <Box mb="4">
                <Title size="5" mb="4">
                  What you get immediately
                </Title>
                <UnorderedList>
                  {[
                    '5M tokens per month, free forever',
                    'Skynet-1 Mini and Edge weights',
                    'Full docs, cookbook, and eval harness',
                    'Community Slack with the research team',
                  ].map(item => (
                    <ListItem key={item} mb="3">
                      <IconText>
                        <Icon
                          name="circle-check"
                          textColor="success"
                          aria-hidden="true"
                        />
                        <Span>{item}</Span>
                      </IconText>
                    </ListItem>
                  ))}
                </UnorderedList>
                <Divider />
                <Block>
                  <Tag color="link" isRounded mb="3">
                    Typical turnaround
                  </Tag>
                  <Content textColor="grey">
                    Build keys are instant. Scale and Sovereign requests get a
                    human reply within one business day.
                  </Content>
                </Block>
              </Box>

              <Message color="primary">
                <Message.Header>Already on {COMPETITOR}?</Message.Header>
                <Message.Body>
                  Migration is usually a base URL, a key, and a model string.
                  Tool schemas and streaming events carry over unchanged — and
                  the first invoice is about a tenth of what you were paying.
                </Message.Body>
              </Message>

              <Paragraph textSize="7" textColor="grey" mt="5">
                {DISCLAIMER}
              </Paragraph>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
