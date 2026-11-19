import { Container, Link, Paragraph, Section } from '@allxsmith/bestax-bulma';

/** The original's credit, kept where it was. */
function SiteFooter() {
  return (
    <Section id="footer">
      <Container textAlign="centered">
        <Paragraph textColor="black" textSize="7">
          Built with{' '}
          <i className="fa-solid fa-heart heart" aria-hidden="true" /> by
          restylianos
        </Paragraph>
        <Link
          href="https://github.com/restylianos"
          textSize="4"
          aria-label="restylianos on GitHub"
        >
          <i className="fa-brands fa-github github" aria-hidden="true" />
        </Link>
      </Container>
    </Section>
  );
}

export default SiteFooter;
