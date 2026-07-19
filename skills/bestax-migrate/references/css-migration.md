# CSS: Bulma 0.9 → Bulma v1

react-bulma-components apps style with Bulma 0.9.x; bestax-bulma targets Bulma v1. After
the component codemod, migrate the CSS layer. The full guide is
https://bestax.io/docs/guides/getting-started/migration/bulma-0-9-to-1 — summary:

1. **Install Bulma v1** and point the import at it:

   ```sh
   npm install bulma
   ```

   ```tsx
   import 'bulma/css/bulma.min.css';
   ```

   (If the app imported `react-bulma-components/dist/react-bulma-components.min.css` —
   the v3 pattern — the codemod already rewrote it.)

   Alternatively use bestax's bundled flavors (`@allxsmith/bestax-bulma/css/bestax.css`,
   prefixed/no-helpers/no-dark-mode variants) — see
   https://bestax.io/docs/guides/getting-started/installation.

2. **Sass variable overrides → CSS variables.** Bulma v1 theming is `--bulma-*` custom
   properties; `$primary`-style Sass overrides no longer require a Sass build. Use the
   bestax `Theme` component or plain CSS overrides — see the `bestax-theming` skill.

3. **Check changed classes**: tiles are gone (Grid replaces them), `is-bold` hero
   gradients were removed, and Bulma v1 adds automatic dark mode (audit hard-coded
   white/black assumptions).

4. **Visual pass**: colors, spacing, and dark mode side by side against the old app.
