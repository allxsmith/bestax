import { Container, Hero } from '@allxsmith/bestax-bulma';

/** The original's credit, kept where it was. */
function SiteFooter() {
  return (
    <Hero.Foot>
      <Container textAlign="centered" pb="1">
        <p className="footer-text">
          <a
            href="https://github.com/aldi"
            target="_blank"
            rel="noopener noreferrer"
          >
            Designed with{' '}
            <i className="fa fa-heart fa-fw heart" aria-hidden="true" /> by aldi
          </a>
        </p>
      </Container>
    </Hero.Foot>
  );
}

export default SiteFooter;
