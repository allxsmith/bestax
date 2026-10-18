# Bulma Hotel Template, rebuilt with bestax

A one-page hotel site: a full-height welcome over a pool photo, the rooms with a details modal,
an about section, a photo gallery, a contact form beside a map, and a footer with a newsletter
field, rebuilt as a React app with [bestax-bulma](https://bestax.io).

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

- `src/App.tsx` lays out the page. `SiteHeader.tsx` (with `SiteNavbar.tsx`), `Rooms.tsx` (with
  `RoomModal.tsx`), `About.tsx`, `Gallery.tsx`, `Contact.tsx` and `SiteFooter.tsx` hold its
  sections, built from bestax components in place of the original's Bulma markup.
- `src/index.css` is the original's stylesheet, ported. It sets Bulma's own turquoise primary
  back, since bestax builds Bulma with a blue one, along with Bulma 0.9's heading weights.
- `public/` holds the original's background photo, recompressed. The room and gallery photos
  are Unsplash links, as they are in the original.
- The social buttons take their brand colors from aldi's
  [bulma-social](https://github.com/aldi/bulma-social), as the original does: its classes go on
  bestax's `Button` through `className`.
- Icons are Font Awesome, from its npm package, and the map is Google's embed, kept as an
  `<iframe>`.

## Changes from the original

- The rooms' "View Details" buttons open the details modal. The original has the modal but
  never wires its buttons to it, so it never opens; here a `Modal` opens from state, and closes
  from its background, its close button and Escape.
- The gallery's slider shows several cards at once and steps one card at a time, while bestax's
  `Carousel` shows one slide at a time. So from tablet width up each slide is a row of cards,
  the last row filled from the start, and on phones each slide is one card, as the original
  shows phones. Its dots sit below the cards.
- The navbar's logo points at the address Bulma's logo has moved to, since the one the original
  links to is gone.
- `index.html` pins Bulma's light scheme, as the original's design is light only.
- The turquoise, cyan and green buttons keep Bulma 1's dark labels where Bulma 0.9 drew white
  ones, since white on those colors is too low in contrast to read comfortably.
- The social buttons take bulma-social's current brand colors. They and the navbar's Facebook
  links point at each network's home page, where the original's go nowhere.
- "Home" links to the top of the page, where the original's has no link, and following a link
  in the phone menu closes the menu.
- Submitting either form stays on the page. The original posts both to `#`, which a static host
  answers with an error page; send them from the forms' `onSubmit` in `src/Contact.tsx` and
  `src/SiteFooter.tsx`. The contact form's labels name their fields, and its email and phone
  fields take those types.
- Typos in the copy are fixed.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps aldi's notice, followed by the notice for this
port.
