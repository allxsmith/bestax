import { Container, Hero, Link } from '@allxsmith/bestax-bulma';

/** The original's credit, kept where it was. */
function SiteFooter() {
  return (
    <Hero.Foot pb="2">
      <footer>
        <Container textAlign="centered">
          <Link
            textColor="grey-dark"
            textSize="7"
            href="https://www.aldi.st?utm_source=Github&utm_medium=bulma-login-template"
          >
            Designed with{' '}
            <i
              className="fa-solid fa-heart fa-xs has-text-danger"
              aria-hidden="true"
            />{' '}
            by aldi
          </Link>
        </Container>
      </footer>
    </Hero.Foot>
  );
}

export default SiteFooter;
