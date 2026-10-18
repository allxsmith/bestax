import { Container, Hero, Paragraph } from '@allxsmith/bestax-bulma';

/** The original's credit, kept where it was. */
function SiteFooter() {
  return (
    <Hero.Foot>
      <Container textAlign="centered" pb="1">
        <Paragraph className="footer-text">
          <a
            href="https://github.com/aldi"
            target="_blank"
            rel="noopener noreferrer"
          >
            Designed with{' '}
            <i className="fa-solid fa-heart fa-fw heart" aria-hidden="true" />{' '}
            by aldi
          </a>
        </Paragraph>
      </Container>
    </Hero.Foot>
  );
}

export default SiteFooter;
