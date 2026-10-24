import { Container, Link, Paragraph, Section } from '@allxsmith/bestax-bulma';

/** The original's credit, kept where it was, and the logo's. */
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
        {/* The logo is Icons8's, hot-linked from their site as the original has it. */}
        <Paragraph textColor="black" textSize="7">
          Logo by <Link href="https://icons8.com">Icons8</Link>
        </Paragraph>
      </Container>
    </Section>
  );
}

export default SiteFooter;
