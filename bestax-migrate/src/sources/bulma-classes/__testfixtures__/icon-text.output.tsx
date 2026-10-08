import { Icon, IconText } from "@allxsmith/bestax-bulma";
export function IconTexts() {
  // TODO(bestax-migrate): bestax `IconText` builds its icons from props and wraps each text in a <span> of its own, so this converts only when its children are `.icon`s with no `key`, `ref` or dashed attribute but an `aria-` one, each holding one bare, empty <i> that names a Font Awesome or Material Design Icons glyph, and each followed by at most one bare <span> of static text; keep it as markup, or convert it by hand
  // TODO(bestax-migrate): bestax `IconText` builds each icon from `iconProps`, so this converts only once every `.icon` in it converts to `Icon` on its own; see the TODO on each, then re-run
  // TODO(bestax-migrate): bestax `Icon` renders `aria-hidden="true"` when the element does not set it; add it here if that is what you want, then re-run
  // TODO(bestax-migrate): bestax `IconText` renders only <span>, not a <div>; keep the markup, or change the tag and re-run
  return (
    <section>
      <IconText iconProps={{
        library: "fa",
        name: "home",
        "aria-hidden": "true"
      }}>Home</IconText>
      <IconText
        textColor="success"
        id="saved"
        iconProps={{
          library: "fa",
          name: "check-circle",
          variant: "regular",
          features: "fa-lg",
          size: "small",
          textColor: "info",
          "aria-hidden": "true"
        }}>{"Saved & synced"}</IconText>
      <IconText
        items={[{
          iconProps: {
            library: "fa",
            name: "train",
            "aria-hidden": "true"
          },

          text: "Paris"
        }, {
          iconProps: {
            library: "fa",
            name: "arrow-right",
            role: "img",
            "aria-label": "To"
          },

          text: "Budapest"
        }, {
          iconProps: {
            library: "mdi",
            name: "check-bold",
            features: "mdi-24px",
            role: "img",
            "aria-label": "Done"
          }
        }]} />
      <IconText
        iconProps={{
          library: "fa",
          name: "star",
          variant: "fa-solid",
          role: "img",
          "aria-label": "Star"
        }} />
      {/* The glyph has an attribute Icon doesn't render. */}
      <span className="icon-text">
        <Icon aria-hidden="true">
          <i className="fas fa-info-circle" aria-hidden="true"></i>
        </Icon>
        <span>Info</span>
      </span>
      {/* The icon sets no aria-hidden, which Icon writes. */}
      <span className="icon-text">
        <span className="icon">
          <i className="fas fa-home"></i>
        </span>
        <span>Home</span>
      </span>
      {/* IconText renders a <span>, not a <div>. */}
      <div className="icon-text">
        <Icon aria-hidden="true">
          <i className="fas fa-exclamation-triangle"></i>
        </Icon>
        <span>Warning</span>
      </div>
      {/* Text before the icon. */}
      <span className="icon-text">
        <span>Next</span>
        <Icon aria-hidden="true">
          <i className="fas fa-arrow-right"></i>
        </Icon>
      </span>
    </section>
  );
}
