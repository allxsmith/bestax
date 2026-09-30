import { Field, File, Icon } from "@allxsmith/bestax-bulma";
export function Uploads({ onPick }: { onPick: () => void }) {
  // TODO(bestax-migrate): bestax `File` renders a `.field` of its own around the `.file` unless it sits inside a `Field`, and nothing around this element is one or becomes one here; keep it as markup, or convert the `.field` around it, then re-run
  // TODO(bestax-migrate): bestax `File` renders the whole `.file` tree itself, so this converts only when its tree is the one it renders: one bare `.file-label` <label> holding a `.file-input` <input type="file">, a bare `.file-cta` <span> with a bare `.file-label` <span> of static content and at most one bare `.file-icon` <span> of static content on each side of it, and, with `has-name`, at most one bare `.file-name` <span> of static text; keep it as markup, or convert it by hand
  // TODO(bestax-migrate): bestax `File` puts the attributes it's given on its <input>, so this element's `id` would move there; move it onto the <input> if that's what you want, then re-run
  return (
    <form>
      <Field>
        <File name="resume" iconLeft={<i className="fas fa-upload"></i>} />
      </Field>
      <Field>
        <File
          isBoxed
          hasName
          mt="2"
          className="is-primary"
          name="photo"
          accept="image/*"
          onChange={onPick}
          buttonLabel="Upload a photo"
          iconRight={<Icon aria-label="Upload">
            <i className="fas fa-cloud-upload-alt"></i>
          </Icon>}
          fileName="portrait.png" />
      </Field>
      {/* No field around it, so File would render one of its own. */}
      <div className="file">
        <label className="file-label">
          <input className="file-input" type="file" name="cv" />
          <span className="file-cta">
            <span className="file-label">Upload</span>
          </span>
        </label>
      </div>
      {/* Something in the tree File doesn't render. */}
      <Field>
        <div className="file">
          <label className="file-label">
            <input className="file-input" type="file" name="doc" />
            <span className="file-cta">
              <span className="file-label">Upload</span>
              <small>PDF only</small>
            </span>
          </label>
        </div>
      </Field>
      {/* An attribute File would put on its input. */}
      <Field>
        <div className="file" id="upload">
          <label className="file-label">
            <input className="file-input" type="file" name="scan" />
            <span className="file-cta">
              <span className="file-label">Upload</span>
            </span>
          </label>
        </div>
      </Field>
    </form>
  );
}
