import { Box, Cell, Column, Columns, Figure, Grid, Paragraph, Span } from "@allxsmith/bestax-bulma";
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
