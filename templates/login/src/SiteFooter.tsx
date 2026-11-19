import { Container, Hero, Link } from '@allxsmith/bestax-bulma';

function SiteFooter() {
  return (
    <Hero.Foot as="footer" pb="2">
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
    </Hero.Foot>
  );
}

export default SiteFooter;
