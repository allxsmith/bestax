import { Cell, Grid } from "@allxsmith/bestax-bulma";
export function Gallery() {
  return (
    <section>
      <Grid gap="2" minCol={8}>
        <Cell>One</Cell>
        <Cell colSpan={2}>Two, spanning</Cell>
        <Cell rowStart={2} colFromEnd={1}>Three</Cell>
        <Cell bgColor="light">Four</Cell>
      </Grid>
      <Grid className="is-gap-0.5">
        <Cell>A half-step gap stays a class</Cell>
      </Grid>
      <Grid isFixed fixedCols={3}>
        <Cell>Fixed</Cell>
      </Grid>
    </section>
  );
}
