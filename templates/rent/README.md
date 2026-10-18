# Bulma Rent Template, rebuilt with bestax

A landing page for a rental listings site, with a search box, listing cards and city links,
rebuilt as a React app with [bestax-bulma](https://bestax.io).

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

- `src/App.tsx` stacks the page's sections: `SearchHero.tsx` (with the top bar in
  `SiteNavbar.tsx`), `RentalListings.tsx`, `Marketplaces.tsx`, `BrowseRentals.tsx`,
  `LandlordsCta.tsx` and `SiteFooter.tsx`. `RentalCard.tsx` is the listing card they share.
- `src/index.css` is the original's stylesheet, ported, and `public/media/` holds its
  illustrations and `placeholder.svg`, the grey stand-in every listing card shows until you
  pass `RentalCard` a photo of your own.
- Icons are Font Awesome, from its npm package, and the Montserrat font loads from Google Fonts
  in `index.html`.

## Changes from the original

- The original is built on Bulma 0.8 and Font Awesome 5; the port is on Bulma v1, through
  bestax, and the current Font Awesome. The burger menu is React state in place of the
  original's script.
- "Sign in" pointed at a login page that awesome-bulma-templates no longer has. It now opens
  the bestax port of aldi's Login template in StackBlitz, in a new tab; change `SIGN_IN_URL` in
  `src/SiteNavbar.tsx` to point it at your own.
- bulma.io moved the Bulma logo and the "Made with Bulma" badge, so both point at the images'
  current addresses.
- The logo linked to `rent.html`, and the listing cards to pages under `s/`, none of which the
  original ships, and one card linked nowhere. The logo now links to `/`, and every card to `#`,
  like the page's other placeholder links.
- The search icon was a copy of the SVG Font Awesome's script draws, without the stylesheet that
  sizes it, so it showed oversized. It is bestax's `Icon` on the input now. The input's
  `defaultvalue` attribute, which HTML has no use for, is gone.
- Searching stays on the page, from Enter or the Go! button; run the search from the form's
  `onSubmit` in `src/SearchHero.tsx`.
- The stylesheet sets Montserrat on headings and buttons but never loaded it, so most visitors
  saw a fallback font. `index.html` loads it now.
- The listing photos hot-linked a placeholder service. They are a local grey placeholder in
  `public/media/` now, drawn like the service's, so the page loads nothing from it.
- bestax's stylesheet ships a blue primary color, and `src/index.css` sets Bulma's turquoise
  back. Bulma v1 writes the labels on turquoise and green in a dark shade where 0.8 wrote
  white, which reads far more clearly, and the port keeps that. The footer links take Bulma's
  darker turquoise for text on the page in place of the full turquoise, which barely reads on
  the light footer.
- The subtitles' grey is the original's, darkened in its own hue until it reads at the contrast
  text needs on white and on the light sections; the original's was too faint for that.
- The Denver card's photo was described as houses on a card for apartments. Each state card's
  photo description now comes from what the card says, so the two agree.
- The original's spacing classes (`m-t-50` and the like) are bestax's spacing props, on the
  nearest step of Bulma's scale, and each card's doubled `card-image` wrapper is a single one.
- `index.html` pins Bulma's light scheme, as the original's design is light only.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps aldi's notice, followed by the notice for this
port.
