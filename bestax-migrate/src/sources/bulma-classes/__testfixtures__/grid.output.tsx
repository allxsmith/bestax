import { Cell, Grid } from "@allxsmith/bestax-bulma";
export function Gallery() {
  // TODO(bestax-migrate): `.fixed-grid` stays as markup: `Grid isFixed` renders the `.fixed-grid` wrapper itself, from `fixedCols`; replace the wrapper and its `.grid` with one `Grid`, by hand
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
      <div className="fixed-grid has-3-cols">
        <Grid>
          <Cell>Fixed</Cell>
        </Grid>
      </div>
    </section>
  );
}
