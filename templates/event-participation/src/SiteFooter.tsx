import { Container, Hero, Paragraph } from '@allxsmith/bestax-bulma';

/** The credit line at the foot of the page. */
function SiteFooter() {
  return (
    <Hero.Foot as="footer">
      <Container textAlign="centered">
        <Paragraph pb="2" className="footer-text">
          <a
            href="https://github.com/aldi?utm_source=Github"
            target="_blank"
            rel="noopener noreferrer"
          >
            Designed with{' '}
            <i className="fas fa-heart fa-fw footer-heart" aria-hidden="true" />{' '}
            by aldi
          </a>
        </Paragraph>
      </Container>
    </Hero.Foot>
  );
}

export default SiteFooter;
