# Bulma CV Template, rebuilt with bestax

A one-page CV beside a full-height photo, with social profile buttons and a light and dark
toggle, rebuilt as a React app with [bestax-bulma](https://bestax.io).

The original is [aldi](https://github.com/aldi)'s
[Bulma CV Template](https://github.com/aldi/bulma-cv-template), part of
[awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), aldi's collection of
free Bulma templates. This port was made from commit
[`29108ebb52030480ee40c8224d2f6f8a3587926d`](https://github.com/aldi/bulma-cv-template/tree/29108ebb52030480ee40c8224d2f6f8a3587926d),
and the original's [live demo](https://aldi.github.io/bulma-cv-template/) shows the page it
started from.

## Run it

```bash
npm install && npm run dev
```

Inside the bestax repository, install with `pnpm install --ignore-workspace` instead, so pnpm
treats the folder as a project of its own.

## What's inside

- `src/App.tsx` lays out the page and holds the light or dark choice, and `ThemeToggle.tsx`,
  `Intro.tsx` and `SocialLinks.tsx` hold its parts, built from bestax components in place of
  the original's Bulma markup.
- Light and dark work as in the original. A small script in `index.html` puts the saved choice,
  or the visitor's OS preference, on `<html data-theme>` before the page first paints, so the
  page never flashes the other scheme. The app starts from what it wrote (`src/colorMode.ts`)
  and passes the choice to bestax's `Theme` as `colorMode`, which keeps the attribute in step,
  and the toggle saves it for the next visit.
- `src/index.css` is the original's stylesheet, ported, and `public/` holds its photo and
  favicon.
- The social buttons take their brand colors from aldi's
  [bulma-social](https://github.com/aldi/bulma-social), as the original does: its classes go on
  bestax's `Button` through `className`.
- Icons are Font Awesome, from its npm package, and the Quicksand font loads from Google Fonts
  in `index.html`, which also holds the original's meta tags and its structured data (JSON-LD).

## Changes from the original

- The toggle's name stays "Dark mode", and `aria-pressed` says whether it's on. The original
  renamed it to the action it would take, so a screen reader heard "Switch to light mode,
  pressed", which reads as light mode being on.
- The toggle slides in from above, as its own rule in the original's stylesheet asks. The
  original's animation for every button overrode that rule, so the toggle rose in with the
  social buttons instead.
- On narrow screens the heading starts below the toggle, which the original put over its first
  letter.
- The page no longer scrolls sideways. Bulma's columns reach past their parent by their gap,
  expecting a padded container the original doesn't have, so `main` clips that overflow.
- Where a browser blocks storage, the page follows the OS preference and the toggle still works.
  The original's scripts stopped with an error there: the page started light whatever the OS
  preferred, and the toggle switched the scheme without changing its icon or its pressed state.
- `index.html` leaves out the original's Content-Security-Policy `<meta>`. It allowed what the
  original loaded, the jsDelivr CDN among it, and a policy for the port depends on where you
  host it, so set one in your host's headers.
- `index.html` also leaves out what names the original's own site: its canonical link, the
  social cards' page URL and preview image, and the structured data's `url`. Add your own when
  you deploy.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps aldi's notice, followed by the notice for this
port.
