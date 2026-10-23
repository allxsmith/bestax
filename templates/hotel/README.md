# Bulma Hotel Template, rebuilt with bestax

A one-page hotel site: a full-height welcome over a pool photo, rooms with a details modal, the
reception and location, a photo gallery carousel, a contact form beside a map, and a footer with a
newsletter sign-up, rebuilt as a React app with [bestax-bulma](https://bestax.io).

The original is [aldi](https://github.com/aldi)'s
[Bulma Hotel Template](https://github.com/aldi/bulma-hotel-template), part of
[awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), aldi's collection of
free Bulma templates. This port was made from commit
[`2f7a1cfdcd96e97dd084aaf27a92ef98ed14bc28`](https://github.com/aldi/bulma-hotel-template/tree/2f7a1cfdcd96e97dd084aaf27a92ef98ed14bc28),
and the original's [live demo](https://aldi.github.io/bulma-hotel-template/) shows the page it
started from.

## Run it

```bash
npm install && npm run dev
```

Inside the bestax repository, install with `pnpm install --ignore-workspace` instead, so pnpm
treats the folder as a project of its own.

## What's inside

- `src/App.tsx` lays out the page, and `WelcomeHero.tsx` (with `SiteNavbar.tsx`), `Rooms.tsx`
  (with `RoomDetailsModal.tsx`), `About.tsx`, `Gallery.tsx`, `Contact.tsx` and `SiteFooter.tsx`
  hold its sections, built from bestax components in place of the original's Bulma markup.
- The navbar's burger is bestax's `Navbar.Burger`, and the gallery is bestax's `Carousel`, several
  photos in view on wider screens and a photo at a time on a phone, in place of the original's script and
  bulma-carousel.
- `src/index.css` is the original's stylesheet, ported, with what Bulma 1 changed from the Bulma
  0.9 the original was made for set back: the turquoise primary, the font, the radius, the neutral
  greys, the heading and button weights, and the navbar's colors. `public/` holds the welcome
  photo, recompressed, and the Bulma logo. The other photos load from Unsplash, as in the
  original.
- The social buttons take their brand colors from aldi's
  [bulma-social](https://github.com/aldi/bulma-social), as the original does: its classes go on
  bestax's `Button` through `className`.
- Icons are Font Awesome, from its npm package. The phone icons take the names that draw the
  original's glyphs, since Font Awesome 6 swapped `phone` and `phone-alt`.

## Changes from the original

- The rooms' "View Details" buttons open the hotel's details in a modal. In the original nothing
  opens it, so the buttons do nothing.
- The navbar's Bulma logo is a local copy. The original loads it from an address on bulma.io that
  no longer serves it, so it shows a broken image. The file comes from Bulma's own repository,
  under its MIT license, whose notice is in `LICENSE`.
- The newsletter field and button show a focus ring for keyboard users. The original takes the
  outline off both and puts nothing in its place.
- "Home" in the navbar links to the top of the page, and the Facebook and social buttons link to
  `#`, placeholders for the hotel's own pages; in the original they link nowhere.
- Typos in the text are fixed: "he Premier Diamond Double rooms" and "destinaiton".
- Submitting the contact form or the newsletter sign-up stays on the page. The original sends the
  sign-up as a POST to `#`, which a static host answers with an error page; send each one from its
  form's `onSubmit` in `src/Contact.tsx` and `src/SiteFooter.tsx`.
- The labels on the turquoise, cyan and green buttons are Bulma 1's dark ones, picked to read on
  those colors, where Bulma 0.9 put white on them. The Facebook and Twitter buttons take
  bulma-social's current brand colors.
- The contact form's labels name their fields, the map has a title, and the icon-only links and
  buttons have names, for screen readers.
- `index.html` pins Bulma's light scheme, as the original's design is light only.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps aldi's notice, followed by the notice for this
port.
