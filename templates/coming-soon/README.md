# Bulma Coming Soon Template, rebuilt with bestax

A full-screen "coming soon" page over a building going up at dawn, with round social buttons and an
email signup, rebuilt as a React app with [bestax-bulma](https://bestax.io).

The original is [aldi](https://github.com/aldi)'s
[Bulma Coming Soon Template](https://github.com/aldi/bulma-coming-soon-template), part of
[awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), aldi's collection of
free Bulma templates. This port was made from commit
[`7a9d786fe0bc610ec174b2a0a11e994051339345`](https://github.com/aldi/bulma-coming-soon-template/tree/7a9d786fe0bc610ec174b2a0a11e994051339345),
and the original's [live demo](https://aldi.github.io/bulma-coming-soon-template/) shows the
page it started from.

## Run it

```bash
npm install && npm run dev
```

Inside the bestax repository, install with `pnpm install --ignore-workspace` instead, so pnpm
treats the folder as a project of its own.

## What's inside

- `src/App.tsx` lays out the page, and `SocialLinks.tsx`, `NotifyForm.tsx` and `SiteFooter.tsx`
  hold its sections, built from bestax components in place of the original's Bulma markup.
- `src/index.css` is the original's stylesheet, ported, and `public/` holds the background
  drawn for this port (see [Images](#images)).
- The social buttons take their brand colors from aldi's
  [bulma-social](https://github.com/aldi/bulma-social), as the original does: its classes go on
  bestax's `Button` through `className`. Point each link in `src/SocialLinks.tsx` at your own
  page.
- Icons are Font Awesome, from its npm package, and the Inter font loads from Google Fonts in
  `index.html`.

## Changes from the original

- `index.html` pins Bulma's light scheme, as the original's design is light only.
- On a phone the title shrinks with the screen. The original keeps it on one line at a size
  wider than a phone, so the page scrolled sideways.
- Submitting the form stays on the page. The original posts to `/subscribe`, which a static host
  answers with an error page; send the address to your list from the form's `onSubmit` in
  `src/NotifyForm.tsx`.

## Images

`public/media/background.svg`, a blocky building site at dawn with a tower crane and a half-built
block in scaffolding, is voxel art drawn by code for this port:
[`scenes/coming-soon.mjs`](https://github.com/allxsmith/bestax/blob/main/docs/scripts/template-art/scenes/coming-soon.mjs)
in the bestax repository places every block, and the renderer beside it writes the SVG, so running
it again writes the same file. No photo, illustration, stock image or image-generation model went
into it, and it copies existing artwork. It replaces the original's background photo, whose source
the original does not record, so this port ships no image of unknown origin.

`image-provenance.json` records the image with its SHA-256 hash, so anyone can check that the file
shipped is the one described here.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps aldi's notice, followed by the notice for this
port.
