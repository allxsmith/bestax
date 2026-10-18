import {
  Column,
  Columns,
  Container,
  Control,
  Field,
  InputBase,
  Section,
  TextAreaBase,
  Title,
} from '@allxsmith/bestax-bulma';

const MAP =
  'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d10499.966498430253!2d2.2944813!3d48.8583701!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x8ddca9ee380ef7e0!2zz4DPjc-BzrPOv8-CIM-Ezr_PhSDOkc6Qz4bOtc67!5e0!3m2!1sel!2sgr!4v1609878476869!5m2!1sel!2sgr';

/**
 * The contact form over its photo, then the map: on the home page and the
 * Contact page. The fields are underlined rather than boxed
 * (`is-custom-field`, in index.css). The form has no submit button, as in
 * the original, so it sends nothing; give it one and an `onSubmit` to send
 * it.
 */
function ContactSection() {
  return (
    <>
      <Section className="contact-section">
        <Container>
          <Columns>
            <Column size="half">
              <Title size="2">Contact Us</Title>
              <form>
                <Field>
                  <InputBase
                    className="is-custom-field"
                    type="text"
                    placeholder="Name"
                    aria-label="Name"
                    autoComplete="name"
                  />
                </Field>
                <Field>
                  <InputBase
                    className="is-custom-field"
                    type="tel"
                    placeholder="Phone Number"
                    aria-label="Phone Number"
                    autoComplete="tel"
                  />
                </Field>
                <Field>
                  <InputBase
                    className="is-custom-field"
                    type="email"
                    placeholder="Email"
                    aria-label="Email"
                    autoComplete="email"
                  />
                </Field>
                <Field>
                  <Control>
                    <TextAreaBase placeholder="Message" aria-label="Message" />
                  </Control>
                </Field>
              </form>
            </Column>
          </Columns>
        </Container>
      </Section>

      <section>
        <iframe src={MAP} title="Map" className="map" />
      </section>
    </>
  );
}

export default ContactSection;
