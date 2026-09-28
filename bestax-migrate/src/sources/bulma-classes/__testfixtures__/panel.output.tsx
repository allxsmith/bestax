import { Panel } from "@allxsmith/bestax-bulma";
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
      <label className="panel-block">
        <input type="checkbox" />
        remember me
      </label>
    </Panel>
  );
}
