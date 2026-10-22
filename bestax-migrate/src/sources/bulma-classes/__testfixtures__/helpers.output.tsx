import { Box, Cell, Column, Columns, Figure, Grid, Link, Paragraph, Section, Span } from "@allxsmith/bestax-bulma";
export function Layout() {
  return (
    <section>
      <Box display="flex" gap="1.5" rowGap="3">Gaps</Box>
      <Paragraph pos="sticky" overflowY="auto">A sticky note</Paragraph>
      <Span radius="rounded" overflowX="clip">A pill</Span>
      <Figure aspectRatio="16by9" overflow="hidden">Video</Figure>
      <Grid gap="0.5" gapless>
        <Cell>Grid renders both</Cell>
      </Grid>
    </section>
  );
}

export function StaysBeside() {
  return (
    <section>
      <Paragraph gap="2" className="is-gapless">A gap drops gapless</Paragraph>
      <Paragraph pos="absolute" overlay className="is-relative">
        A position drops relative
      </Paragraph>
      <Paragraph overflowY="auto" className="is-overflow-hidden">
        An axis overflow is written per axis
      </Paragraph>
      <Columns isGapless className="is-gap-2 is-column-gap-1">
        <Column>The gutter is Columns&apos; own gap</Column>
      </Columns>
    </section>
  );
}

export function Bulma09Spacing() {
  return (
    <Section p="0">
      <Box p="0">Bulma 0.9&apos;s, as v1&apos;s</Box>
      <Paragraph textAlign="centered" m="0">Centered, no margin</Paragraph>
      <Paragraph textAlign="centered" className="marginless">v1&apos;s own name stays</Paragraph>
    </Section>
  );
}

export function Shades() {
  return (
    <section>
      <Paragraph textColor="primary" colorShade="on-scheme">On the scheme</Paragraph>
      <Span
        bgColor="info"
        backgroundColorShade="light"
        textColor="info"
        colorShade="dark">
        A light tag
      </Span>
      <Box textColor="link" colorShade="30">A darker link color</Box>
      <Link textColor="danger" colorShade="on-scheme" href="/x">
        A readable link
      </Link>
      <Paragraph textColor="primary" colorShade="30" className="has-text-info-40">The second stays</Paragraph>
      <p className="has-text-primary-30-invert">No single shade writes it</p>
    </section>
  );
}
