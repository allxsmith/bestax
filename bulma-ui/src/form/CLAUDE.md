# form/ — form controls

Bulma's Field/Control composition model: `Field` wraps label + control + help text; `Control`
wraps a single input and handles icons/loading. Inputs compose inside them — there is **no form
library** and none should be added; validation is userland (`skills/bestax-form` teaches the
pattern).

**Belongs here?** Anything a user types into or selects with. Display widgets go in
`../components/`.

Conventions:

- `FormContext.tsx` is presence detection, not state: `useInsideField`/`useInsideControl` let
  an input skip rendering its own Field/Control wrapper when already inside one, and it backs
  group components (Radios). Preserve that skip-if-wrapped behavior in new inputs.
- `*Base.tsx` files (`InputBase`, `SelectBase`, `DateInputBase`, `TimeInputBase`, …) are the
  raw controls without the Field/Control wrapping — deliberately exported from `src/index.ts`
  as escape hatches, so they are public API too.
- Basic inputs (Input, Select, TextArea, File, …) ship no CSS, but more of this folder has SCSS
  than you'd guess: even Checkbox and Radio have themed partials, and every extended input
  (Autocomplete, DateInput, Numberinput, Rate, Slider, Switch, Taginput, …) does too. Check
  `../scss/form/_index.scss` for the authoritative list before changing visuals.

Follow the anatomy rule in `bulma-ui/CLAUDE.md` (test + story + docs page + export + catalog).
