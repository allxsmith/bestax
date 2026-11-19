// The components the codemod writes as plain markup take their element from
// a literal `as`, and keep rbx's default beside one it can't read.
import { Breadcrumb, Field, Panel } from "@allxsmith/bestax-bulma";

export const Literal = () => (
  <div>
    <span className="help is-danger">Required
          </span>
    <span className="label">Name</span>
    <span className="loader"></span>
    <Panel.Tabs>
      <span className="is-active">All
              </span>
    </Panel.Tabs>
    <Breadcrumb>
      <li className="is-active"><span>Home
                </span></li>
    </Breadcrumb>
    <Field>
      <div>Fields</div>
    </Field>
  </div>
);

// TODO(bestax-migrate): dynamic Help `as`; it became a plain <p> — render the tag yourself
// TODO(bestax-migrate): dynamic Label `as`; it became a plain <label> — render the tag yourself
// TODO(bestax-migrate): dynamic Loader `as`; it became a plain <div> — render the tag yourself
// TODO(bestax-migrate): dynamic Panel.Tab `as`; it became a plain <a> — render the tag yourself
// TODO(bestax-migrate): dynamic Breadcrumb.Item `as`; it became a plain <a> — render the tag yourself
// TODO(bestax-migrate): dynamic Fieldset `as`; it became a plain <fieldset> — render the tag yourself
export const Dynamic = ({ tag }: { tag: 'span' }) => (
  <div>
    <p className="help">Required</p>
    <label className="label">Name</label>
    <div className="loader"></div>
    <Panel.Tabs>
      <a>All</a>
    </Panel.Tabs>
    <Breadcrumb>
      <li><a>Home</a></li>
    </Breadcrumb>
    <Field>
      <fieldset>Fields</fieldset>
    </Field>
  </div>
);
