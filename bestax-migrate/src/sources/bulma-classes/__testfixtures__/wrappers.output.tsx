import { Cell, Grid, Table } from "@allxsmith/bestax-bulma";
export function Wrappers() {
  // TODO(bestax-migrate): give this `Table` a name in `aria-label` or `aria-labelledby`, such as an `aria-labelledby` pointing at a heading or at its caption's `id`: while it overflows, bestax `Table isResponsive` makes its `.table-container` a region you can tab to, named by those alone
  // TODO(bestax-migrate): bestax `Table isResponsive` renders `.table-container` itself, so this element converts only around a single element that becomes a `Table`, with nothing else beside it
  return (
    <section>
      <Table isStriped isFullwidth isResponsive>
        <tbody>
          <tr>
            <td>Scrolls on a small screen</td>
          </tr>
        </tbody>
      </Table>
      <Grid gap="2" isFixed fixedCols={3} fixedColsMobile={1}>
        <Cell>One</Cell>
        <Cell>Two</Cell>
      </Grid>
      <Grid isFixed fixedCols="auto">
        <Cell>Auto</Cell>
      </Grid>
      <div className="table-container">
        <p>A caption beside the table stays inside the wrapper</p>
        <Table>
          <tbody>
            <tr>
              <td>x</td>
            </tr>
          </tbody>
        </Table>
      </div>
    </section>
  );
}
