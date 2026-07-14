# [5.6.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@5.5.0...@allxsmith/bestax-bulma@5.6.0) (2026-07-14)


### Features

* **bulma-ui:** add consistent gap prop to Columns, aliasing gapSize ([#300](https://github.com/allxsmith/bestax/issues/300)) ([6c36455](https://github.com/allxsmith/bestax/commit/6c36455931367d8422516c5fbca227319d4552d5)), closes [#282](https://github.com/allxsmith/bestax/issues/282)

# [5.5.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@5.4.2...@allxsmith/bestax-bulma@5.5.0) (2026-07-14)


### Features

* **bulma-ui:** avatar/badge a11y batch — decorative alt, accessible names, live region, button type, surplus i18n, focus ring ([#298](https://github.com/allxsmith/bestax/issues/298)) ([508477f](https://github.com/allxsmith/bestax/commit/508477fcc79a07d6b960563e919e7a94d7da3b42)), closes [#266](https://github.com/allxsmith/bestax/issues/266) [#266](https://github.com/allxsmith/bestax/issues/266)

## [5.4.2](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@5.4.1...@allxsmith/bestax-bulma@5.4.2) (2026-07-14)


### Bug Fixes

* **bulma-ui:** retry failed Avatar src, flatten Fragment children in Avatars, RTL-safe overlap ([#297](https://github.com/allxsmith/bestax/issues/297)) ([c00b9db](https://github.com/allxsmith/bestax/commit/c00b9db6aa21fab055302fd3320dccd4c0cbc824))

## [5.4.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@5.4.0...@allxsmith/bestax-bulma@5.4.1) (2026-07-14)


### Bug Fixes

* **bulma-ui:** fix standalone Badge pointer-events, pulse halo, and falsy content ([#295](https://github.com/allxsmith/bestax/issues/295)) ([a9db031](https://github.com/allxsmith/bestax/commit/a9db03189c087eb0a61f56357e179296bd4cebf9)), closes [#264](https://github.com/allxsmith/bestax/issues/264)
* **create-bestax:** fail fast with guidance instead of hanging when stdin is not a TTY ([#293](https://github.com/allxsmith/bestax/issues/293)) ([46a172d](https://github.com/allxsmith/bestax/commit/46a172d503bb283a5fc168f397261f8afa558b19)), closes [#192](https://github.com/allxsmith/bestax/issues/192)


### Features

* **create-bestax:** scaffold-aware CLAUDE.md with setup facts and house style ([#271](https://github.com/allxsmith/bestax/issues/271)) ([c1681b0](https://github.com/allxsmith/bestax/commit/c1681b0f1e87b65f6614e564b0878bc6d7217757))

# [5.4.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@5.3.0...@allxsmith/bestax-bulma@5.4.0) (2026-07-10)


### Features

* **bulma-ui:** add Avatar, Avatars, and Badge components ([#257](https://github.com/allxsmith/bestax/issues/257)) ([0817018](https://github.com/allxsmith/bestax/commit/081701874bec730b0ede42a71a69e831310df76b)), closes [#256](https://github.com/allxsmith/bestax/issues/256)

# [5.3.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@5.2.1...@allxsmith/bestax-bulma@5.3.0) (2026-07-08)


### Features

* **bulma-ui:** add Reveal component for scroll-triggered animations ([#255](https://github.com/allxsmith/bestax/issues/255)) ([a89c574](https://github.com/allxsmith/bestax/commit/a89c5747c24969dff04ffd663d7281353abfa5d6))

## [5.2.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@5.2.0...@allxsmith/bestax-bulma@5.2.1) (2026-07-07)


### Bug Fixes

* **bulma-ui:** strip redundant library prefix from Icon name ([#242](https://github.com/allxsmith/bestax/issues/242)) ([dbe3622](https://github.com/allxsmith/bestax/commit/dbe36221af3db5be729dd65a3d528042986ee3ec)), closes [#189](https://github.com/allxsmith/bestax/issues/189)

# [5.2.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@5.1.3...@allxsmith/bestax-bulma@5.2.0) (2026-07-07)


### Features

* **bulma-ui:** make Button and Link as prop polymorphic (React.ElementType) ([#238](https://github.com/allxsmith/bestax/issues/238)) ([ce90304](https://github.com/allxsmith/bestax/commit/ce90304091872c44c4041035672629b8b7e9fca6)), closes [#188](https://github.com/allxsmith/bestax/issues/188)

## [5.1.3](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@5.1.2...@allxsmith/bestax-bulma@5.1.3) (2026-07-04)


### Bug Fixes

* **bulma-ui:** publish rewritten README to npm ([9810081](https://github.com/allxsmith/bestax/commit/981008179d96b19f692ca73c17a02ae3f5fa6298))
* **create-bestax:** refresh README and bump scaffolded bestax-bulma to ^5 ([4e19e86](https://github.com/allxsmith/bestax/commit/4e19e8691781cc0dce9bf6b277a4d0e90a9ec693))


### Documentation

* fix stale versioning and coverage docs; drop CLAUDE.md stale-docs flags ([71c4583](https://github.com/allxsmith/bestax/commit/71c4583979d942af739bf3216f187ab454ae4a99))


### BREAKING CHANGES

* footer requirement, and the commitlint scope rule
- CONTRIBUTING.md: replace the type-less commit example with a
  commitlint-valid conventional format (verified against commitlint);
  correct all four coverage mentions to the real jest thresholds
  (bulma-ui 99%, create-bestax 95%/78% branches); fix the npm package
  name (@allxsmith/bestax-bulma, plus create-bestax) and link VERSIONING.md
- CLAUDE.md: remove the stale-docs warning and asides now that the
  underlying docs are correct; point at VERSIONING.md again

Closes #206.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0131uD6QKmAij7Byk3SByyLh

## [5.1.2](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@5.1.1...@allxsmith/bestax-bulma@5.1.2) (2026-07-04)


### Bug Fixes

* **bulma-ui:** reference llms docs from README and package.json ([#198](https://github.com/allxsmith/bestax/issues/198)) ([db8aab3](https://github.com/allxsmith/bestax/commit/db8aab32c1c07d81071e7da0c74e811150289d40))
* **create-bestax:** point scaffolded CLAUDE.md at llms docs; document skills ([#198](https://github.com/allxsmith/bestax/issues/198)) ([b2e0514](https://github.com/allxsmith/bestax/commit/b2e0514c0ed4a04192b56fda8e2fc23a67898f97))
* **create-bestax:** ship improved bundled skills + component catalog ([#199](https://github.com/allxsmith/bestax/issues/199)) ([a1515c2](https://github.com/allxsmith/bestax/commit/a1515c2742fa1a2b82052045674c4f1b41d0c792))
* **docs:** emit per-page markdown so llms.txt links resolve ([#200](https://github.com/allxsmith/bestax/issues/200)) ([7877083](https://github.com/allxsmith/bestax/commit/7877083da55d53bdc57811ddc14d5065fd0efdae))

## [5.1.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@5.1.0...@allxsmith/bestax-bulma@5.1.1) (2026-07-02)


### Bug Fixes

* **bulma-ui:** publish with npm provenance attestation ([172da62](https://github.com/allxsmith/bestax/commit/172da62349b464d414da552058dfa4db238ab720)), closes [#180](https://github.com/allxsmith/bestax/issues/180)
* **create-bestax:** publish with npm provenance attestation ([21ffe8f](https://github.com/allxsmith/bestax/commit/21ffe8f753419eeded407b1fa8685bcbd473fbfe)), closes [#180](https://github.com/allxsmith/bestax/issues/180)
* **docs:** generate llms.txt so the advertised homepage link resolves ([9fae464](https://github.com/allxsmith/bestax/commit/9fae464305595c284335eda65d721480d1accb25)), closes [#177](https://github.com/allxsmith/bestax/issues/177)

# [5.1.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@5.0.0...@allxsmith/bestax-bulma@5.1.0) (2026-07-01)

### Features

- **bulma-ui:** add colorMode dark-mode prop to Theme ([4acc41e](https://github.com/allxsmith/bestax/commit/4acc41ea6138da3ac2051d5eacfa6d5635560c62)), closes [#174](https://github.com/allxsmith/bestax/issues/174)
- **create-bestax:** offer to install the bestax AI skills when scaffolding ([625b7bf](https://github.com/allxsmith/bestax/commit/625b7bfdf6570f9954898bea00fc72d9e28df250)), closes [#174](https://github.com/allxsmith/bestax/issues/174)

# [5.0.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@4.0.0...@allxsmith/bestax-bulma@5.0.0) (2026-06-26)

- feat(bulma-ui)!: remove bestax-bulma-prefixed CSS variant ([94baa34](https://github.com/allxsmith/bestax/commit/94baa3489ac54587e6026a8bece9f86816af9372))

### Bug Fixes

- **create-bestax:** scaffold @allxsmith/bestax-bulma ^4.0.0 ([1d3b802](https://github.com/allxsmith/bestax/commit/1d3b802eb7285ca05c64cfb0a44bdb96ddb2d82b))
- **create-bestax:** scaffold bundled bestax CSS flavors, not stock Bulma ([43621dc](https://github.com/allxsmith/bestax/commit/43621dc7cebef2dd51f017feccc91a2154e1f7a3))

### Features

- **create-bestax:** modernize templates (Vite 8, ESLint 10, TS 6) + add working lint config ([4537629](https://github.com/allxsmith/bestax/commit/4537629a82bf3d6254518389564a467b1fc71242)), closes [#167](https://github.com/allxsmith/bestax/issues/167)

### BREAKING CHANGES

- the @allxsmith/bestax-bulma/versions/bestax-bulma-prefixed.css
  export is removed. Use versions/bestax-prefixed.css with classPrefix="bestax-".

# [4.0.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@3.0.2...@allxsmith/bestax-bulma@4.0.0) (2026-06-20)

### Bug Fixes

- **bulma-ui:** resolve react-hooks v7 and [@eslint-react](https://github.com/eslint-react) findings ([14caaaf](https://github.com/allxsmith/bestax/commit/14caaafa1db777ae5ce59c512ac253968df21fc3))

### Features

- **bulma-ui:** require React 18 as the minimum supported version ([c7251b0](https://github.com/allxsmith/bestax/commit/c7251b0a4a1f92ab90c4eda59c60c0ee931e91e1))

### BREAKING CHANGES

- **bulma-ui:** React 16 and 17 are no longer supported; the minimum
  supported React version is now 18.

## [3.0.2](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@3.0.1...@allxsmith/bestax-bulma@3.0.2) (2026-06-18)

### Bug Fixes

- **bulma-ui:** add fontawesome-free as explicit devDependency ([a4a5389](https://github.com/allxsmith/bestax/commit/a4a53895f8797ca0889060403ae5d1e21cd09bec))

## [3.0.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@3.0.0...@allxsmith/bestax-bulma@3.0.1) (2026-06-17)

### Bug Fixes

- **bulma-ui:** trigger release to publish via OIDC trusted publishing ([e2d09c5](https://github.com/allxsmith/bestax/commit/e2d09c5e312df3788aa140f0e5e86370a545a989))

# [3.0.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.6.2...@allxsmith/bestax-bulma@3.0.0) (2026-06-17)

- feat(create-bestax)!: require Node.js 18+ and align with bestax-bulma v2 ([#118](https://github.com/allxsmith/bestax/issues/118)) ([b22f183](https://github.com/allxsmith/bestax/commit/b22f183acfa2f0fa6e50b9cd399ca7cd9ac67f94))

### Bug Fixes

- add comprehensive rules to prevent bulma-ui versioning on non-bulma-ui commits ([#122](https://github.com/allxsmith/bestax/issues/122)) ([525ccfa](https://github.com/allxsmith/bestax/commit/525ccfa7beff0e46fdbc5c2e25603e562baabd67)), closes [#119](https://github.com/allxsmith/bestax/issues/119)
- **bulma-ui:** a11y + case-insensitive Taginput matching from PR review ([d576829](https://github.com/allxsmith/bestax/commit/d57682926f510d029839e79d6ba05bd62cc20323))
- **bulma-ui:** migrate ionicons to v8 to unblock publish and Storybook ([927a55b](https://github.com/allxsmith/bestax/commit/927a55b024db8d2c9da7448a958d2a51daef3cca)), closes [#142](https://github.com/allxsmith/bestax/issues/142)
- **bulma-ui:** reject predicate-blocked values during manual entry ([a8f6e28](https://github.com/allxsmith/bestax/commit/a8f6e28b92b997f0cdbb25feed0e039ecc1503b5))
- **bulma-ui:** resolve security vulnerabilities and update dependencies ([#128](https://github.com/allxsmith/bestax/issues/128)) ([112f6e4](https://github.com/allxsmith/bestax/commit/112f6e4841fa9ea9c4ba49200984e413c1bc5f22)), closes [#127](https://github.com/allxsmith/bestax/issues/127)
- **bulma-ui:** use createRequire for ESM compatibility in Storybook 10 ([#130](https://github.com/allxsmith/bestax/issues/130)) ([b27e60e](https://github.com/allxsmith/bestax/commit/b27e60e074dda007e76ad38d867573539b8bcb41)), closes [#129](https://github.com/allxsmith/bestax/issues/129)
- **docs:** correct Content Signals syntax in robots.txt ([#134](https://github.com/allxsmith/bestax/issues/134)) ([85dd9de](https://github.com/allxsmith/bestax/commit/85dd9de7c147b06f43b9e6a51c6c304a9530b121))
- prevent bulma-ui from versioning on create-bestax commits ([#120](https://github.com/allxsmith/bestax/issues/120)) ([4dfaf9c](https://github.com/allxsmith/bestax/commit/4dfaf9ca2a9f440625827dfb4e11fc2a709561dd)), closes [#119](https://github.com/allxsmith/bestax/issues/119)

### Features

- **bulma-ui:** add cursor helper, closeDelay prop, and polish Tooltip stories ([37945b5](https://github.com/allxsmith/bestax/commit/37945b59bb055671d392b72a06023587fd0c73fb))
- **bulma-ui:** add extra components, form elements, and SCSS styles ([59daf28](https://github.com/allxsmith/bestax/commit/59daf2826e99b2150b1c4529a6cadc8b69620998))
- **bulma-ui:** add HTML element wrapper components ([#135](https://github.com/allxsmith/bestax/issues/135)) ([#136](https://github.com/allxsmith/bestax/issues/136)) ([20fb16d](https://github.com/allxsmith/bestax/commit/20fb16dc69592e89ac7924d7b0e1e9cd1048fec8))
- **bulma-ui:** add manual-entry stories for format, bounds, and blocked-value variations ([e93d51c](https://github.com/allxsmith/bestax/commit/e93d51c8f6521fdd011717c1f48264cbd6ce4c4f))
- **bulma-ui:** add themed Checkbox/Radio, convenience Field components, and Autocomplete cleanup ([3c57a5a](https://github.com/allxsmith/bestax/commit/3c57a5ae57276f7c50dd169b8357aceddd499f2e))
- **bulma-ui:** add typing-first story variants for all picker property variations ([078433f](https://github.com/allxsmith/bestax/commit/078433f056d0c8cde20ae1a0a9ede50989125a45))
- **bulma-ui:** change the default primary color to [#1](https://github.com/allxsmith/bestax/issues/1)e6b99 ([8872620](https://github.com/allxsmith/bestax/commit/8872620365809d7f00960fe57a8c9b10c27ac6c5)), closes [#1e6b99](https://github.com/allxsmith/bestax/issues/1e6b99) [#1e6b99](https://github.com/allxsmith/bestax/issues/1e6b99)
- **bulma-ui:** dim and blur the calendar behind the Datetimepicker time wheels ([3d90619](https://github.com/allxsmith/bestax/commit/3d90619f07cbd7030d559d8b36eef8d1093a2dac))
- **bulma-ui:** finalize the 3.0 component set ([87ccc0e](https://github.com/allxsmith/bestax/commit/87ccc0e5b4fed5ab58d8cb076ead7c0b5de284b7))
- **docs:** migrate from GitHub Pages to Cloudflare Pages ([#132](https://github.com/allxsmith/bestax/issues/132)) ([2154672](https://github.com/allxsmith/bestax/commit/21546721dbc0eaa175820166f2b2b630a0516334)), closes [#131](https://github.com/allxsmith/bestax/issues/131)
- **form:** add Datepicker, Timepicker, and Datetimepicker components ([c6684e6](https://github.com/allxsmith/bestax/commit/c6684e6d4f94326bc0ea0bd0f7b022de9af81074))

### BREAKING CHANGES

- **bulma-ui:** Snackbar has been removed and merged into Toast; use Toast
  with its positioning and queue props instead.
- **bulma-ui:** form controls now auto-wrap in Field/Control, and Checkbox
  and Radio ship new themed visuals. See the 2.x -> 3.x migration guide.
- This version requires Node.js 18.0.0 or higher. The CLI now enforces this requirement and will exit with an error message if running on older Node.js versions. This aligns create-bestax with the bestax-bulma v2.x ecosystem.

- fix(create-bestax): correct Prettier formatting in index.ts

## [2.6.2](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.6.1...@allxsmith/bestax-bulma@2.6.2) (2025-10-19)

### Bug Fixes

- implement independent package versioning strategy ([#111](https://github.com/allxsmith/bestax/issues/111)) ([7819c73](https://github.com/allxsmith/bestax/commit/7819c73414a92c10aa0bc92af0b43b183a50be97)), closes [#110](https://github.com/allxsmith/bestax/issues/110)

## [2.6.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.6.0...@allxsmith/bestax-bulma@2.6.1) (2025-10-19)

### Bug Fixes

- **create-bestax:** correct browser title to prioritize Bestax branding ([#106](https://github.com/allxsmith/bestax/issues/106)) ([23aa535](https://github.com/allxsmith/bestax/commit/23aa535a82639e2b5552294b03636894ed686a4d)), closes [#105](https://github.com/allxsmith/bestax/issues/105)
- **create-bestax:** read version from package.json instead of hardcoded value ([#109](https://github.com/allxsmith/bestax/issues/109)) ([8605699](https://github.com/allxsmith/bestax/commit/8605699141c90cfde95fba229f21e601e7723586))
- **create-bestax:** use scenario-specific screenshot directories to prevent overwrites ([#108](https://github.com/allxsmith/bestax/issues/108)) ([c675957](https://github.com/allxsmith/bestax/commit/c675957d406d0c86907da06e6bdf7d71ec975b81)), closes [#107](https://github.com/allxsmith/bestax/issues/107)

# [2.6.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.5.0...@allxsmith/bestax-bulma@2.6.0) (2025-10-18)

### Features

- **create-bestax:** add cross-platform emoji support with figures ([#103](https://github.com/allxsmith/bestax/issues/103)) ([15567d9](https://github.com/allxsmith/bestax/commit/15567d92ab40e18d22c5757a576fcdb3c25a112b))

# [2.5.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.4.2...@allxsmith/bestax-bulma@2.5.0) (2025-10-18)

### Features

- **create-bestax:** improve favicon visibility and add distinct branding ([621590d](https://github.com/allxsmith/bestax/commit/621590d4984c964017c22daa278ef2c6b44c9183)), closes [#100](https://github.com/allxsmith/bestax/issues/100)

## [2.4.2](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.4.1...@allxsmith/bestax-bulma@2.4.2) (2025-10-17)

### Bug Fixes

- upgrade Turbo, Storybook, and Docusaurus dependencies ([5b4ebdd](https://github.com/allxsmith/bestax/commit/5b4ebdd5e8847de6281491a7c3dc676ceed9db29)), closes [#98](https://github.com/allxsmith/bestax/issues/98)

## [2.4.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.4.0...@allxsmith/bestax-bulma@2.4.1) (2025-10-17)

### Bug Fixes

- **create-bestax:** synchronize version with bestax-bulma to 2.4.0 ([623ee79](https://github.com/allxsmith/bestax/commit/623ee79a5510261c7603dcb867db9baf3d7e6586)), closes [#96](https://github.com/allxsmith/bestax/issues/96)
- **create-bestax:** update template dependency to ^2.4.0 ([200971d](https://github.com/allxsmith/bestax/commit/200971d4500283a8be1d64c5bf3ca8396b76cdb1))

# [2.4.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.3.3...@allxsmith/bestax-bulma@2.4.0) (2025-10-17)

### Bug Fixes

- **ci:** collect screenshots as artifacts and commit in single batch to avoid conflicts ([27b259d](https://github.com/allxsmith/bestax/commit/27b259d774d4088fa371bb7ad2688cc97d4258ab))
- **ci:** ensure npm install uses fresh downloads with --prefer-online ([1f2e15d](https://github.com/allxsmith/bestax/commit/1f2e15ddf2c4b51094ed58d04b26decc317dfa2e))
- **ci:** properly extract base path for recursive file search ([e0330ff](https://github.com/allxsmith/bestax/commit/e0330ff9ca0efe12ad96603cfe134307f3a09b83))
- **ci:** use find command instead of glob module in verified-commit action ([0e2d159](https://github.com/allxsmith/bestax/commit/0e2d159177760c7285c4ddd5930f49e6ac7c5566))
- **ci:** use npm ci for scaffolded app dependencies ([35652c8](https://github.com/allxsmith/bestax/commit/35652c8d84ecd2e1b8f5c2d0bc7b2f573d1e9717))
- **docs:** escape apostrophe in QuickStart notification text ([25d6d72](https://github.com/allxsmith/bestax/commit/25d6d7229d691245c3e2ca8475caaac7e9369478))
- **docs:** improve homepage hero layout and button spacing ([5f7a5a7](https://github.com/allxsmith/bestax/commit/5f7a5a78faa3e51766d8f4449e93bc4d6519fde9))
- **docs:** move robots.txt to correct deployment location ([#90](https://github.com/allxsmith/bestax/issues/90)) ([1e2aeee](https://github.com/allxsmith/bestax/commit/1e2aeee38fa01097db832b9bc7c920114db194b0))
- **docs:** rebrand and reorganize Storybook ([#83](https://github.com/allxsmith/bestax/issues/83)) ([dfb9937](https://github.com/allxsmith/bestax/commit/dfb99379b65135bc448f6f5e267fe2f473e8e106))
- **docs:** remove Google Analytics and add robots.txt ([94776f7](https://github.com/allxsmith/bestax/commit/94776f7a020af5411a8d679b794e09be2de7bf9e))
- **docs:** update Storybook logo path to /img/logo.svg for deployed site ([bf59758](https://github.com/allxsmith/bestax/commit/bf59758965e12b6144d57d0fe673f648c66454cf))
- **e2e:** correct notification CSS selectors to use contains instead of ends-with ([182acc1](https://github.com/allxsmith/bestax/commit/182acc15b6bde6b6d8869040a055d4588afb2b05))
- resolve React Hooks violations and ESLint configuration issues ([32d2931](https://github.com/allxsmith/bestax/commit/32d2931d982cfd6a56d6f5ecd9233f42dfd62b7c))

### Features

- **ci:** add verified-commit action for GPG-signed commits ([d078dfa](https://github.com/allxsmith/bestax/commit/d078dfac4ef8eb85bc2e02f50545868f0a4e0e0d))
- **create-bestax:** add visual regression testing and synchronized versioning ([17e1e22](https://github.com/allxsmith/bestax/commit/17e1e22bd114fa80c84c03a67ca8764c85ab321b)), closes [#94](https://github.com/allxsmith/bestax/issues/94)

## [2.3.3](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.3.2...@allxsmith/bestax-bulma@2.3.3) (2025-10-04)

### Bug Fixes

- **bulma-ui:** correct blog post examples and add Modal compound components ([#81](https://github.com/allxsmith/bestax/issues/81)) ([559c2e3](https://github.com/allxsmith/bestax/commit/559c2e30fa15580c02f014754fa3846fdd5ed2f6))

## [2.3.2](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.3.1...@allxsmith/bestax-bulma@2.3.2) (2025-10-04)

### Bug Fixes

- **create-bestax:** correct template path resolution from ../../ to ../ ([65b4493](https://github.com/allxsmith/bestax/commit/65b44931859e162c46bfc8cdd6e0849942778968)), closes [#78](https://github.com/allxsmith/bestax/issues/78)

## [2.3.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.3.0...@allxsmith/bestax-bulma@2.3.1) (2025-10-04)

### Bug Fixes

- **create-bestax:** exclude templates directory from linting and typecheck ([18fec0b](https://github.com/allxsmith/bestax/commit/18fec0b50fe71b2ba0bf41beb4bbb1e5bd399e22))
- **create-bestax:** move templates into package directory and update docs ([195bf01](https://github.com/allxsmith/bestax/commit/195bf01fae72ce268a75156140912e2bc40052c3)), closes [#78](https://github.com/allxsmith/bestax/issues/78)

# [2.3.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.2.0...@allxsmith/bestax-bulma@2.3.0) (2025-10-03)

### Features

- **create-bestax:** add README with templates location note ([8ddc73d](https://github.com/allxsmith/bestax/commit/8ddc73d9a548b948d7cac1fdbe3dc05da88afca5))

# [2.2.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.1.3...@allxsmith/bestax-bulma@2.2.0) (2025-10-03)

### Features

- **create-bestax:** add CLI tool with Vite templates and automated publishing ([9748c3d](https://github.com/allxsmith/bestax/commit/9748c3d28ec9bd46fe571d7ba2cc7579ad9fc0ee))

## [2.1.3](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.1.2...@allxsmith/bestax-bulma@2.1.3) (2025-09-22)

### Bug Fixes

- **bulma-ui:** update bundle size claims to accurate 21KB gzipped ([#66](https://github.com/allxsmith/bestax/issues/66)) ([6e381bd](https://github.com/allxsmith/bestax/commit/6e381bdc16ad5572a40983ccc079e33c7882c0c6))

## [2.1.2](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.1.1...@allxsmith/bestax-bulma@2.1.2) (2025-09-21)

### Bug Fixes

- **bulma-ui:** improve npm package discoverability with optimized keywords and badges ([#72](https://github.com/allxsmith/bestax/issues/72)) ([8c7a696](https://github.com/allxsmith/bestax/commit/8c7a69664fcc6409096cd72b9bb006ff8edf8ddc))

### Features

- **docs:** add Google Analytics tracking for usage insights ([#68](https://github.com/allxsmith/bestax/issues/68)) ([90ab951](https://github.com/allxsmith/bestax/commit/90ab951f901df9bb71e2306b2a8ff74036d9d85a))

## [2.1.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.1.0...@allxsmith/bestax-bulma@2.1.1) (2025-09-19)

### Bug Fixes

- **bulma-ui:** complete domain migration and fix semantic-release configuration ([#64](https://github.com/allxsmith/bestax/issues/64)) ([f4cd71d](https://github.com/allxsmith/bestax/commit/f4cd71d531b757465bf3227aeb5c4e98419cfb97))
- **bulma-ui:** migrate domain from bestax.cc to bestax.io ([#64](https://github.com/allxsmith/bestax/issues/64)) ([4870b1e](https://github.com/allxsmith/bestax/commit/4870b1e7d9edd7295f907ae07df9fe00f1217f46))
- **bulma-ui:** restrict semantic-release to bulma-ui scoped commits only ([2d67bf9](https://github.com/allxsmith/bestax/commit/2d67bf9a0ed65d1258c664ca741a1b0966445b79)), closes [#62](https://github.com/allxsmith/bestax/issues/62)

# [2.1.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.0.2...@allxsmith/bestax-bulma@2.1.0) (2025-09-16)

### Features

- **docs:** add pronunciation guide and dark mode support ([#58](https://github.com/allxsmith/bestax/issues/58)) ([48a8916](https://github.com/allxsmith/bestax/commit/48a8916755716d85837ac502fbf5343414d62f68))

## [2.0.2](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.0.1...@allxsmith/bestax-bulma@2.0.2) (2025-09-09)

### Bug Fixes

- **bulma-ui:** resolve flex item properties and Card compound component issues ([#55](https://github.com/allxsmith/bestax/issues/55)) ([e774da3](https://github.com/allxsmith/bestax/commit/e774da3b7a8890b77d7d699c5b5d0d3a20920fed))
- **bulma-ui:** resolve flex item properties and Card compound component issues ([#55](https://github.com/allxsmith/bestax/issues/55)) ([7641a53](https://github.com/allxsmith/bestax/commit/7641a536db1c4a3928ccc7a15407b939fe205b06))

## [2.0.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.0.0...@allxsmith/bestax-bulma@2.0.1) (2025-08-23)

### Bug Fixes

- **bulma-ui:** full classPrefix support across layout/grid + prefix utils ([4ce0b53](https://github.com/allxsmith/bestax/commit/4ce0b53b337ff2ff961cc18a17790ee75d860dfa)), closes [#53](https://github.com/allxsmith/bestax/issues/53)

# [2.0.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@1.1.1...@allxsmith/bestax-bulma@2.0.0) (2025-08-04)

### Features

- add theme system and config provider with comprehensive test coverage ([f3ca7f0](https://github.com/allxsmith/bestax/commit/f3ca7f08bc756c89d5b939c8d5e193b68578782f))

### BREAKING CHANGES

- None - all changes are additive and backward compatible

## [1.1.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@1.1.0...@allxsmith/bestax-bulma@1.1.1) (2025-07-19)

### Bug Fixes

- **bulma-ui:** Add Skeleton to exports ([e481599](https://github.com/allxsmith/bestax/commit/e481599047bd4f094f894569656c878faca3e1ea))

# [1.1.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@1.0.13...@allxsmith/bestax-bulma@1.1.0) (2025-07-18)

### Features

- **bulma-ui:** Add skeletons ([6c46e4b](https://github.com/allxsmith/bestax/commit/6c46e4b97a73a127406a25272ca584f2e84ea5fa))

## [1.0.13](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@1.0.12...@allxsmith/bestax-bulma@1.0.13) (2025-07-15)

### Bug Fixes

- **bulma-ui:** Fix release.config.js to include package-lock.json ([390da59](https://github.com/allxsmith/bestax/commit/390da5938deeb9a790d063c79c2ca693f9b7d0b9))

## [1.0.12](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@1.0.11...@allxsmith/bestax-bulma@1.0.12) (2025-07-15)

### Bug Fixes

- **bulma-ui:** update package-lock.json ([853d585](https://github.com/allxsmith/bestax/commit/853d585ddfb0622c963b29b050c23f96923fad81))

## [1.0.11](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@1.0.10...@allxsmith/bestax-bulma@1.0.11) (2025-07-15)

### Bug Fixes

- **bulma-ui:** add missing exports ([0d16633](https://github.com/allxsmith/bestax/commit/0d166338a8843df55af265d30a079858e0bf7da1))

## [1.0.10](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@1.0.9...@allxsmith/bestax-bulma@1.0.10) (2025-07-13)

### Bug Fixes

- **bulma-ui:** Add build step to publish in ci.yml ([e3707fc](https://github.com/allxsmith/bestax/commit/e3707fcdc0c4ba59dc1d68d81fdd9dc57d4436be))

## [1.0.9](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@1.0.8...@allxsmith/bestax-bulma@1.0.9) (2025-07-12)

### Bug Fixes

- **bulma-ui:** another attempt to fix semantic release builds with ci.yml ([cc3a3e2](https://github.com/allxsmith/bestax/commit/cc3a3e2416361d3da3288c97c894d700a4323a36))
- **bulma-ui:** another attempt to fix semantic release builds with ci.yml ([314bc39](https://github.com/allxsmith/bestax/commit/314bc394d57b4766d20590ae6fd59fe433443c8f))
- **bulma-ui:** another attempt to fix semantic release builds with ci.yml ([c930693](https://github.com/allxsmith/bestax/commit/c930693439e8a289f373c87a568b48fecabc53ae))
- **bulma-ui:** correct NPM_TOKEN env variable in ci.yml ([94b48b4](https://github.com/allxsmith/bestax/commit/94b48b47aec94b83d25f94dade6af793fd7b1672))
- **bulma-ui:** Initial semantic release changes ([b78d785](https://github.com/allxsmith/bestax/commit/b78d785e5d3e7aec5b49f178784aad3d97b5434c))
- **bulma-ui:** setup gpg signing with semantic-release ([3e24722](https://github.com/allxsmith/bestax/commit/3e24722d05cd231638864eebb5ff768991633c42))
- **bulma-ui:** update package.json for better seo, exports, types, engines, funding, etc ([98cbc56](https://github.com/allxsmith/bestax/commit/98cbc5637b81c6cba560953bf95eb4c6371b4392))

# @allxsmith/bestax-bulma

## 1.0.8

### Patch Changes

- 8483bd2: Inline sources in tsconfig for proper source map functionality

## 1.0.7

### Patch Changes

- b846939: Fix package module and main paths

## 1.0.6

### Patch Changes

- 145d521: Update internal react version to 19, update peer deps to allow react 16 17 18 19

## 1.0.5

### Patch Changes

- f9001fb: Removed references to unsupported icon package

## 1.0.4

### Patch Changes

- 65aaf7b: Update package to contain bestax homepage, and reword special thanks in readme

## 1.0.3

### Patch Changes

- 015937d: Moved README to bulma-ui folder, created mono repo README.md

## 1.0.2

### Patch Changes

- 93fd3f8: Include README.md in npm package files

## 1.0.1

### Patch Changes

- 28ec7f2: Updated readme

## 1.0.0

### Major Changes

- 35da1ee: Publish first major release, all bulma components present"
- b235dbd: First full release of components
