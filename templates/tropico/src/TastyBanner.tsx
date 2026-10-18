import { Section, Title } from '@allxsmith/bestax-bulma';

/**
 * The "Very tasty fruits" band, white type on a photo (`tasty-fruits`, in
 * index.css). On the home page and the Fruits page.
 */
function TastyBanner() {
  return (
    <Section className="tasty-fruits">
      <Title size="1" textAlign="centered" className="is-white-text-title">
        VERY TASTY FRUITS
      </Title>
    </Section>
  );
}

export default TastyBanner;
