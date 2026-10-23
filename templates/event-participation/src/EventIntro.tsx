import { Image, Paragraph, SubTitle, Title } from '@allxsmith/bestax-bulma';

/**
 * The logo, the headings and the invitation. A fragment, so each part is a
 * child of the page's <main>, which staggers their fade-in one by one.
 */
function EventIntro() {
  return (
    <>
      <Image as="figure" size="96x96" textAlign="centered" mx="auto">
        <img
          src="/media/event_logo_gold.svg"
          alt="Bulma Event Participation Template Logo"
          width={96}
          height={96}
        />
      </Image>
      {/* `size` would also make it an <h3>, so the size is a helper. */}
      <Title textSize="3">Our Company Celebrates 50 Years!</Title>
      <SubTitle as="h2" textSize="5">
        Celebrate with us!
      </SubTitle>
      <p>
        We invite you to our Press Conference &amp; VIP Cocktail on{' '}
        <strong>
          <time dateTime="2027-01-01">January 1st 2027</time>
        </strong>{' '}
        at Tae Kwon Do, VIP hall.
        <br />
        We’re so pleased to welcome you to our celebration of linking people
        together.
      </p>
      <Paragraph mt="3" className="is-subtitle">
        Select below the talks that you will participate in.
      </Paragraph>
    </>
  );
}

export default EventIntro;
