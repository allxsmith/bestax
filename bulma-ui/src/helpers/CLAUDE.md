# helpers/ — the shared prop system (blast radius: every component)

Three things live here:

- **`useBulmaClasses`** — the hook every component routes its Bulma helper props through
  (color, spacing `m`/`p`, typography, flexbox, visibility). It aggregates the per-concern
  hooks: `useColorClasses`, `useSpacingClasses`, `useTypographyClasses`, `useFlexboxClasses`,
  `useVisibilityClasses`, `useOtherClasses`. `classNames.ts` is the class-string builder.
- **`Config.tsx`** — `ConfigProvider` context for the global class prefix (pairs with the
  `bestax-prefixed` CSS flavor; all class emission must respect it — tests assert prefixed
  output) and the default icon library (`useIconLibrary`).
- **`Theme`** — CSS-variable theming (`--bulma-*` overrides) and `colorMode`
  (light/dark/system via `data-theme`).

**Changing a helper prop ripples everywhere.** A new or renamed helper prop must update: the
concern hook + `useBulmaClasses` types, tests, the helpers docs (`docs/docs/api/helpers/`,
`docs/docs/guides/helpers/`), and the skill reference
`skills/bestax-custom-component/references/api.md` — then `pnpm gen:catalog`.

Valid-value constants exported here (colors, sizes, alignments) are public API used by
consumers and the skills — extend, don't reorder or remove.
