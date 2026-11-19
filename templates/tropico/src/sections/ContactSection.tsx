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

const fields = ['Name', 'Phone Number', 'Email'];

/**
 * "Contact Us" and the map below it, on the home page and the contact page.
 * The fields have only placeholders, as in the original, so each takes its
 * placeholder as its `aria-label` too, which names it for a screen reader
 * once something is typed in it.
 */
function ContactSection() {
  return (
    <>
      <Section id="contact-section">
        <Container>
          <Columns>
            <Column size="half">
              <Title size="2">Contact Us</Title>
              <form>
                {fields.map(field => (
                  <Field key={field}>
                    <InputBase
                      className="is-custom-field"
                      type="text"
                      placeholder={field}
                      aria-label={field}
                    />
                  </Field>
                ))}
                <Field>
                  <Control>
                    <TextAreaBase placeholder="Message" aria-label="Message" />
                  </Control>
                </Field>
              </form>
            </Column>
            <Column size="half" />
          </Columns>
        </Container>
      </Section>

      <section className="map-section">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d10499.966498430253!2d2.2944813!3d48.8583701!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x8ddca9ee380ef7e0!2zz4DPjc-BzrPOv8-CIM-Ezr_PhSDOkc6Qz4bOtc67!5e0!3m2!1sel!2sgr!4v1609878476869!5m2!1sel!2sgr"
          id="map"
          title="Map"
          loading="lazy"
        />
      </section>
    </>
  );
}

export default ContactSection;
