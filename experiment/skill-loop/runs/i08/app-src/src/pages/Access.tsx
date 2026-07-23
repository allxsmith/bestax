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
  Hero,
  Icon,
  IconText,
  Input,
  ListItem,
  Notification,
  Paragraph,
  Section,
  Select,
  Span,
  Strong,
  SubTitle,
  TextArea,
  Title,
  UnorderedList,
} from '@allxsmith/bestax-bulma';

type Values = {
  name: string;
  email: string;
  company: string;
  workload: string;
  volume: string;
  details: string;
  terms: boolean;
};

const EMPTY: Values = {
  name: '',
  email: '',
  company: '',
  workload: '',
  volume: '',
  details: '',
  terms: false,
};

const WORKLOADS = [
  'Agentic software engineering',
  'Document & claims processing',
  'Customer support automation',
  'Research & analysis',
  'Something else',
];

const VOLUMES = [
  'Under 10M tokens / month',
  '10M – 500M tokens / month',
  '500M – 5B tokens / month',
  'Over 5B tokens / month',
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function validate(values: Values): Partial<Record<keyof Values, string>> {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (!values.name.trim()) errors.name = 'Tell us who to reply to.';
  if (!values.email.trim()) errors.email = 'A work email is required.';
  else if (!EMAIL_RE.test(values.email))
    errors.email = 'That does not look like a valid email address.';
  if (!values.company.trim()) errors.company = 'Company or team name required.';
  if (!values.workload) errors.workload = 'Pick the closest workload.';
  if (!values.volume) errors.volume = 'An estimate is fine.';
  if (values.details.trim().length < 20)
    errors.details =
      'A couple of sentences helps us route you to the right architect.';
  if (!values.terms) errors.terms = 'Please accept the evaluation terms.';
  return errors;
}

export function Access() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(values);
  const errorOf = (field: keyof Values) =>
    touched[field] ? errors[field] : undefined;

  const set = <K extends keyof Values>(field: K, value: Values[K]) =>
    setValues(v => ({ ...v, [field]: value }));

  const blur = (field: keyof Values) =>
    setTouched(t => ({ ...t, [field]: true }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched({
      name: true,
      email: true,
      company: true,
      workload: true,
      volume: true,
      details: true,
      terms: true,
    });
    if (Object.keys(errors).length === 0) {
      // Demo site — nothing is sent anywhere.
      setSubmitted(true);
    }
  };

  return (
    <>
      <Hero size="small" className="hero-wash">
        <Hero.Body>
          <Container>
            <Title size="1">Request access</Title>
            <SubTitle size="4" textColor="grey" mt="4">
              Skynet Max opens in cohorts. Tell us about the workload and a
              solutions architect replies within one business day.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="large">
        <Container>
          <Columns gap={6}>
            <Column sizeDesktop={7}>
              {submitted ? (
                <Notification color="success" isLight>
                  <Title as="p" size="4" mb="3">
                    Request received
                  </Title>
                  <Paragraph mb="4">
                    Thanks, {values.name.split(' ')[0]}. We have your details
                    for {values.company} and will be in touch at{' '}
                    <Strong>{values.email}</Strong> within one business day.
                    Your Explore-tier key is already active.
                  </Paragraph>
                  <Buttons>
                    <Button
                      color="success"
                      onClick={() => {
                        setValues(EMPTY);
                        setTouched({});
                        setSubmitted(false);
                      }}
                    >
                      Submit another request
                    </Button>
                  </Buttons>
                </Notification>
              ) : (
                <Box p="5">
                  <form onSubmit={handleSubmit} noValidate>
                    <Columns>
                      <Column sizeTablet="half">
                        <Input
                          id="name"
                          label="Full name"
                          labelProps={{ htmlFor: 'name' }}
                          placeholder="Ada Lovelace"
                          value={values.name}
                          onChange={e => set('name', e.target.value)}
                          onBlur={() => blur('name')}
                          color={errorOf('name') ? 'danger' : undefined}
                          message={errorOf('name')}
                          messageColor="danger"
                        />
                      </Column>
                      <Column sizeTablet="half">
                        <Input
                          id="email"
                          type="email"
                          label="Work email"
                          labelProps={{ htmlFor: 'email' }}
                          placeholder="ada@company.com"
                          iconLeftName="envelope"
                          value={values.email}
                          onChange={e => set('email', e.target.value)}
                          onBlur={() => blur('email')}
                          color={errorOf('email') ? 'danger' : undefined}
                          message={errorOf('email')}
                          messageColor="danger"
                        />
                      </Column>
                    </Columns>

                    <Input
                      id="company"
                      label="Company or team"
                      labelProps={{ htmlFor: 'company' }}
                      placeholder="Corvid Health"
                      iconLeftName="building"
                      value={values.company}
                      onChange={e => set('company', e.target.value)}
                      onBlur={() => blur('company')}
                      color={errorOf('company') ? 'danger' : undefined}
                      message={errorOf('company')}
                      messageColor="danger"
                    />

                    <Columns>
                      <Column sizeTablet="half">
                        <Select
                          id="workload"
                          label="Primary workload"
                          labelProps={{ htmlFor: 'workload' }}
                          isFullwidth
                          value={values.workload}
                          onChange={e => set('workload', e.target.value)}
                          onBlur={() => blur('workload')}
                          color={errorOf('workload') ? 'danger' : undefined}
                          message={errorOf('workload')}
                          messageColor="danger"
                        >
                          <option value="">Choose one…</option>
                          {WORKLOADS.map(w => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </Select>
                      </Column>
                      <Column sizeTablet="half">
                        <Select
                          id="volume"
                          label="Expected volume"
                          labelProps={{ htmlFor: 'volume' }}
                          isFullwidth
                          value={values.volume}
                          onChange={e => set('volume', e.target.value)}
                          onBlur={() => blur('volume')}
                          color={errorOf('volume') ? 'danger' : undefined}
                          message={errorOf('volume')}
                          messageColor="danger"
                        >
                          <option value="">Choose one…</option>
                          {VOLUMES.map(v => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </Column>
                    </Columns>

                    <TextArea
                      id="details"
                      label="What are you building?"
                      labelProps={{ htmlFor: 'details' }}
                      rows={5}
                      placeholder="We reconcile claims against policy documents and currently escalate about 30% to human reviewers…"
                      value={values.details}
                      onChange={e => set('details', e.target.value)}
                      onBlur={() => blur('details')}
                      color={errorOf('details') ? 'danger' : undefined}
                      message={
                        errorOf('details') ??
                        'Context on the current stack and where it falls down is the most useful thing you can give us.'
                      }
                      messageColor={errorOf('details') ? 'danger' : undefined}
                    />

                    <Checkbox
                      checked={values.terms}
                      onChange={e => set('terms', e.target.checked)}
                      onBlur={() => blur('terms')}
                      mt="4"
                    >
                      <Span ml="2">
                        I accept the evaluation terms and the acceptable use
                        policy.
                      </Span>
                    </Checkbox>
                    {errorOf('terms') && (
                      <Paragraph textColor="danger" textSize="7" mt="2">
                        {errorOf('terms')}
                      </Paragraph>
                    )}

                    <Buttons mt="5">
                      <Button type="submit" color="primary" size="medium">
                        Request access
                      </Button>
                      <Button
                        type="button"
                        size="medium"
                        onClick={() => {
                          setValues(EMPTY);
                          setTouched({});
                        }}
                      >
                        Clear
                      </Button>
                    </Buttons>
                  </form>
                </Box>
              )}
            </Column>

            <Column sizeDesktop={5}>
              <Box p="5">
                <Title as="p" size="5" mb="4">
                  What happens next
                </Title>
                <UnorderedList>
                  {[
                    'An Explore-tier key is issued immediately — you can start evaluating today.',
                    'A solutions architect replies within one business day with a sizing proposal.',
                    'We run your evaluation suite alongside you, on your data, under NDA.',
                    'Cohort access to Skynet Max opens on the first Monday of each month.',
                  ].map(item => (
                    <ListItem key={item} mb="4">
                      <IconText>
                        <Icon
                          name="circle-check"
                          textColor="primary"
                          aria-hidden="true"
                        />
                        <Span>{item}</Span>
                      </IconText>
                    </ListItem>
                  ))}
                </UnorderedList>
              </Box>

              <Box p="5" mt="5">
                <Title as="p" size="6" mb="3">
                  Already have a key?
                </Title>
                <Content textColor="grey" mb="0">
                  Head to the quickstart on the platform page — first token in
                  about three lines of code.
                </Content>
                <Buttons mt="4">
                  <Button as="a" href="#/platform" isOutlined>
                    Open the quickstart
                  </Button>
                </Buttons>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
