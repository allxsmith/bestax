import { Container, Hero, Paragraph } from '@allxsmith/bestax-bulma';

/** The original's credit, kept where it was. */
function SiteFooter() {
  return (
    <Hero.Foot>
      <footer>
        <Container textAlign="centered">
          <Paragraph pb="2" className="footer-text">
            <a
              href="https://github.com/aldi?utm_source=Github"
              target="_blank"
              rel="noopener noreferrer"
            >
              Designed with{' '}
              <i
                className="fa-solid fa-heart fa-fw footer-heart"
                aria-hidden="true"
              />{' '}
              by aldi
            </a>
          </Paragraph>
        </Container>
      </footer>
    </Hero.Foot>
  );
}

export default SiteFooter;
