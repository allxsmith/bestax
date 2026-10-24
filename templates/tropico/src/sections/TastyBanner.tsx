import { Section, Title } from '@allxsmith/bestax-bulma';

/**
 * The "Very tasty fruits" banner, on the home page and the fruits page. Its
 * photo is in `src/index.css`, on `#tasty-fruits-section`.
 */
function TastyBanner() {
  return (
    <Section id="tasty-fruits-section">
      <Title size="1" textAlign="centered" className="is-white-text-title">
        VERY TASTY FRUITS
      </Title>
    </Section>
  );
}

export default TastyBanner;
