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
  group components (Radios). Preserve that skip-if-wrapped behavior in new inputs. Decide the
  Field with `rendersOwnField` rather than `!insideField` alone: `Control` provides no field
  context, so that test puts a `.field` inside a bare `.control` (#905). Pass it every prop
  that changes the Field's own markup, and add a new one to its list, or a bare `Control`
  silently drops it; a new wrapper also joins the table in `__tests__/bare-control.test.tsx`.
  `Autocomplete` and `Numberinput` still decide with `!insideField`, because the helper
  cannot fix them: Autocomplete's own markup carries a `.control`, and Numberinput's root is
  itself a `.field`, so either one still nests inside a bare `Control` with no Field of its
  own. Bringing them in means changing that markup first.
  Decide the Control with `rendersOwnControl` the same way: pass it every prop you hand your
  own `Control`, as the caller gave it rather than after a default, so that inside a caller's
  `Control`, where those props do nothing, it can warn about the ones set (#921). A picker
  passes its `inline` too, since inline it renders no Control in either place. A new
  Control-level prop joins `ControlLevelProps`, and `bare-control.test.tsx` fails until it does.
- A labeled `Field` names the one control it holds (#495, #939), and a new input keeps that
  working by going through the label hooks in `useAutoLabelId.ts` rather than wiring ids
  itself. One that renders its own input calls `useAutoLabelId` and puts `controlId` on that
  input after any props spread, where an undefined `id` key would wipe it, passing
  `hasInput: false` in a mode that renders none, so nothing derives ids from the Field's. A group calls `useAutoLabelledBy` with its remaining props as `callerProps`,
  so an `aria-label` or `aria-labelledby` the caller set still wins, and puts
  `ariaLabelledBy` on its group element. Once the Field's content has mounted, its label keeps
  the generated `for` only while some content has reported holding the Field's id, so
  `useAutoLabelId` reports when the control took it (#1004). Anything new that puts that id
  on an element reports it the same way, through `useFieldLabelTarget` or
  `useReportFieldLabelFor`, or the label drops the `for` that names it. Content that takes no
  id, a group included, has nothing to report.
- `*Base.tsx` files (`InputBase`, `SelectBase`, `DateInputBase`, `TimeInputBase`, …) are the
  raw controls without the Field/Control wrapping — deliberately exported from `src/index.ts`
  as escape hatches, so they are public API too. A base with a single input of its own takes
  its id from `useFieldLabelTarget`, which hands it the Field's id when the caller set none and
  tells the Field when it did, as `InputBase` does, so a labeled `Field` names it when
  composed by hand (#968). A picker base passes `!inline` as its `hasInput`, since inline it
  renders no input. A base that is a group, as `DateRangeInputBase` is, calls
  `useAutoLabelledBy` with no label of its own and puts `ariaLabelledBy` on its group in
  every mode, `inline` too, so a labeled `Field` names it as it names the wrapper (#1005).
- Basic inputs (Input, Select, TextArea, …) ship no CSS, but more of this folder has SCSS
  than you'd guess: even Checkbox and Radio have themed partials, File has one for its keyboard
  focus ring and a boxed CTA's corners, and every extended input (Autocomplete, DateInput,
  Numberinput, Rate, Slider, Switch, Taginput, …) does too. Check `../scss/form/_index.scss` for
  the authoritative list before changing visuals.

Follow the anatomy rule in `bulma-ui/CLAUDE.md` (test + story + docs page + export + catalog).
