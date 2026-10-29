/**
 * The three homepage features. Both layouts of the section, the bento cards
 * and the hex badges, read this, so the copy lives in one place. `kicker` is
 * the bento card's label and `chips` are the hex column's tags.
 */
export const FEATURES = [
  {
    key: 'bulma',
    title: 'Latest Bulma V1',
    description:
      'Fully supports Bulma v1.x, unlike outdated alternatives stuck on older versions. Enjoy the newest features, improvements, and compatibility without compromises.',
    kicker: 'bulma 1.x',
    chips: ['bulma 1.x', 'dark mode'],
  },
  {
    key: 'lightweight',
    title: 'Lightweight and Efficient',
    description:
      'Lean runtime: the entire library is ~65KB min+gzip of JS, and tree-shakeable ESM means your app ships only what it imports. Styles are your call — pick a prebuilt Bulma CSS flavor or trim further with modular Sass. Just one dependency: Bulma.',
    kicker: 'ESM · tree-shakeable',
    chips: ['ESM', 'tree-shakeable'],
  },
  {
    key: 'developer',
    title: 'Developer-Friendly',
    description:
      '100% TypeScript, 99% unit test coverage: Reliable, stable components you can trust. 100% Bulma implementation: Access every Bulma element, layout, and component as native React pieces.',
    kicker: '.d.ts included',
    chips: ['.d.ts included', 'typed props'],
  },
];
