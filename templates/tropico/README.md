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
  the Bulma 0.9 it was made for, and `public/images/` holds the pictures drawn for this port (see
  [Images](#images)).
- The social buttons take their brand colors from aldi's
  [bulma-social](https://github.com/aldi/bulma-social), as the original does: its classes go on
  bestax's `Button` through `className`.
- Icons are Font Awesome, from its npm package.

## Changes from the original

- The burger opens the menu on narrow screens. The original has no script for it, so its menu
  can't be reached there.
- The fruits page's "Very tasty fruits" banner has its background picture, as on the home page.
  The original leaves out the id its photo hangs on, so the white title is lost on the white page.
- The navbar's brand is Bulma's name in text, linking to bulma.io, where the original shows
  Bulma's logo, loaded from bulma.io. The port ships no copy of the logo, which is Bulma's
  trademark.
- The carousels show one slide at every width. Between phone and tablet widths the original's
  squeeze in several, from bulma-carousel's default breakpoints.
- "Get a quote" opens the contact page, and the social buttons link to each network. The
  original's are links with no address, which a keyboard can't reach.
- The contact form's fields show which one has focus, with an orange line under it. The
  original's text inputs show no sign of focus.
- The form fields and social buttons have accessible names, the images have alternative text,
  and the map has a title.
- `index.html` pins Bulma's light scheme, as the original's design is light only.

## Images

Every image in `public/images` is voxel art drawn by code for this port:
[`scenes/tropico.mjs`](https://github.com/allxsmith/bestax/blob/main/docs/scripts/template-art/scenes/tropico.mjs)
in the bestax repository places every block, and the renderer beside it writes the SVG, so running
it again writes the same files. No photo, illustration, stock image or image-generation model went
into any of them, and none copies existing artwork. [`image-provenance.json`](image-provenance.json)
records each one, with what it shows, its SHA-256 and what it replaces.

- `slide-img.svg`, a bowl of tropical fruit, in the opening carousel.
- `card-item-1.svg`, an orange, the services cards' icon.
- `orange.svg` and `guava.svg`, oranges and guavas, in the fresh fruits list.
- `client.svg`, the customer in the testimonials.
- `tasty-banner.svg`, fruit scattered on green, behind the "Very tasty fruits" banner.
- `orange-dish.svg`, half a plate of orange slices, at the contact section's right edge.

They replace the original's images, whose sources the original does not record, and the two
photos it loads from technext.github.io for the banner and the contact section, so this port ships
and loads only images made for it.

The customer shows no real person: George Ipsum is a made-up name, and the face is a few blocks.
Put your own customers' photos and names in their place.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps the original's notice, followed by the notice
for this port.
