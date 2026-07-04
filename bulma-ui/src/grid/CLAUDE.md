# grid/ — the CSS Grid system

`Grid` + `Cell`: Bulma v1's CSS Grid — **uniform grids with equal-height cells for free**.
`Grid` takes `gap`, `minCol`, and `isFixed` + `fixedCols*` for fixed column counts; `Cell`
takes `colSpan`/`colStart`/`rowSpan`/….

**Grid vs Columns:** Grid is the preferred tool for card grids and any uniform-item layout
(#196). Use `../columns/` when proportional widths or per-breakpoint column sizing are the
point.

Stock Bulma — no SCSS. Tests in `__tests__/`. Anatomy rule: see `bulma-ui/CLAUDE.md`.
