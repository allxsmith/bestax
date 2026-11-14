/**
 * Ambient module declarations for the non-code assets stories import.
 *
 * Storybook's Vite builder resolves `import logo from '../../images/logo.svg'`
 * to a URL string, but nothing tells `tsc` that. This package does not
 * reference `vite/client` for it: that would declare Vite's whole client
 * surface (`*.css` modules, `import.meta.env`) to the tests and stories, for
 * the few image types they import.
 *
 * Import a story's image rather than writing `/img/…`. The deployed Storybook
 * is served from `/storybook/` on bestax.io, where a root-relative path
 * reaches the docs site's own files instead of Storybook's, and an import
 * resolves under whatever base Storybook is built for.
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

declare module '*.png' {
  /** The resolved URL of the asset. */
  const src: string;
  export default src;
}

declare module '*.jpg' {
  /** The resolved URL of the asset. */
  const src: string;
  export default src;
}
