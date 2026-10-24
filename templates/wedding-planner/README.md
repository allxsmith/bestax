# Bulma Wedding Planner Template, rebuilt with bestax

A wedding planner's one-page site, with an illustrated hero, client quotes, the steps of planning,
a gallery carousel of wedding photos and a contact form, rebuilt as a React app with
[bestax-bulma](https://bestax.io).

The original is [restylianos](https://github.com/restylianos)'s
[Bulma Wedding Planner Template](https://github.com/restylianos/bulma-wedding-planner-template),
whose license names lizzli, and it is part of
[awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), aldi's collection of
free Bulma templates. This port was made from commit
[`1b6a8b961b651ad75e0b0b23abfce362bc28549a`](https://github.com/restylianos/bulma-wedding-planner-template/tree/1b6a8b961b651ad75e0b0b23abfce362bc28549a),
and the original's [live demo](https://restylianos.github.io/bulma-wedding-planner-template/)
shows the page it started from.

## Run it

```bash
npm install && npm run dev
```

Inside the bestax repository, install with `pnpm install --ignore-workspace` instead, so pnpm
treats the folder as a project of its own.

## What's inside

- `src/App.tsx` lays out the page, and `Header.tsx`, `Testimonials.tsx`, `Steps.tsx`,
  `Gallery.tsx`, `Contact.tsx` and `SiteFooter.tsx` hold its sections, built from bestax
  components in place of the original's Bulma markup.
- `src/index.css` is the original's stylesheet, ported, with the Bulma 0.9 defaults it was made
  on set back on top of Bulma 1.
- The gallery is bestax's `Carousel` in place of bulma-carousel: several cards in view on a
  tablet or wider and one on a phone, stepping a card at a time and running round from the last
  to the first, as the original's did.
- `public/img/` holds the original's images: its [unDraw](https://undraw.co) illustrations, the
  avatars. The gallery's photos stay on Unsplash and the logo on Icons8, where the original
  links them.
- Icons are Font Awesome, from its npm package, with the original's Font Awesome 4 names moved
  to the current ones. The Nunito Sans font loads from Google Fonts in `index.html`.

## Changes from the original

- "Learn more" scrolls to the steps with `scrollIntoView`, and jQuery is gone. The original
  scrolled there from every button on the page, Submit and Cancel included.
- The menu's links point at the page's sections, and choosing one on a phone closes the menu.
  In the original they lead nowhere.
- The contact fields follow one another. The original leaves the Email field unclosed, so the
  fields after it sat inside it, without the space between fields. Each label now names its
  field, the checkbox is bestax's `Checkbox`, which draws its own box, and the fields sit in a
  form: Submit stays on the page, and Cancel clears it. Send the message from the form's
  `onSubmit` in `src/Contact.tsx`. The text above the form, its terms link and the gallery are
  the original's placeholders: replace them with your own, and give your photos alt text, which
  the original's leave empty.
- On a phone, the steps no longer let the page pan sideways: their columns overhang the screen,
  as in the original, and the section clips them.
- The gallery's dots sit under the cards rather than over their bottom edge, and between a phone
  and a tablet it shows one card, where bulma-carousel showed more as the screen widened.
- The logo is the [Icons8](https://icons8.com) icon the original uses, still hot-linked from
  their site rather than copied here, and the footer credits Icons8.
- The contact heading reads "Let's connect", with its apostrophe.
- `index.html` pins Bulma's light scheme, as the original's design is light only.
- Smooth scrolling to the page's sections is off for visitors who ask for reduced motion.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps lizzli's notice, followed by the notice for
this port.
