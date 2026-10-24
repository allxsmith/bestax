import {
  Box,
  Button,
  Checkbox,
  Column,
  Columns,
  Container,
  Control,
  Field,
  Input,
  Paragraph,
  Section,
  TextArea,
} from '@allxsmith/bestax-bulma';

/** The contact box: an illustration beside the message form. */
function Contact() {
  return (
    <Section id="contact">
      <Container>
        <h3 className="is-size-3 has-text-centered">
          <strong>Let&apos;s connect</strong>
        </h3>
        <Box>
          <Columns>
            <Column>
              <img
                src="/img/undraw_mobile_inbox_3h46.svg"
                alt=""
                className="contact-art"
              />
              <Paragraph
                textColor="black"
                textAlign="centered"
                className="contact-note"
              >
                One of our team members will contact you soon{' '}
                <i className="fa-solid fa-heart heart" aria-hidden="true" />
              </Paragraph>
            </Column>
            <Column>
              {/* The original has no form, so its buttons sent nothing.
                  Submitting stays on the page; send the message from here. */}
              <form onSubmit={event => event.preventDefault()}>
                <Input
                  id="name"
                  name="name"
                  label="Name"
                  type="text"
                  placeholder="Text input"
                  autoComplete="name"
                />
                <Input
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="Email input"
                  autoComplete="email"
                  iconLeft={{ name: 'envelope', size: 'small' }}
                  hasIconsRight
                />
                <Input
                  id="subject"
                  name="subject"
                  label="Subject"
                  type="text"
                  placeholder="Type subject"
                />
                <TextArea
                  id="message"
                  name="message"
                  label="Message"
                  placeholder="Text area"
                />
                <Field>
                  <Control>
                    <Checkbox name="terms">
                      I agree to the <a href="#">terms and conditions</a>
                    </Checkbox>
                  </Control>
                </Field>
                <Field grouped>
                  <Control>
                    <Button type="submit" color="link">
                      Submit
                    </Button>
                  </Control>
                  <Control>
                    <Button type="reset" color="link" isLight>
                      Cancel
                    </Button>
                  </Control>
                </Field>
              </form>
            </Column>
          </Columns>
        </Box>
      </Container>
    </Section>
  );
}

export default Contact;
