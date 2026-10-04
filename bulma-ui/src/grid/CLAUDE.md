# grid/ — the CSS Grid system

`Grid` + `Cell`: Bulma v1's CSS Grid — **uniform grids with equal-height cells for free**.
`Grid` takes `gap`, `minCol`, and `isFixed` + `fixedCols*` for fixed column counts; `Cell`
takes `colSpan`/`colStart`/`rowSpan`/….

`gap`/`columnGap`/`rowGap` render Bulma's gap helper classes, the ones the shared helper props
of the same names render on every component, and take the same `BulmaGapStep`. `Grid`
destructures and renders them itself, so the helper never sees them and each class appears
once.

**Grid vs Columns:** Grid is the preferred tool for card grids and any uniform-item layout
(#196). Use `../columns/` when proportional widths or per-breakpoint column sizing are the
point.

Stock Bulma — no SCSS. Tests in `__tests__/`. Anatomy rule: see `bulma-ui/CLAUDE.md`.
