# Event Participation Template, rebuilt with bestax

An invitation to an anniversary event, where guests pick the talks they will attend from a
program on a frosted gold panel, with a light and dark toggle, rebuilt as a React app with
[bestax-bulma](https://bestax.io).

The original is [aldi](https://github.com/aldi)'s
[Event Participation Template](https://github.com/aldi/bulma-event-participation-template),
part of [awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), aldi's
collection of free Bulma templates. This port was made from commit
[`836934566b51c595b76c0c7d7ef524edf593e46d`](https://github.com/aldi/bulma-event-participation-template/tree/836934566b51c595b76c0c7d7ef524edf593e46d),
and the original's [live demo](https://aldi.github.io/bulma-event-participation-template/) shows
the page it started from.

## Run it

```bash
npm install && npm run dev
```

Inside the bestax repository, install with `pnpm install --ignore-workspace` instead, so pnpm
treats the folder as a project of its own.

## What's inside

- `src/App.tsx` lays out the page, and `EventIntro.tsx`, `ParticipationForm.tsx`,
  `ThemeToggle.tsx` and `SiteFooter.tsx` hold its sections, built from bestax components in
  place of the original's Bulma markup.
- The original's scripts are React state now. `ParticipationForm.tsx` keeps the picked talks,
  drives the "Select All" box and its mixed state, and says what the confirm button did.
- The light or dark choice is bestax's `Theme`, given the scheme from state. A small script in
  `index.html` writes the visitor's saved choice, or else their system's, before the page
  first paints, and `src/colorMode.ts` reads and saves it under the same key.
- `src/index.css` is the original's stylesheet, ported, and `public/` holds its logo.
- Icons are Font Awesome, from its npm package, and the Inter font loads from Google Fonts in
  `index.html`.

## Changes from the original

- The talks' boxes are bestax's `Checkbox`, which draws its own box in place of the
  original's restyled native one. It is a little larger, and its border stands out from the
  panel in both schemes.
- "Select All" shows a dash while only some talks are picked. The original sets that mixed
  state but draws nothing for it.
- The theme button is named "Dark mode", and says whether it's on as a pressed button. The
  original renamed it "Switch to light mode" while pressed, which a screen reader reads as the
  opposite of what is on.
- Where the browser blocks storage, the page starts in the visitor's system scheme and the
  toggle still works. The original's scripts stop with an error there, so it starts light, and
  the toggle switches the scheme without changing its icon or pressed state.
- At phone width the time and select columns narrow, so a talk's title no longer wraps a word
  to a line.
- With reduced motion on, the background lights hold a dim glow. The original stops their
  drift, and with it the fade that dims them, so they show at full strength.
- Hovering the footer link turns it the page's text color. The original turns it black, which
  vanishes on the dark scheme.
- The footer's heart is hidden from screen readers, as a decorative icon.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps aldi's notice, followed by the notice for this
port.
