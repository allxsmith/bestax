import {
  Button,
  Column,
  Columns,
  Container,
  Hero,
  Paragraph,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';
import SiteNavbar from './SiteNavbar.tsx';

const offers = [
  'Lorem ipsum dolor sit amet',
  'Augue mauris augue neque gravida in',
  'Faucibus pulvinar elementum integer',
  'Faucibus purus in massa tempor nec',
  'Ante metus dictum at tempor commodo',
];

/**
 * Takes the visitor down to the steps, as the original's jQuery did. The
 * scroll is smooth because index.css sets `scroll-behavior` on the page.
 */
function showSteps() {
  document.getElementById('features')?.scrollIntoView();
}

/** The top of the page: the navbar, the pitch and the wedding illustration. */
function SiteHero() {
  return (
    <Hero id="hero" size="medium">
      <Hero.Head>
        <SiteNavbar />
      </Hero.Head>
      <Hero.Body>
        <Container>
          <Columns>
            <Column>
              <Title>Engaging line</Title>
              <Paragraph textAlignMobile="centered">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
                Gravida rutrum quisque non tellus orci ac auctor. Quis enim
                lobortis scelerisque fermentum.
              </Paragraph>
              <hr className="rounded" />

              <SubTitle as="p" size="3" mt="5">
                What we offer
              </SubTitle>
              {offers.map(offer => (
                <Paragraph key={offer} textAlignMobile="centered">
                  <i
                    className="fa-solid fa-check offer-check"
                    aria-hidden="true"
                  />{' '}
                  {offer}
                </Paragraph>
              ))}
              <Button
                type="button"
                className="offer-button"
                textSize="6"
                isRounded
                mt="4"
                onClick={showSteps}
              >
                Learn more
              </Button>
            </Column>

            <Column>
              <img src="/media/undraw_wedding_t1yl.svg" alt="" />
            </Column>
          </Columns>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default SiteHero;
