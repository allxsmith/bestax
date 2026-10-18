import { Button, Buttons, Control, Field, Icon, InputBase } from "@allxsmith/bestax-bulma";

export default function FontAwesomePage() {
  // TODO(bestax-migrate): bestax `Icon` writes `aria-hidden="true"` on the `.icon` and renders the <i> inside it bare, so it can't render this markup, where the <i> carries it; the `.icon` holds nothing else, so the attribute hides the same glyph there: move it up onto the `.icon`, then re-run, and this converts to `Icon` with `library="fa" name="envelope"`; or, since the `.control` around it has `has-icons-left`, drop this `.icon` and give that `Control` `iconLeft={{ library: "fa", name: "envelope", size: "small" }}`, which it renders after its children as a `.icon.is-left` around the glyph's <i>, hidden the way `Icon` hides it
  // TODO(bestax-migrate): this `.icon` holds the <svg> Font Awesome's script draws in place of an <i>, and bestax `Icon` writes `aria-hidden="true"` on the `.icon`, which this one doesn't carry; add it, then re-run, and this converts to `Icon` around the <svg> as it is; or write `Icon` with `library="fa" name="search"` in its place, which renders the <i> the script draws from, and shows only where Font Awesome's stylesheet or script is loaded; or, since the `.control` around it has `has-icons-left`, drop this `.icon` and give that `Control` `iconLeft={{ library: "fa", name: "search", size: "small" }}`, which it renders after its children as a `.icon.is-left` around the glyph's <i>, hidden the way `Icon` hides it
  // TODO(bestax-migrate): this `.icon` sits in a <button> that its own text names, so the icon is decoration there, and bestax `Icon` writes `aria-hidden="true"` on an icon with no name of its own, which this one doesn't carry; add it, then re-run, and this converts to `Icon` with `library="fa" name="bell" variant="regular"`
  // TODO(bestax-migrate): this `.icon` sits in an <a> that its `aria-label` names, so the icon is decoration there, and bestax `Icon` writes `aria-hidden="true"` on an icon with no name of its own, which this one doesn't carry; add it, then re-run, and this converts to `Icon` with `library="fa" name="x-twitter" variant="fa-brands" features="fa-lg"`
  // TODO(bestax-migrate): nothing names the <a> around this `.icon`: it has no `aria-label` and no text outside its icons, and a font icon's glyph is no name a screen reader can read; give the <a> an `aria-label` that says what it does, then add `aria-hidden="true"` here, which bestax `Icon` writes on an icon with no name of its own, and re-run, and this converts to `Icon` with `library="fa" name="github" variant="brands" features="fa-lg"`
  return (
    <>
      <form>
        <Field>
          <Control hasIconsLeft>
            <InputBase type="email" placeholder="Email" />{" "}
            <span className="icon is-small is-left">
              <i className="fas fa-envelope" aria-hidden="true" />
            </span>
          </Control>
        </Field>
        <Field>
          <Control hasIconsLeft>
            <InputBase type="search" placeholder="Search" />{" "}
            <span className="icon is-small is-left">
              <svg className="svg-inline--fa fa-search fa-w-16" aria-hidden="true" data-prefix="fas" data-icon="search" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M505 442.7L405.3 343z" /></svg>
            </span>
          </Control>
        </Field>
        <Button color="info" type="submit">
          <span className="icon">
            <i className="far fa-bell" />
          </span>
          <span>Notify me</span>
        </Button>
      </form>
      <Buttons>
        <Button as="a" href="https://x.com/" aria-label="Follow on X">
          <span className="icon">
            <i className="fa-brands fa-x-twitter fa-lg" />
          </span>
        </Button>
        <Button as="a" href="https://github.com/">
          <span className="icon">
            <i className="fab fa-github fa-lg" />
          </span>
        </Button>
      </Buttons>
      <p>
        <Icon library="fa" name="check-square" textColor="success" aria-hidden="true" />{" "}
        <Icon
          library="fa"
          name="envelope-o"
          variant="fa"
          features="fa-lg"
          size="medium"
          aria-hidden="true" />{" "}
        <Icon
          library="fa"
          name="triangle-exclamation"
          variant="fa-solid"
          role="img"
          aria-label="Warning" />
      </p>
    </>
  );
}
