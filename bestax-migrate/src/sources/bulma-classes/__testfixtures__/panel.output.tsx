import { Panel, Table } from "@allxsmith/bestax-bulma";
export function Repositories() {
  // TODO(bestax-migrate): `.panel-icon` stays as markup: bestax `Panel.Icon` renders through `Icon`, which always writes an `aria-label`
  return (
    <Panel mb="4" className="is-primary">
      <Panel.Heading>Repositories</Panel.Heading>
      <Panel.Tabs>
        <a className="is-active">All</a>
        <a>Public</a>
      </Panel.Tabs>
      <Panel.Block active href="/bulma">
        <span className="panel-icon">
          <i className="fas fa-book" aria-hidden="true"></i>
        </span>
        bulma
      </Panel.Block>
      <Panel.Block href="/marksheet">
        marksheet
      </Panel.Block>
      <Panel.Block as="label">
        <input type="checkbox" />
        remember me
      </Panel.Block>
    </Panel>
  );
}

export function Program() {
  return (
    <Panel as="section" className="is-info" aria-labelledby="program">
      <Panel.Heading id="program">
        Program
      </Panel.Heading>
      <Panel.Block as="div">
        <Table isFullwidth>
          <tbody>
            <tr>
              <td>9:00</td>
              <td>Grand Opening</td>
            </tr>
          </tbody>
        </Table>
      </Panel.Block>
      <Panel.Block as="label" htmlFor="remember">
        Remember me
      </Panel.Block>
    </Panel>
  );
}
