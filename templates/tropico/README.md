# Bulma Tropico Template, rebuilt with bestax

A multi-page fruit shop: a home page with a welcome slider, the services, the fresh fruits,
testimonials and a contact form above a map, and Fruits, Services and Contact pages, rebuilt as
a React app with [bestax-bulma](https://bestax.io).

The original is [restylianos](https://github.com/restylianos)'s
[Bulma Tropico Template](https://github.com/restylianos/bulma-tropico-template), part of
[awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), aldi's collection of
free Bulma templates. Its license notice names lizzli, the name the restylianos account goes by
in the repository's history. This port was made from commit
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

- `src/App.tsx` puts the navbar and the footer around the page the address names, and
  `src/router.ts` is the router: each page lives at a hash, such as `#/fruits`, so the template
  needs no router package, and every link works on any static host and in StackBlitz's preview.
  To add a page, give it a path there and a component in `App.tsx`.
- `src/pages/` holds the original's pages, built from the sections they share:
  `WelcomeCarousel.tsx`, `OurServices.tsx`, `FreshFruits.tsx`, `TastyBanner.tsx`,
  `Testimonials.tsx` and `ContactSection.tsx`, with `SiteNavbar.tsx` and `SiteFooter.tsx` on
  every page. They are built from bestax components in place of the original's Bulma markup.
- `src/index.css` is the original's stylesheet, ported. It sets back what Bulma 1 changed from
  the Bulma 0.9 the original was made with: the turquoise primary (bestax builds Bulma with a
  blue one), the system font, neutral greys, the link blue, the corners, and the heading and
  button weights. It also gives both sliders bulma-carousel's look.
- `public/images/` holds the original's images, recompressed. The photos behind the "Very tasty
  fruits" band and the contact form are links to Technext's Tropika demo, as they are in the
  original.
- The footer's social buttons take their base from aldi's
  [bulma-social](https://github.com/aldi/bulma-social), as the original does: its classes go on
  bestax's `Button` through `className`.
- Icons are Font Awesome, from its npm package, and the map is Google's embed, kept as an
  `<iframe>`.

## Changes from the original

- The pages are routes of one app, at `#/`, `#/fruits`, `#/services` and `#/contact`, where the
  original is an HTML file for each. Opening a page starts it at its top, as opening another
  file does.
- The burger opens the menu on phones. The original has the burger but no script for it, so its
  menu never opens below desktop width. Here `Navbar.Burger` and `Navbar.Menu` share one state,
  and following a link in the open menu closes it.
- The sliders are bestax's `Carousel`, in place of bulma-carousel. They keep its setup and its
  look: one slide at a time, no looping, white round arrows that hide at either end, and white
  dots from 800px wide up. The arrows' triangles are Font Awesome carets.
- The Fruits page's "Very tasty fruits" band shows its photo. The original's Fruits page leaves
  the photo out, which leaves the band's white heading invisible on the white page, so the port
  uses the home page's band on both.
- "Get a quote" opens the Contact page, where the original's is a link with no address. The
  social buttons point at each network's home page, where the original's go nowhere, and carry
  the network's name for screen readers.
- The form fields carry their names for screen readers, and the email and phone fields take
  those types.
- Buttons that set two Bulma colors, such as "CONTACT US" (`is-black is-primary`), keep the one
  they show, since bestax's `Button` takes one. The template's own `.button.is-black` and
  `.is-orange` rules paint them either way.
- `index.html` pins Bulma's light scheme, as the original's design is light only.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps the original's notice, followed by the notice
for this port.
