// The components the codemod writes as plain markup take their element from
// a literal `renderAs`, and keep RBC's default beside one it can't read.
import { Breadcrumb, Panel, Tabs } from "@allxsmith/bestax-bulma";

export const Literal = () => (
  <div>
    <span className="label">Name</span>
    <span className="help is-danger">Required
          </span>
    <span className="loader"></span>
    <Panel.Tabs>
      <span className="is-active">All
              </span>
    </Panel.Tabs>
    <Breadcrumb>
      <span className="is-active">Home
              </span>
    </Breadcrumb>
    <section className="table-container">No rows</section>
    <Tabs>
<Tabs.List>
        <Tabs.Item><span>Music</span></Tabs.Item>
      </Tabs.List>
</Tabs>
  </div>
);

// TODO(bestax-migrate): dynamic Form.Label `renderAs`; it became a plain <label> — render the tag yourself
// TODO(bestax-migrate): dynamic Form.Help `renderAs`; it became a plain <p> — render the tag yourself
// TODO(bestax-migrate): dynamic Loader `renderAs`; it became a plain <div> — render the tag yourself
// TODO(bestax-migrate): dynamic Panel.Tabs.Tab `renderAs`; it became a plain <a> — render the tag yourself
// TODO(bestax-migrate): dynamic Breadcrumb.Item `renderAs`; it became a plain <li> — render the tag yourself
// TODO(bestax-migrate): dynamic Table.Container `renderAs`; it became a plain <div> — render the tag yourself
// TODO(bestax-migrate): dynamic Tabs.Tab `renderAs`; it became a plain <a> — render the tag yourself
export const Dynamic = ({ tag }: { tag: 'span' }) => (
  <div>
    <label className="label">Name</label>
    <p className="help">Required</p>
    <div className="loader"></div>
    <Panel.Tabs>
      <a>All</a>
    </Panel.Tabs>
    <Breadcrumb>
      <li><a>Home</a></li>
    </Breadcrumb>
    <div className="table-container">No rows</div>
    <Tabs>
<Tabs.List>
        <Tabs.Item><a>Music</a></Tabs.Item>
      </Tabs.List>
</Tabs>
  </div>
);
