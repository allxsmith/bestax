import {
  Box,
  Button,
  Checkbox,
  Column,
  Columns,
  Container,
  Control,
  Field,
  InputBase,
  Paragraph,
  Section,
  TextAreaBase,
} from '@allxsmith/bestax-bulma';

/**
 * The contact form beside its illustration. Each `Field`'s label names the
 * input inside it. Submitting stays on the page: send the message from the
 * form's `onSubmit`.
 */
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
                src="/media/undraw_mobile_inbox_3h46.svg"
                alt=""
                className="contact-illustration"
              />
              <Paragraph textColor="black" textAlign="centered" pt="3">
                One of our team members will contact you soon{' '}
                <i className="fa-solid fa-heart heart" aria-hidden="true" />
              </Paragraph>
            </Column>

            <Column>
              <form onSubmit={event => event.preventDefault()}>
                <Field label="Name">
                  <Control>
                    <InputBase type="text" placeholder="Text input" />
                  </Control>
                </Field>

                <Field label="Email">
                  <Control
                    hasIconsLeft
                    hasIconsRight
                    iconLeftName="envelope"
                    iconLeftSize="small"
                  >
                    <InputBase type="email" placeholder="Email input" />
                  </Control>
                </Field>

                <Field label="Subject">
                  <Control>
                    <InputBase type="text" placeholder="Type subject" />
                  </Control>
                </Field>

                <Field label="Message">
                  <Control>
                    <TextAreaBase placeholder="Text area" />
                  </Control>
                </Field>

                <Field>
                  <Control>
                    <Checkbox>
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
