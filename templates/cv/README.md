# Bulma CV Template, rebuilt with bestax

A one-page CV with a full-height illustration, social profile buttons and a light and dark toggle,
rebuilt as a React app with [bestax-bulma](https://bestax.io).

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

- `src/App.tsx` lays out the page, and `ThemeToggle.tsx`, `Intro.tsx` and `SocialLinks.tsx` hold
  its sections, built from bestax components in place of the original's Bulma markup.
- The light and dark toggle is bestax's `Theme`, which keeps Bulma's `data-theme` on `<html>` in
  step with the app's state. A small script in `index.html` writes the visitor's saved choice, or
  else their system's, before the first paint, and `src/colorMode.ts` saves each choice under the
  key that script reads.
- `src/index.css` is the original's stylesheet, ported, with its entrance animations, and
  `public/` holds the illustration drawn for this port (see [Images](#images)) and the favicon.
- The social buttons take their brand colors from aldi's
  [bulma-social](https://github.com/aldi/bulma-social), as the original does: its classes go on
  bestax's `Button` through `className`.
- Icons are Font Awesome, from its npm package, and the Quicksand font loads from Google Fonts in
  `index.html`.
- `index.html` keeps the original's description, social cards and structured data (JSON-LD),
  which name Kate Woodman. The profile links there and in `src/SocialLinks.tsx` are
  placeholders. Put your own in their place.

## Changes from the original

- At phone and tablet widths the heading starts below the theme toggle. The original pads the
  column by a share of its width, which leaves the toggle on top of the heading there.
- On a phone the page no longer pans sideways. Bulma's columns reach past their parent by half a
  gap on each side, for a padded container the original doesn't have, so `main` clips that
  overflow.
- The theme toggle keeps one name, "Dark mode", and says whether dark mode is on with
  `aria-pressed`. The original changed its name to "Switch to light mode" while pressed, so a
  screen reader heard a name and a state that disagree.
- Where a browser blocks storage, the page follows the system's scheme and the toggle still
  works. The original's scripts stopped with an error there, so the page started light whatever
  the system preferred, and the toggle switched the scheme without changing its icon or its
  pressed state.
- The original's Content Security Policy `<meta>` is left out. It was written for the files the
  original loads from CDNs, and Vite's dev server needs an inline script and a socket it doesn't
  allow. Send a policy of your own as a response header where you deploy.
- The original's canonical link, its `og:url`, `og:image` and `twitter:image`, and the `url` in
  its JSON-LD all named its own demo site, so they're left out. Add your own where you deploy.
  With no image to show, `twitter:card` is `summary` rather than the original's
  `summary_large_image`; switch it back once you add your own `twitter:image`.

## Images

`public/media/background.svg`, an invented, faceless figure framed by a web designer's tools, was
drawn for this port on October 23, 2026 by Claude, Anthropic's AI model, writing SVG markup by hand from an idea of its own rather than
from the image it replaces. No photo, illustration, stock image or image-generation model went into
it, and it copies no existing artwork.
The file is its own source: open it in a text editor to see every shape it draws. It replaces the
original's portrait photo, whose source the original does not record, so this port ships no image of
unknown origin.

The figure portrays no one, and Kate Woodman is a made-up name. Put your own photo and name in their
place.

`public/favicon.svg`, a white K on an orange square, was drawn for this port by hand too, in place
of an earlier favicon whose making was not recorded.

`image-provenance.json` records each image with its SHA-256 hash, so anyone can check that the file
shipped is the one described here.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps aldi's notice, followed by the notice for this
port.
