# Bulma Rent Template, rebuilt with bestax

A rental listings landing page, with a search box, a grid of listing cards, rentals by state
and neighborhood, and a call to action for landlords, rebuilt as a React app with
[bestax-bulma](https://bestax.io).

The original is [aldi](https://github.com/aldi)'s
[Bulma Rent Template](https://github.com/aldi/bulma-rent-template), part of
[awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), aldi's collection of
free Bulma templates. This port was made from commit
[`3d6bff06730d7274ab11f29f9b1c663819125dab`](https://github.com/aldi/bulma-rent-template/tree/3d6bff06730d7274ab11f29f9b1c663819125dab),
and the original's [live demo](https://aldi.github.io/bulma-rent-template/) shows the page it
started from.

## Run it

```bash
npm install && npm run dev
```

Inside the bestax repository, install with `pnpm install --ignore-workspace` instead, so pnpm
treats the folder as a project of its own.

## What's inside

- `src/App.tsx` lays out the page, and `SearchHero.tsx` (with `SiteNavbar.tsx`),
  `Listings.tsx`, `Marketplaces.tsx`, `Browse.tsx`, `Landlords.tsx` and `SiteFooter.tsx` hold
  its sections, built from bestax components in place of the original's Bulma markup.
  `ListingCard.tsx` is the card they share.
- `src/index.css` is the original's stylesheet, ported, after the Bulma variables that set back
  the look it had on Bulma 0.8, and `public/media/` holds the images drawn for this port (see
  [Images](#images)).
- Icons are Font Awesome, from its npm package.
- The headings and buttons name Montserrat, as the original's do, without loading it, so they
  show it only where it is installed. To have it everywhere, load it from Google Fonts in
  `index.html`.

## Changes from the original

- The logo is the site's name in type, and the "Made with Bulma" badge is a text link to
  bulma.io. The original shows Bulma's logo and badge, a trademark the port draws no copy of,
  hot-linked from bulma.io addresses that no longer exist, so both show as broken images there.
- The listing photos are a placeholder drawn for this port, in place of the one the original
  hot-links from a placeholder service. Put each listing's photo in its place.
- "Sign in" opens the demo of aldi's
  [Bulma Login Template](https://github.com/aldi/bulma-login-template). The original links a
  login page awesome-bulma-templates no longer has.
- The logo links to the home page, and the listing titles link to `#` like the page's other
  placeholder links. The original links pages it never shipped.
- The state cards' photo descriptions come from what each card says. The original describes
  the Denver card's photo as houses on a card for apartments.
- The search box's icon is Font Awesome's glyph. The original draws Font Awesome's SVG with
  no Font Awesome script to size it, so it fills the box's corner.
- Pressing Enter in the search box stays on the page, where the original reloads it; run the
  search from the form's `onSubmit` in `src/SearchHero.tsx`.
- The labels on the turquoise buttons and the green tag are dark, as Bulma 1 draws them, and
  the footer's links take the darker turquoise Bulma 1 makes for text. The original's white
  labels and bright links fall well short of the contrast text needs.
- `index.html` pins Bulma's light scheme, as the original's design is light only.

## Images

Every image in `public/media/` was drawn for this port on October 23, 2026 by Claude, Anthropic's
AI model, writing SVG markup by hand from ideas of its own rather than from the images they replace:
the street of homes in the hero, the chart beside "All marketplaces", the riverside town, the row
houses at night, and the listing placeholder. No photo, illustration,
stock image or image-generation model went into them, and they trace no existing artwork. Each file
is its own source: open it in a text editor to see every shape it draws. They replace the
original's illustrations, whose source the original does not record, and the placeholder it
hot-links, so this port ships no image of unknown origin.

`image-provenance.json` records each image with its SHA-256 hash, so anyone can check that the file
shipped is the one described here.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps aldi's notice, followed by the notice for this
port.
