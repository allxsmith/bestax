# mg01 scorecard

Graded against `rubric-migrate.md` (version 3), the rubric `metrics.json` names. Brief:
`briefs/bulma-migrate.md`. Builder: opus, $15 budget, 2700 s timeout; it finished in 50 turns
for $1.91.

**Gate: passed.** `app_modified=true`, and `bulma_component_classes` fell from 85 to 0. No
markup was deleted: the tree kept its 11 .tsx files and grew from 478 to 496 lines.
`builder.diff` touches only the 7 files under `src/components/`.

| #   | Category                        | Score  | Max     | Evidence summary                                                                                                            |
| --- | ------------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | Build integrity                 | 10     | 10      | `build_pass=true`, `tsc_errors=0`                                                                                           |
| 2   | Conversion coverage             | 25     | 25      | `bulma_component_classes` 0 of a baseline 85; `unparsed_files` is empty                                                     |
| 3   | Nothing lost                    | 25     | 25      | All 8 must-survive items kept; the builder confirmed with DOM, behaviour and pixel checks of before and after               |
| 4   | Faithful props                  | 15     | 15      | `raw_bulma_classnames` 1 of 44, and that one has no prop that keeps its `<h2>`; no inline styles, no custom CSS             |
| 5   | Families built from their parts | 10     | 10      | All 6 families built from the component and its parts                                                                       |
| 6   | Codemod TODOs resolved          | 5      | 5       | 0 left; all 16 elements the codemod listed are now components                                                               |
| 7   | Guidance engagement             | 8      | 10      | The migrate skill came first and the codemod ran, but `prop-map.md`, `component-map.md` and `bestax-form` were never opened |
|     | **Total**                       | **98** | **100** |                                                                                                                             |

## Evidence by category

**1. Build integrity (10/10).** `build_pass: true`, `tsc_errors: 0`. The builder's last check
(transcript line 237) shows the build, lint and Prettier all clean.

**2. Conversion coverage (25/25).** 0 of 85 remain, the top anchor; `unparsed_files` is `[]`.
`handrolled_total` fell from 27 to 0.

**3. Nothing lost (25/25).** Each must-survive item is checked in the table below. The
builder's own Playwright run gives identical behaviour JSON for the old and new builds (line
229), and the pixel diff shows desktop, mobile and mobile-open identical. One pixel difference
remains, a focus ring on the modal's close button (line 233), because `Modal` moves focus into
the dialog when it opens: a transient focus state, not a change of colour or layout, so not
counted as lost.

**4. Faithful props (15/15).**

- The one remaining modifier is `Contact.tsx:34` `<Title as="h2" className="is-3">`. `Title`
  takes its heading level from `size`, so no prop keeps an `<h2>` at `is-3`; the prop map
  prescribes exactly this form.
- `Pricing.tsx:85` `<p className="heading">` is a class with no bestax prop, which the
  completeness file allows.
- Every other modifier moved to a prop: `color`/`size` (`Hero.tsx:15`),
  `isInverted`/`isOutlined` (`Hero.tsx:28-31`), `textAlign`/`textColor`/`mb`
  (`Features.tsx:23`), `bgColor` (`Pricing.tsx:33`), `isFullwidth`/`isStriped`/`isHoverable`
  on `Table`, `color="info" isLight` on `Tag` (`Features.tsx:37`), `textSize`/`textColor` on
  `Paragraph` (`SiteFooter.tsx`).
- `Pricing.tsx:48` `<Span display="flex" alignItems="center">` uses helper props, not inline
  style or CSS, to compensate for the wrapper `<span>` `Tabs.Tab` adds.

**5. Families built from their parts (10/10).** See the families table below; none is a
component wrapped around the old part markup.

**6. Codemod TODOs resolved (5/5).** The codemod report (lines 13 and 35) listed 16 TODOs: in
`Contact.tsx` 6 `.field`, 2 `.input`, and one each of `.select`, `.textarea`, `.checkbox` and
`.modal`; `.card` in `Features.tsx`; `.tabs` in `Pricing.tsx`; `.navbar` in `SiteNavbar.tsx`;
`.image` in `Team.tsx`. Each is now a bestax component, and `bestax_migrate_todos` is 0.

**7. Guidance engagement (8/10).** The builder invoked `bestax-migrate` as its first action
(line 2), dry-ran the codemod (line 12), read `bulma-classes/unmappables.md` in full and the
start of `css-migration.md` (lines 19-20), applied the codemod (line 32), and kept
`bulma.min.css` for the reason the guidance gives (line 241). It never opened
`bulma-classes/component-map.md` or `prop-map.md`, never loaded `bestax-form`, and spent about
14 tool calls (lines 42-144) reading the installed library's `dist/types/*.d.ts` and
`index.esm.js` instead. That sits between the 10 anchor and the 5 anchor. MCP was not in use.
The app's CLAUDE.md house rules were visibly weighed: the builder declined `Dialog`/`Toast`
for the confirmation and gave its reason (line 241).

## Category 3: what must survive

| #   | Item                           | Kept? | Where                                                                                                                                                                                                                                                                 |
| --- | ------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Every section and its copy     | Yes   | All 7 sections render from `App.tsx`; all text is unchanged in the diff, including `<small>{member.role}</small>`, the stats `heading` and the checkbox label at `Contact.tsx:61`                                                                                     |
| 2   | In-page links and targets      | Yes   | `SiteNavbar.tsx:12,22-24,29` and `Hero.tsx:23` link `#top`, `#features`, `#pricing`, `#team`, `#contact`; the ids are at `Hero.tsx:15`, `Features.tsx:18`, `Pricing.tsx:33`, `Team.tsx:20`, `Contact.tsx:29`; `showFeatures` still calls `getElementById('features')` |
| 3   | Mobile menu opens and closes   | Yes   | `SiteNavbar.tsx:16,20`: `Navbar.Burger active={open}`, `Navbar.Menu active={open}`; Playwright shows the menu going hidden, shown, hidden                                                                                                                             |
| 4   | Monthly/yearly pricing         | Yes   | `Pricing.tsx:38-55`, a controlled `Tabs`; the price column and each price still follow `billing`                                                                                                                                                                      |
| 5   | Hiring notice can be dismissed | Yes   | `Team.tsx:25`: `<Delete aria-label="Dismiss" onClick=…>`                                                                                                                                                                                                              |
| 6   | Contact form                   | Yes   | `Contact.tsx:38-58`: `Input`/`Select`/`TextArea` with `label` and `id`, `required` and `type="email"` kept, help text via `message`, Clear as `type="reset"`                                                                                                          |
| 7   | Confirmation modal             | Yes   | `Contact.tsx:80-91`: `Modal active={sent} onClose={close}`; background, close button and Done all close it                                                                                                                                                            |
| 8   | The look                       | Yes   | `main.tsx` still imports `bulma/css/bulma.min.css`; the pixel diff is identical apart from the modal focus ring                                                                                                                                                       |

## Category 5: families

| Family             | Converted? | Where                                                                                      |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------ |
| Navbar             | Yes        | `SiteNavbar.tsx:9-37`: `Navbar`, `.Brand`, `.Item`, `.Burger`, `.Menu`, `.Start`, `.End`   |
| Feature card       | Yes        | `Features.tsx:29-45`: `Card`, `Card.Header`, `Card.Header.Title`, `Card.Content`           |
| Pricing tabs       | Yes        | `Pricing.tsx:38-56`: `Tabs`, `Tabs.List`, `Tabs.Tab`                                       |
| Form controls      | Yes        | `Contact.tsx:38-75`: `Input`, `Select`, `TextArea`, `Checkbox`, `Field grouped`, `Control` |
| Confirmation modal | Yes        | `Contact.tsx:80-91`: `Modal` through `modalCardTitle`/`modalCardFoot`                      |
| Avatar image       | Yes        | `Team.tsx:32`: `<Image as="p" size="64x64" isRounded …>`                                   |

## Top 5 friction points

1. **The mapping tables were never read, so the builder reverse-engineered the library.** It
   read `unmappables.md` but not `bulma-classes/prop-map.md` or `component-map.md`, and spent
   about 14 calls (lines 42-144) grepping the installed dist for Title, Tabs, Modal, Dialog,
   Navbar, Field, Input, Select, Checkbox and Image. It rediscovered the prop map's
   `Title as="h2" className="is-N"` recipe on its own (line 111).
2. **`bestax-form` was never loaded, though the contact form was the largest family** (11 of
   the 16 TODOs). The builder learned the `label`/`message`/`id` wiring from dist source
   (lines 72 and 78).
3. **The burger's span count is undocumented and version-dependent.** `family:navbar-burger`
   says only that the burger "renders its own spans". The installed library rendered three
   and Bulma v1 positions four; the builder found the gap in `bulma.css` (lines 123-129) and
   passed an extra `<span>` child (`SiteNavbar.tsx:15-17`). The repo's `Navbar.Burger` now
   renders four, so that workaround would draw five after an upgrade.
4. **`Tabs.Tab` wraps its label in an extra `<span>`, and no guidance warns about it.** It
   shifts the "Save 20%" tag by 2px; the builder caught it only by pixel-diffing (line 216)
   and patched it with a flex `Span` (`Pricing.tsx:47-53`).
5. **The modal guidance and the app's CLAUDE.md pulled in different directions.** The
   unmappables say to rebuild the modal "with `Modal` and its parts", the app's CLAUDE.md
   steers confirmations to `Dialog`/`Toast`, and the brief demands the same look. The builder
   chose the `modalCardTitle`/`modalCardFoot` API and explained why it set CLAUDE.md aside
   (line 241). The focus ring the modal adds on open (line 233) isn't mentioned anywhere.

## Transcript quotes

1. Line 25: "Codemod dry run looks sane (16 TODOs, all in form/modal/card/tabs/navbar/image
   families). Checking the CSS options and component APIs next."
2. Line 216: "Two diffs to chase: the Yearly tab sits 2px taller (bestax wraps tab content in
   a `<span>`, which breaks the flex alignment), and the burger/modal shots may just be
   timing."
3. Line 241: "The alternative, `bestax.css`, sets its own primary blue in place of Bulma's
   default, which would recolour the navbar, hero and buttons. Nothing on this page needs its
   extra styles."
