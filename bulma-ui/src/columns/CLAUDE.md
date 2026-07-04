# columns/ — the flexbox column system

`Columns` + `Column`: Bulma's flexbox layout for **proportional / responsive side-by-side**
content (sizes like `is-half`, per-breakpoint props, offsets).

**Columns vs Grid (#196 exists because agents get this wrong):** for a uniform grid of
same-sized items — especially card grids that should be equal height — prefer `../grid/`
(`Grid`/`Cell`, CSS Grid, equal heights for free). Use Columns when column _proportions_ or
per-breakpoint behavior are the point.

Equal-height gotcha: a card inside a `Column` doesn't stretch by default. The recipe is flex
helper props on the Column (`display="flex" flexDirection="column"`) plus a growing child —
`height: 100%` on the card does **not** work.

Stock Bulma — no SCSS. Tests in `__tests__/`. Anatomy rule: see `bulma-ui/CLAUDE.md`.
