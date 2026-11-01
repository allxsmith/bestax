/**
 * Ambient module declarations for the non-code assets stories import.
 *
 * Storybook's Vite builder resolves `import logo from '../../images/logo.svg'`
 * to a URL string, but nothing tells `tsc` that. This package does not
 * reference `vite/client` for it: that would declare Vite's whole client
 * surface (`*.css` modules, `import.meta.env`) to the tests and stories, for
 * one asset type.
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
