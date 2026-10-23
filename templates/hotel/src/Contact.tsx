import type { FormEvent } from 'react';
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
  InputBase,
  SubTitle,
  TextAreaBase,
  Title,
} from '@allxsmith/bestax-bulma';

/** The form stays on the page; send the message from here. */
function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}

/** The contact form, in a box beside the map. */
function Contact() {
  return (
    <Hero id="contact-us">
      <Hero.Body>
        <Container>
          <div>
            <Content>
              <Title size="4">Contact Us</Title>
            </Content>
            <SubTitle size="6">
              If you&apos;ve any queries feel free to contact us
            </SubTitle>
            {/* The original's box was its `.columns` too, so it reached out as
                far as the columns' negative margins: `contact-box` sets that
                back, and the columns inside it sit flat. */}
            <Box className="contact-box">
              <Columns m="0">
                <Column>
                  <form action="#" onSubmit={handleSubmit}>
                    <Field label="Name">
                      <Control>
                        <InputBase
                          type="text"
                          placeholder="Your Name"
                          required
                        />
                      </Control>
                    </Field>
                    <Field label="Email">
                      <Control>
                        <InputBase
                          type="text"
                          placeholder="Email address"
                          required
                        />
                      </Control>
                    </Field>
                    <Field label="Phone Number">
                      <Control>
                        <InputBase
                          type="text"
                          placeholder="Phone number"
                          required
                        />
                      </Control>
                    </Field>
                    <Field label="Message">
                      <Control>
                        <TextAreaBase
                          placeholder="Type your message here..."
                          required
                        />
                      </Control>
                    </Field>
                    <Field>
                      <Control>
                        <Button as="input" color="primary" type="submit" />
                      </Control>
                    </Field>
                  </form>
                </Column>
                <Column>
                  <iframe
                    title="Bulma Hotel on Google Maps"
                    width="100%"
                    height="100%"
                    style={{ border: '0' }}
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d50310.604001548294!2d23.703320025394262!3d37.99083200838609!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a1bd1f067043f1%3A0x2736354576668ddd!2zzpHOuM6uzr3OsQ!5e0!3m2!1sel!2sgr!4v1593689527371!5m2!1sel!2sgr"
                    allowFullScreen
                  />
                </Column>
              </Columns>
            </Box>
          </div>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default Contact;
