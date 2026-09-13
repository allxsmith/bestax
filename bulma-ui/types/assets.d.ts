/**
 * Ambient module declarations for the non-code assets stories import.
 *
 * Storybook's Vite builder resolves `import logo from '../../images/logo.svg'`
 * to a URL string, but nothing tells `tsc` that, and this package does not
 * reference `vite/client` — pulling in Vite's whole client surface (`*.css`
 * modules, `import.meta.env`) would also apply it to the jest suite, which runs
 * nowhere near Vite.
 *
 * This lives outside `src/` on purpose. `bulma-ui/tsconfig.json` is the build's
 * program too, via `@rollup/plugin-typescript` with `declaration: true`, and an
 * ambient file inside `src/` would be an input to the published declaration
 * emit. Only `tsconfig.test.json` and `tsconfig.eslint.json` include this
 * directory.
 */
declare module '*.svg' {
  /** The resolved URL of the asset. */
  const src: string;
  export default src;
}
