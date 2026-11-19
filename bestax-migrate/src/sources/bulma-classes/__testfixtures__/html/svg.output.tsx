import { Icon, Image } from "@allxsmith/bestax-bulma";

export default function SvgPage() {
  // TODO(bestax-migrate): bestax `IconText` builds its icons from props and wraps each text in a <span> of its own, so this converts only when its children are `.icon`s with no `key`, `ref` or dashed attribute but an `aria-` one, each holding one bare, empty <i> that names a Font Awesome or Material Design Icons glyph, and each followed by at most one bare <span> of static text; keep it as markup, or convert it by hand (svg.html:1)
  return (
    <>
      <span className="icon-text">
        <Icon>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </Icon>
        <span>Clock</span>
      </span>
      <Image as="figure" size="64x64">
        <svg viewBox="0 0 64 64" role="img" aria-label="Logo">
          <defs>
            <linearGradient id="fade" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00d1b2" />
              <stop offset="100%" stopColor="#485fc7" stopOpacity=".8" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="12" fill="url(#fade)" />
          <use xlinkHref="#mark" />
          <foreignObject x="8" y="8" width="48" height="48"><p className="is-size-7">Hi</p></foreignObject>
        </svg>
      </Image>
    </>
  );
}
