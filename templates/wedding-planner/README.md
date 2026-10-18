# Bulma Wedding Planner Template, rebuilt with bestax

A one-page site for a wedding planner: a hero with an illustration and what's on offer, client
reviews, illustrated steps on a pink gradient, a photo carousel and a contact form, rebuilt as a
React app with [bestax-bulma](https://bestax.io).

The original is [restylianos](https://github.com/restylianos)'s
[Bulma Wedding Planner Template](https://github.com/restylianos/bulma-wedding-planner-template),
part of [awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), aldi's
collection of free Bulma templates. Its copyright notice names lizzli. This port was made from
commit
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

- `src/App.tsx` lays out the page. `SiteHero.tsx` (with `SiteNavbar.tsx`), `Reviews.tsx`,
  `Steps.tsx`, `Gallery.tsx`, `Contact.tsx` and `SiteFooter.tsx` hold its sections, built from
  bestax components in place of the original's Bulma markup.
- `src/index.css` is the original's stylesheet, ported. It also sets back Bulma 0.9's heading,
  button and label weights, its burger color, its medium hero's sides and its box corners, where
  Bulma 1 changed them.
- `public/media/` holds the original's [unDraw](https://undraw.co) illustrations and its avatar
  icons. The gallery photos are Unsplash links and the logo an Icons8 link, as they are in the
  original.
- Icons are Font Awesome, from its npm package, and the Nunito Sans font loads from Google Fonts
  in `index.html`.

## Changes from the original

- The original is built on Bulma 0.9, Font Awesome 4, jQuery and bulma-carousel; the port is on
  Bulma v1, through bestax, and the current Font Awesome. The burger menu is React state, and
  the gallery is bestax's `Carousel`.
- "Learn more" scrolls down to the steps with `scrollIntoView`, in place of jQuery. The
  original's script did that for every button on the page, so its Submit and Cancel buttons
  scrolled the page up to the steps too. Now only "Learn more" does.
- The contact fields sit in a form. Submitting stays on the page; send the message from the
  form's `onSubmit` in `src/Contact.tsx`. Cancel clears the form. Each label names its field.
- The original's email field closes after the rest of the form, so the fields below it sat
  inside it, and Subject sat closer to Email than the other fields do to each other. Each field
  is its own now. The email input's doubled `placeholder` keeps the first, the one browsers
  show.
- The steps take a section's padding at the sides. In the original they ran to the screen's
  edges at phone width and scrolled the page sideways.
- The gallery's slider shows several cards at once and steps one card at a time, while bestax's
  `Carousel` shows one slide at a time. So from tablet width up each slide is a row of cards,
  the last row filled from the start, and on phones each slide is one card, as the original
  shows phones. Its dots sit below the cards.
- The menu's links go to the page's sections, "about" to the reviews, where the original's go
  nowhere, and following one in the phone menu closes the menu. The site name beside the logo
  is no longer a link to nowhere.
- The contact form's checkbox is bestax's `Checkbox`, which draws its own box in place of the
  browser's. Its box is a little larger.
- The Submit and Cancel buttons and the terms link take Bulma 1's link blue, a little deeper
  than Bulma 0.9's.
- The logo has alt text, and the footer's GitHub link a name screen readers can read.
- Each avatar's `<figure>` loses a stray `\` and an `is-64x64` class, which set no size without
  Bulma's `image` class beside it. The avatars keep the size they show at in the original.
- Classes nothing styles, and bulma-divider's `is-divider`, whose stylesheet the original never
  loads, are gone. None of them changed how the page looks.
- `index.html` pins Bulma's light scheme, as the original's design is light only.
- "Let s connect" reads "Let's connect", and the first review gets back a missing space.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps the original's notice, followed by the notice
for this port.
