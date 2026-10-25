# Bulma Tropico Template, rebuilt with bestax

A fruit shop's site with a home page, fruits, services and contact pages, an opening carousel and
a testimonial carousel, rebuilt as a React app with [bestax-bulma](https://bestax.io).

The original is [restylianos](https://github.com/restylianos)'s
[Bulma Tropico Template](https://github.com/restylianos/bulma-tropico-template), whose license
names lizzli, part of [awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates),
aldi's collection of free Bulma templates. This port was made from commit
[`0f019f6ed36459d63f4466783f5c101f07a48490`](https://github.com/restylianos/bulma-tropico-template/tree/0f019f6ed36459d63f4466783f5c101f07a48490),
and the original's [live demo](https://restylianos.github.io/bulma-tropico-template/) shows the
pages it started from.

## Run it

```bash
npm install && npm run dev
```

Inside the bestax repository, install with `pnpm install --ignore-workspace` instead, so pnpm
treats the folder as a project of its own.

## What's inside

- Each of the original's HTML pages is a component in `src/pages/`, and the sections they share,
  such as the navbar, the footer and the fruit list, are components in `src/sections/`.
- `src/router.ts` picks the page from the address's hash (`#/fruits`), so the pages link to each
  other with no router package, and `src/App.tsx` renders the page it names between the navbar
  and the footer.
- The carousels are bestax's `Carousel` in place of the original's bulma-carousel script, set up
  in `src/sections/TropicoCarousel.tsx` to stop at either end as bulma-carousel does.
- `src/index.css` is the original's stylesheet, ported, after the lines that set back the look of
  the Bulma 0.9 it was made for, and `public/images/` holds its images.
- The social buttons take their brand colors from aldi's
  [bulma-social](https://github.com/aldi/bulma-social), as the original does: its classes go on
  bestax's `Button` through `className`.
- Icons are Font Awesome, from its npm package.
- The navbar's Bulma logo is a local copy, `public/images/bulma-logo.svg`, from Bulma's own
  repository under its MIT license, whose notice is in `LICENSE`. The banner photo and the photo
  beside the contact form load from where the original loads them.

## Changes from the original

- The burger opens the menu on narrow screens. The original has no script for it, so its menu
  can't be reached there.
- The fruits page's "Very tasty fruits" banner has its photo, as on the home page. The original
  leaves out the id its photo hangs on, so the white title is lost on the white page.
- The carousels show one slide at every width. Between phone and tablet widths the original's
  squeeze in several, from bulma-carousel's default breakpoints.
- "Get a quote" opens the contact page, and the social buttons link to each network. The
  original's are links with no address, which a keyboard can't reach.
- The contact form's fields show which one has focus, with an orange line under it. The
  original's text inputs show no sign of focus.
- The form fields and social buttons have accessible names, the images have alternative text,
  and the map has a title.
- `index.html` pins Bulma's light scheme, as the original's design is light only.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps the original's notice, followed by the notice
for this port.
