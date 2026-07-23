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
  Paragraph,
  Span,
  Strong,
  Button,
  Input,
  Select,
  TextArea,
  Checkbox,
  Field,
  Notification,
  Icon,
  IconText,
  Divider,
} from '@allxsmith/bestax-bulma';

const TEAM_SIZES = ['1–10', '11–50', '51–250', '251–1,000', '1,000+'];
const VOLUMES = [
  'Still evaluating',
  'Under 50M tokens / month',
  '50M – 500M tokens / month',
  '500M – 5B tokens / month',
  'Over 5B tokens / month',
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface FormState {
  name: string;
  email: string;
  company: string;
  teamSize: string;
  volume: string;
  message: string;
  updates: boolean;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  company: '',
  teamSize: TEAM_SIZES[0],
  volume: VOLUMES[0],
  message: '',
  updates: true,
};

/** No validation library ships with bestax — errors are computed here and fed
 *  back through each input's own color / message / messageColor props. */
function validate(form: FormState) {
  return {
    name: form.name.trim() ? undefined : 'Tell us who to reply to.',
    email: EMAIL_RE.test(form.email)
      ? undefined
      : 'Enter a valid work email address.',
    company: form.company.trim() ? undefined : 'Which company is this for?',
    message:
      form.message.trim().length >= 20
        ? undefined
        : 'A sentence or two about what you are building helps us route this.',
  };
}

export function ContactPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(form);
  const show = (field: keyof typeof errors) =>
    touched[field] ? errors[field] : undefined;

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));
  const blur = (field: string) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, email: true, company: true, message: true });
    if (Object.values(errors).every(error => !error)) {
      setSubmitted(true);
      setForm(EMPTY);
      setTouched({});
    }
  };

  return (
    <>
      <Hero className="hero-wash">
        <Hero.Body>
          <Container>
            <Title size="1">Talk to Netadyne</Title>
            <SubTitle size="4" textColor="grey" mt="4">
              Tell us what you are building and a solutions engineer replies
              within one business day — not a sequence of drip emails.
            </SubTitle>
          </Container>
        </Hero.Body>
      </Hero>

      <Section size="large">
        <Container>
          <Columns>
            <Column sizeDesktop={7}>
              <Box>
                {submitted && (
                  <Notification
                    color="success"
                    isLight
                    onDelete={() => setSubmitted(false)}
                  >
                    <Strong>Thanks — that's in.</Strong> A solutions engineer
                    will email you within one business day. Nothing was actually
                    sent: this is a demo form.
                  </Notification>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <Columns>
                    <Column sizeTablet="half">
                      <Input
                        id="contact-name"
                        label="Full name"
                        labelProps={{ htmlFor: 'contact-name' }}
                        placeholder="Ada Lovelace"
                        value={form.name}
                        onChange={event => set('name', event.target.value)}
                        onBlur={() => blur('name')}
                        color={show('name') ? 'danger' : undefined}
                        message={show('name')}
                        messageColor={show('name') ? 'danger' : undefined}
                      />
                    </Column>
                    <Column sizeTablet="half">
                      <Input
                        id="contact-email"
                        type="email"
                        label="Work email"
                        labelProps={{ htmlFor: 'contact-email' }}
                        placeholder="you@company.com"
                        iconLeftName="envelope"
                        value={form.email}
                        onChange={event => set('email', event.target.value)}
                        onBlur={() => blur('email')}
                        color={show('email') ? 'danger' : undefined}
                        message={show('email')}
                        messageColor={show('email') ? 'danger' : undefined}
                      />
                    </Column>
                  </Columns>

                  <Input
                    id="contact-company"
                    label="Company"
                    labelProps={{ htmlFor: 'contact-company' }}
                    placeholder="Halcyon Systems"
                    iconLeftName="building"
                    value={form.company}
                    onChange={event => set('company', event.target.value)}
                    onBlur={() => blur('company')}
                    color={show('company') ? 'danger' : undefined}
                    message={show('company')}
                    messageColor={show('company') ? 'danger' : undefined}
                  />

                  <Columns>
                    <Column sizeTablet="half">
                      <Select
                        id="contact-team-size"
                        label="Engineering team size"
                        labelProps={{ htmlFor: 'contact-team-size' }}
                        isFullwidth
                        value={form.teamSize}
                        onChange={event => set('teamSize', event.target.value)}
                      >
                        {TEAM_SIZES.map(size => (
                          <option key={size} value={size}>
                            {size}
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
                        value={form.volume}
                        onChange={event => set('volume', event.target.value)}
                      >
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
                    placeholder="We run a coding agent over a 4M-line monorepo and keep losing trajectories around step forty…"
                    rows={5}
                    value={form.message}
                    onChange={event => set('message', event.target.value)}
                    onBlur={() => blur('message')}
                    color={show('message') ? 'danger' : undefined}
                    message={show('message')}
                    messageColor={show('message') ? 'danger' : undefined}
                  />

                  <Field mt="4">
                    <Checkbox
                      checked={form.updates}
                      onChange={event => set('updates', event.target.checked)}
                    >
                      <Span ml="2">
                        Send me the Netadyne research digest, roughly monthly.
                      </Span>
                    </Checkbox>
                  </Field>

                  <Button color="primary" size="medium" type="submit" mt="5">
                    Send message
                  </Button>
                </form>
              </Box>
            </Column>

            <Column sizeDesktop={5}>
              <Box>
                <Title as="p" size="5">
                  Other ways in
                </Title>
                <Divider />

                <Span display="block" mb="4">
                  <IconText
                    iconProps={{ name: 'headset', 'aria-hidden': 'true' }}
                  >
                    <Strong>Enterprise sales</Strong>
                  </IconText>
                  <Paragraph textColor="grey" textSize="7" mt="1">
                    Provisioned throughput, VPC and air-gapped deployment,
                    custom fine-tuning, and 24/7 on-call.
                  </Paragraph>
                </Span>

                <Span display="block" mb="4">
                  <IconText
                    iconProps={{ name: 'flask', 'aria-hidden': 'true' }}
                  >
                    <Strong>Netadyne for Research</Strong>
                  </IconText>
                  <Paragraph textColor="grey" textSize="7" mt="1">
                    250M tokens a quarter for accredited academic labs, plus
                    early checkpoints under NDA. Mention your institution.
                  </Paragraph>
                </Span>

                <Span display="block" mb="4">
                  <IconText
                    iconProps={{
                      name: 'shield-halved',
                      'aria-hidden': 'true',
                    }}
                  >
                    <Strong>Security & trust</Strong>
                  </IconText>
                  <Paragraph textColor="grey" textSize="7" mt="1">
                    SOC 2 Type II and ISO 27001 reports, our DPA, and the
                    current penetration test summary are available on request.
                  </Paragraph>
                </Span>

                <Divider />

                <Span display="flex" alignItems="center" textColor="grey">
                  <Icon name="location-dot" mr="2" aria-hidden="true" />
                  <Span textSize="7">
                    1 Helix Way, Ames, Iowa · Zürich · Singapore
                  </Span>
                </Span>
              </Box>
            </Column>
          </Columns>
        </Container>
      </Section>
    </>
  );
}
