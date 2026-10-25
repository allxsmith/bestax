import { Button, Buttons, Control, Field, Icon, InputBase, Span } from "@allxsmith/bestax-bulma";
export function Icons() {
  // TODO(bestax-migrate): bestax `Icon` writes `aria-hidden="true"` on the `.icon`, and takes it from the <i> inside only when that <i> is empty, carries nothing else and names a glyph it renders from props, which this one doesn't; the `.icon` holds nothing else, so the attribute hides the same glyph there: move it up onto the `.icon`, then re-run
  // TODO(bestax-migrate): bestax `Icon` renders `aria-hidden="true"` when the element does not set it; add it here if that is what you want, then re-run, and this converts to `Icon` with `name="check"`; or, since the `.control` around it has `has-icons-right`, drop this `.icon` and give that `Control` `iconRight={{ name: "check", size: "small" }}`, which it renders after its children as a `.icon.is-right` around the glyph's <i>, hidden the way `Icon` hides it
  // TODO(bestax-migrate): this `.icon` sits in a <button> that its own text names, so the icon is decoration there, and bestax `Icon` writes `aria-hidden="true"` on an icon with no name of its own, which this one doesn't carry; add it, then re-run, and this converts to `Icon` with `name="paper-plane"`
  // TODO(bestax-migrate): nothing names the <a> around this `.icon`: it has no `aria-label` and no text outside its icons, and a font icon's glyph is no name a screen reader can read; give the <a> an `aria-label` that says what it does, then re-run, and this converts to `Icon` with `name="twitter" variant="brands"`, which hides the icon with `aria-hidden="true"`
  // TODO(bestax-migrate): this `.icon` sits in an <a> with no `href`, which is no link and has no role, so ARIA lets nothing name it and its `aria-label` names nothing; give the <a> an `href`, or make it a <button>, then re-run, and this converts to `Icon` with `name="bars"`, which hides the icon with `aria-hidden="true"`
  // TODO(bestax-migrate): this `.icon` sits in a <button> that its `aria-label` names, so the icon is decoration there, and bestax `Icon` writes `aria-hidden="true"` on an icon with no name of its own, which this one doesn't carry; add it, then re-run, and this converts to `Icon` with `name="pen"`
  // TODO(bestax-migrate): bestax `Icon` renders only <span>, not a <div>; keep the markup, or change the tag and re-run
  return (
    <section>
      {/* A hidden icon converts with its glyph as props. */}
      <Icon name="star" features="fa-lg" size="medium" textColor="warning" />
      {/* Font Awesome 4 keeps its `fa`, which Icon renders as written. */}
      <Icon name="envelope-o" variant="fa" />
      {/* Font Awesome 6's long name for a style reads as the skill's. */}
      <Icon name="x-twitter" variant="brands" />
      {/* But beside fa-sharp, whose family the short name would undo. */}
      <Icon name="house" variant="fa-solid" features="fa-sharp" />
      {/* A named icon is an image, as Icon renders one. */}
      <Icon library="mdi" name="check-decagram" aria-label="Verified" />
      {/* An <i> with an id of its own stays the icon's child. */}
      <Icon>
        <i className="fas fa-moon" id="theme-icon"></i>
      </Icon>
      {/* So it keeps its own aria-hidden, which only a bare <i> moves up. */}
      <span className="icon">
        <i className="fas fa-sun" id="sun-icon" aria-hidden="true"></i>
      </span>
      <form>
        <Field>
          <Control hasIconsLeft hasIconsRight>
            <InputBase type="email" placeholder="Email" />
            {/* Font Awesome's own markup hides the <i>. */}
            <Icon name="envelope" size="small" className="is-left" />
            <span className="icon is-small is-right">
              <i className="fas fa-check"></i>
            </span>
          </Control>
        </Field>
        <Button color="info" type="submit">
          <Icon name="bell" variant="regular" />
          <span>Notify me</span>
        </Button>
      </form>
      <Buttons>
        {/* Labelled, so the icon is decoration. */}
        <Button as="a" size="medium" href="https://github.com/" aria-label="GitHub">
          <Icon name="github" variant="brands" features="fa-lg" />
        </Button>
        <Button type="button">
          <span className="icon">
            <i className="fas fa-paper-plane"></i>
          </span>
          <span>Send</span>
        </Button>
        {/* Nothing names this link but its icon. */}
        <Button as="a" href="https://twitter.com/">
          <span className="icon">
            <i className="fab fa-twitter"></i>
          </span>
        </Button>
        {/* Named by reference, so this icon is decoration too. */}
        <Button type="button" aria-labelledby="save-label">
          <Icon name="floppy-disk" variant="regular" />
        </Button>
        {/* An <a> with no href is no link, so its label names nothing. */}
        <Button as="a" aria-label="Menu">
          <span className="icon">
            <i className="fas fa-bars"></i>
          </span>
        </Button>
        {/* A title on the icon would be hidden with it. */}
        <Button type="button" aria-label="Edit">
          <span className="icon" title="Edit">
            <i className="fas fa-pen"></i>
          </span>
        </Button>
      </Buttons>
      <Span id="save-label" visibility="sr-only">Save</Span>
      {/* Icon renders only a <span>, so on a <div> the tag is all it says. */}
      <div className="icon">
        <i className="fas fa-home"></i>
      </div>
      <a href="https://github.com/" aria-label="GitHub">
        <div className="icon">
          <i className="fab fa-github"></i>
        </div>
      </a>
      <a href="https://twitter.com/">
        <div className="icon">
          <i className="fab fa-twitter"></i>
        </div>
      </a>
    </section>
  );
}
