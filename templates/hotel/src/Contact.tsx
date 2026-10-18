import {
  Box,
  Button,
  Column,
  Columns,
  Container,
  Content,
  Control,
  Field,
  Hero,
  Input,
  SubTitle,
  TextArea,
  Title,
} from '@allxsmith/bestax-bulma';

/** A contact form beside a map, on a white box. */
function Contact() {
  return (
    <Hero id="contact-us">
      <Hero.Body>
        <Container>
          <Content>
            <Title size="4">Contact Us</Title>
          </Content>
          <SubTitle size="6">
            If you&apos;ve any queries feel free to contact us
          </SubTitle>
          <Box className="contact-box">
            <Columns m="0">
              <Column>
                {/* The original posts to `#`, which a static host answers
                    with an error page. Submitting stays on the page instead,
                    after the browser's own checks; send the message from
                    here. */}
                <form onSubmit={event => event.preventDefault()}>
                  <Input
                    label="Name"
                    name="name"
                    placeholder="Your Name"
                    autoComplete="name"
                    required
                  />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="Email address"
                    autoComplete="email"
                    required
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    placeholder="Phone number"
                    autoComplete="tel"
                    required
                  />
                  <TextArea
                    label="Message"
                    name="message"
                    placeholder="Type your message here..."
                    required
                  />
                  <Field>
                    <Control>
                      <Button type="submit" color="primary">
                        Submit
                      </Button>
                    </Control>
                  </Field>
                </form>
              </Column>
              <Column>
                {/* Google's own embed, kept as the original has it. */}
                <iframe
                  className="contact-map"
                  title="Map of Athens, where the hotel is"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d50310.604001548294!2d23.703320025394262!3d37.99083200838609!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a1bd1f067043f1%3A0x2736354576668ddd!2zzpHOuM6uzr3OsQ!5e0!3m2!1sel!2sgr!4v1593689527371!5m2!1sel!2sgr"
                  allowFullScreen
                />
              </Column>
            </Columns>
          </Box>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default Contact;
