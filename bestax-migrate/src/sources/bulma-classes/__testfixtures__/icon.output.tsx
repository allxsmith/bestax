import { Button, Buttons, Control, Field, Icon, InputBase } from "@allxsmith/bestax-bulma";
export function Icons() {
  // TODO(bestax-migrate): bestax `Icon` writes `aria-hidden="true"` on the `.icon`, and takes it from the <i> inside only when that <i> is empty, carries nothing else and names a glyph it renders from props, which this one doesn't; the `.icon` holds nothing else, so the attribute hides the same glyph there: move it up onto the `.icon`, then re-run
  // TODO(bestax-migrate): bestax `Icon` renders `aria-hidden="true"` when the element does not set it; add it here if that is what you want, then re-run, and this converts to `Icon` with `library="fa" name="check"`; or, since the `.control` around it has `has-icons-right`, drop this `.icon` and give that `Control` `iconRight={{ library: "fa", name: "check", size: "small" }}`, which it renders after its children as a `.icon.is-right` around the glyph's <i>, hidden the way `Icon` hides it
  // TODO(bestax-migrate): this `.icon` sits in an <a> that its `aria-label` names, so the icon is decoration there, and bestax `Icon` writes `aria-hidden="true"` on an icon with no name of its own, which this one doesn't carry; add it, then re-run, and this converts to `Icon` with `library="fa" name="github" variant="brands" features="fa-lg"`
  // TODO(bestax-migrate): this `.icon` sits in a <button> that its own text names, so the icon is decoration there, and bestax `Icon` writes `aria-hidden="true"` on an icon with no name of its own, which this one doesn't carry; add it, then re-run, and this converts to `Icon` with `library="fa" name="paper-plane"`
  // TODO(bestax-migrate): nothing names the <a> around this `.icon`: it has no `aria-label` and no text outside its icons, and a font icon's glyph is no name a screen reader can read; give the <a> an `aria-label` that says what it does, then add `aria-hidden="true"` here, which bestax `Icon` writes on an icon with no name of its own, and re-run, and this converts to `Icon` with `library="fa" name="twitter" variant="brands"`
  // TODO(bestax-migrate): bestax `Icon` renders only <span>, not a <div>; keep the markup, or change the tag and re-run
  return (
    <section>
      {/* A hidden icon converts with its glyph as props. */}
      <Icon
        library="fa"
        name="star"
        variant="fa-solid"
        features="fa-lg"
        size="medium"
        textColor="warning"
        aria-hidden="true" />
      {/* Font Awesome 4 keeps its `fa`, which Icon renders as written. */}
      <Icon library="fa" name="envelope-o" variant="fa" aria-hidden="true" />
      {/* A named icon is an image, as Icon renders one. */}
      <Icon library="mdi" name="check-decagram" role="img" aria-label="Verified" />
      {/* An <i> with an id of its own stays the icon's child. */}
      <Icon aria-hidden="true">
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
            <Icon library="fa" name="envelope" size="small" className="is-left" />
            <span className="icon is-small is-right">
              <i className="fas fa-check"></i>
            </span>
          </Control>
        </Field>
        <Button color="info" type="submit">
          <Icon library="fa" name="bell" variant="regular" />
          <span>Notify me</span>
        </Button>
      </form>
      <Buttons>
        {/* Labelled, so the icon is decoration. */}
        <Button as="a" size="medium" href="https://github.com/" aria-label="GitHub">
          <span className="icon">
            <i className="fab fa-github fa-lg"></i>
          </span>
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
      </Buttons>
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
