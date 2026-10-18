# Event Participation Template, rebuilt with bestax

An invitation with a program of talks to pick from, a "Select All" box and a confirm button, on
a dark and gold page with a light scheme to switch to, rebuilt as a React app with
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

- `src/App.tsx` lays out the page and holds the light or dark choice, and `Invitation.tsx`,
  `ParticipationForm.tsx`, `ThemeToggle.tsx` and `SiteFooter.tsx` hold its parts, built from
  bestax components in place of the original's Bulma markup.
- Light and dark work as in the original. A small script in `index.html` puts the saved choice,
  or the visitor's OS preference, on `<html data-theme>` before the page first paints, so the
  page never flashes the other scheme. The app starts from what it wrote (`src/colorMode.ts`)
  and passes the choice to bestax's `Theme` as `colorMode`, which keeps the attribute in step,
  and the toggle saves it for the next visit.
- The talks are bestax's `Checkbox`, and "Select All" shows its mixed state through the
  checkbox's `indeterminate` prop while only some talks are picked. Confirming stays on the page
  and reports in a status line; send the picks from `confirm` in `src/ParticipationForm.tsx`.
- `src/index.css` is the original's stylesheet, ported, with the drifting lights behind the page,
  and `public/` holds its logo.
- Icons are Font Awesome, from its npm package, and the Inter font loads from Google Fonts in
  `index.html`.

## Changes from the original

- The talk boxes are bestax's `Checkbox`, which draws its own box in place of the browser's. Its
  box is a little larger than the original's, so the rows are a little taller.
- "Select All" shows a dash while only some talks are picked. The original sets the mixed state,
  but its boxes are restyled without one, so the box looks empty.
- The toggle's name stays "Dark mode", and `aria-pressed` says whether it's on. The original
  renamed it to the action it would take, so a screen reader heard "Switch to light mode,
  pressed", which reads as light mode being on.
- Where a browser blocks storage, the page follows the OS preference and the toggle still works.
  The original's scripts stopped with an error there: the page started light whatever the OS
  preferred, and the toggle switched the scheme without changing its icon or its pressed state.
- At phone width the time and select columns narrow, so a talk's title no longer wraps a word
  to a line.
- With reduced motion turned on, the lights behind the page hold still at the faintness they
  drift at. In the original they show at full strength there.
- The footer link turns to the page's text color on hover. The original turns it black, which
  vanishes on the dark scheme.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps aldi's notice, followed by the notice for this
port.
