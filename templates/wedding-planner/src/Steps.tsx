import {
  Column,
  Columns,
  Container,
  Paragraph,
  Section,
  Title,
} from '@allxsmith/bestax-bulma';

const text =
  'Scelerisque fermentum dui faucibus in ornare quam viverra orci. Ultricies mi quis hendrerit dolor. Aliquet lectus proin nibh nisl condimentum. Sit amet dictum sit amet justo donec. Iaculis eu non diam phasellus vestibulum lorem.';

interface StepProps {
  title: string;
  /** The illustration's file in public/media. */
  image: string;
  /** How much of its column the illustration takes, in percent. */
  width: 50 | 70;
  /** Whether the illustration comes first, on the left from tablet up. */
  imageFirst?: boolean;
}

/** One step: its copy beside its illustration. */
function Step({ title, image, width, imageFirst = false }: StepProps) {
  const copy = (
    <Column>
      <Title>{title}</Title>
      <Paragraph textColor="black">{text}</Paragraph>
    </Column>
  );
  const illustration = (
    <Column>
      <img src={`/media/${image}`} alt="" className={`width-${width}`} />
    </Column>
  );

  return (
    <Container>
      <Columns>
        {imageFirst ? illustration : copy}
        {imageFirst ? copy : illustration}
      </Columns>
    </Container>
  );
}

/**
 * The four steps, on a pink to white gradient. The hero's "Learn more"
 * scrolls here.
 */
function Steps() {
  return (
    <Section id="features">
      <Step title="Step one" image="undraw_agreement_aajr.svg" width={70} />

      <br />
      <br />

      <Step
        title="Step two"
        image="undraw_window_shopping_b96y.svg"
        width={50}
        imageFirst
      />
      <Step title="Step three" image="undraw_camera_mg5h.svg" width={70} />

      <br />
      <br />

      <Step
        title="Step four"
        image="undraw_having_fun_iais.svg"
        width={50}
        imageFirst
      />
    </Section>
  );
}

export default Steps;
