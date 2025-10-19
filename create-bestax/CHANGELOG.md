## [1.4.2](https://github.com/allxsmith/bestax/compare/create-bestax@1.4.1...create-bestax@1.4.2) (2025-10-19)


### Bug Fixes

* implement independent package versioning strategy ([#111](https://github.com/allxsmith/bestax/issues/111)) ([7819c73](https://github.com/allxsmith/bestax/commit/7819c73414a92c10aa0bc92af0b43b183a50be97)), closes [#110](https://github.com/allxsmith/bestax/issues/110)

## [1.4.1](https://github.com/allxsmith/bestax/compare/create-bestax@1.4.0...create-bestax@1.4.1) (2025-10-19)


### Bug Fixes

* **create-bestax:** correct browser title to prioritize Bestax branding ([#106](https://github.com/allxsmith/bestax/issues/106)) ([23aa535](https://github.com/allxsmith/bestax/commit/23aa535a82639e2b5552294b03636894ed686a4d)), closes [#105](https://github.com/allxsmith/bestax/issues/105)
* **create-bestax:** read version from package.json instead of hardcoded value ([#109](https://github.com/allxsmith/bestax/issues/109)) ([8605699](https://github.com/allxsmith/bestax/commit/8605699141c90cfde95fba229f21e601e7723586))
* **create-bestax:** use scenario-specific screenshot directories to prevent overwrites ([#108](https://github.com/allxsmith/bestax/issues/108)) ([c675957](https://github.com/allxsmith/bestax/commit/c675957d406d0c86907da06e6bdf7d71ec975b81)), closes [#107](https://github.com/allxsmith/bestax/issues/107)

# [1.4.0](https://github.com/allxsmith/bestax/compare/create-bestax@1.3.0...create-bestax@1.4.0) (2025-10-18)


### Features

* **create-bestax:** add cross-platform emoji support with figures ([#103](https://github.com/allxsmith/bestax/issues/103)) ([15567d9](https://github.com/allxsmith/bestax/commit/15567d92ab40e18d22c5757a576fcdb3c25a112b))

# [1.3.0](https://github.com/allxsmith/bestax/compare/create-bestax@1.2.2...create-bestax@1.3.0) (2025-10-18)


### Features

* **create-bestax:** improve favicon visibility and add distinct branding ([621590d](https://github.com/allxsmith/bestax/commit/621590d4984c964017c22daa278ef2c6b44c9183)), closes [#100](https://github.com/allxsmith/bestax/issues/100)

## [1.2.2](https://github.com/allxsmith/bestax/compare/create-bestax@1.2.1...create-bestax@1.2.2) (2025-10-17)


### Bug Fixes

* upgrade Turbo, Storybook, and Docusaurus dependencies ([5b4ebdd](https://github.com/allxsmith/bestax/commit/5b4ebdd5e8847de6281491a7c3dc676ceed9db29)), closes [#98](https://github.com/allxsmith/bestax/issues/98)

## [1.2.1](https://github.com/allxsmith/bestax/compare/create-bestax@1.2.0...create-bestax@1.2.1) (2025-10-17)


### Bug Fixes

* **create-bestax:** synchronize version with bestax-bulma to 2.4.0 ([623ee79](https://github.com/allxsmith/bestax/commit/623ee79a5510261c7603dcb867db9baf3d7e6586)), closes [#96](https://github.com/allxsmith/bestax/issues/96)
* **create-bestax:** update template dependency to ^2.4.0 ([200971d](https://github.com/allxsmith/bestax/commit/200971d4500283a8be1d64c5bf3ca8396b76cdb1))

# [1.2.0](https://github.com/allxsmith/bestax/compare/create-bestax@1.1.3...create-bestax@1.2.0) (2025-10-17)


### Bug Fixes

* **ci:** collect screenshots as artifacts and commit in single batch to avoid conflicts ([27b259d](https://github.com/allxsmith/bestax/commit/27b259d774d4088fa371bb7ad2688cc97d4258ab))
* **ci:** ensure npm install uses fresh downloads with --prefer-online ([1f2e15d](https://github.com/allxsmith/bestax/commit/1f2e15ddf2c4b51094ed58d04b26decc317dfa2e))
* **ci:** properly extract base path for recursive file search ([e0330ff](https://github.com/allxsmith/bestax/commit/e0330ff9ca0efe12ad96603cfe134307f3a09b83))
* **ci:** use find command instead of glob module in verified-commit action ([0e2d159](https://github.com/allxsmith/bestax/commit/0e2d159177760c7285c4ddd5930f49e6ac7c5566))
* **ci:** use npm ci for scaffolded app dependencies ([35652c8](https://github.com/allxsmith/bestax/commit/35652c8d84ecd2e1b8f5c2d0bc7b2f573d1e9717))
* **docs:** escape apostrophe in QuickStart notification text ([25d6d72](https://github.com/allxsmith/bestax/commit/25d6d7229d691245c3e2ca8475caaac7e9369478))
* **docs:** improve homepage hero layout and button spacing ([5f7a5a7](https://github.com/allxsmith/bestax/commit/5f7a5a78faa3e51766d8f4449e93bc4d6519fde9))
* **docs:** move robots.txt to correct deployment location ([#90](https://github.com/allxsmith/bestax/issues/90)) ([1e2aeee](https://github.com/allxsmith/bestax/commit/1e2aeee38fa01097db832b9bc7c920114db194b0))
* **docs:** rebrand and reorganize Storybook ([#83](https://github.com/allxsmith/bestax/issues/83)) ([dfb9937](https://github.com/allxsmith/bestax/commit/dfb99379b65135bc448f6f5e267fe2f473e8e106))
* **docs:** remove Google Analytics and add robots.txt ([94776f7](https://github.com/allxsmith/bestax/commit/94776f7a020af5411a8d679b794e09be2de7bf9e))
* **docs:** update Storybook logo path to /img/logo.svg for deployed site ([bf59758](https://github.com/allxsmith/bestax/commit/bf59758965e12b6144d57d0fe673f648c66454cf))
* **e2e:** correct notification CSS selectors to use contains instead of ends-with ([182acc1](https://github.com/allxsmith/bestax/commit/182acc15b6bde6b6d8869040a055d4588afb2b05))
* resolve React Hooks violations and ESLint configuration issues ([32d2931](https://github.com/allxsmith/bestax/commit/32d2931d982cfd6a56d6f5ecd9233f42dfd62b7c))


### Features

* **ci:** add verified-commit action for GPG-signed commits ([d078dfa](https://github.com/allxsmith/bestax/commit/d078dfac4ef8eb85bc2e02f50545868f0a4e0e0d))
* **create-bestax:** add visual regression testing and synchronized versioning ([17e1e22](https://github.com/allxsmith/bestax/commit/17e1e22bd114fa80c84c03a67ca8764c85ab321b)), closes [#94](https://github.com/allxsmith/bestax/issues/94)

## [1.1.3](https://github.com/allxsmith/bestax/compare/create-bestax@1.1.2...create-bestax@1.1.3) (2025-10-04)


### Bug Fixes

* **bulma-ui:** correct blog post examples and add Modal compound components ([#81](https://github.com/allxsmith/bestax/issues/81)) ([559c2e3](https://github.com/allxsmith/bestax/commit/559c2e30fa15580c02f014754fa3846fdd5ed2f6))

## [1.1.2](https://github.com/allxsmith/bestax/compare/create-bestax@1.1.1...create-bestax@1.1.2) (2025-10-04)


### Bug Fixes

* **create-bestax:** correct template path resolution from ../../ to ../ ([65b4493](https://github.com/allxsmith/bestax/commit/65b44931859e162c46bfc8cdd6e0849942778968)), closes [#78](https://github.com/allxsmith/bestax/issues/78)

## [1.1.1](https://github.com/allxsmith/bestax/compare/create-bestax@1.1.0...create-bestax@1.1.1) (2025-10-04)


### Bug Fixes

* **create-bestax:** exclude templates directory from linting and typecheck ([18fec0b](https://github.com/allxsmith/bestax/commit/18fec0b50fe71b2ba0bf41beb4bbb1e5bd399e22))
* **create-bestax:** move templates into package directory and update docs ([195bf01](https://github.com/allxsmith/bestax/commit/195bf01fae72ce268a75156140912e2bc40052c3)), closes [#78](https://github.com/allxsmith/bestax/issues/78)

# [1.1.0](https://github.com/allxsmith/bestax/compare/create-bestax@1.0.0...create-bestax@1.1.0) (2025-10-03)


### Features

* **create-bestax:** add README with templates location note ([8ddc73d](https://github.com/allxsmith/bestax/commit/8ddc73d9a548b948d7cac1fdbe3dc05da88afca5))

# 1.0.0 (2025-10-03)


### Bug Fixes

* **bulma-ui:** Add build step to publish in ci.yml ([e3707fc](https://github.com/allxsmith/bestax/commit/e3707fcdc0c4ba59dc1d68d81fdd9dc57d4436be))
* **bulma-ui:** add missing exports ([0d16633](https://github.com/allxsmith/bestax/commit/0d166338a8843df55af265d30a079858e0bf7da1))
* **bulma-ui:** Add Skeleton to exports ([e481599](https://github.com/allxsmith/bestax/commit/e481599047bd4f094f894569656c878faca3e1ea))
* **bulma-ui:** another attempt to fix semantic release builds with ci.yml ([cc3a3e2](https://github.com/allxsmith/bestax/commit/cc3a3e2416361d3da3288c97c894d700a4323a36))
* **bulma-ui:** another attempt to fix semantic release builds with ci.yml ([314bc39](https://github.com/allxsmith/bestax/commit/314bc394d57b4766d20590ae6fd59fe433443c8f))
* **bulma-ui:** another attempt to fix semantic release builds with ci.yml ([c930693](https://github.com/allxsmith/bestax/commit/c930693439e8a289f373c87a568b48fecabc53ae))
* **bulma-ui:** complete domain migration and fix semantic-release configuration ([#64](https://github.com/allxsmith/bestax/issues/64)) ([f4cd71d](https://github.com/allxsmith/bestax/commit/f4cd71d531b757465bf3227aeb5c4e98419cfb97))
* **bulma-ui:** correct NPM_TOKEN env variable in ci.yml ([94b48b4](https://github.com/allxsmith/bestax/commit/94b48b47aec94b83d25f94dade6af793fd7b1672))
* **bulma-ui:** Fix release.config.js to include package-lock.json ([390da59](https://github.com/allxsmith/bestax/commit/390da5938deeb9a790d063c79c2ca693f9b7d0b9))
* **bulma-ui:** full classPrefix support across layout/grid + prefix utils ([4ce0b53](https://github.com/allxsmith/bestax/commit/4ce0b53b337ff2ff961cc18a17790ee75d860dfa)), closes [#53](https://github.com/allxsmith/bestax/issues/53)
* **bulma-ui:** improve npm package discoverability with optimized keywords and badges ([#72](https://github.com/allxsmith/bestax/issues/72)) ([8c7a696](https://github.com/allxsmith/bestax/commit/8c7a69664fcc6409096cd72b9bb006ff8edf8ddc))
* **bulma-ui:** Initial semantic release changes ([b78d785](https://github.com/allxsmith/bestax/commit/b78d785e5d3e7aec5b49f178784aad3d97b5434c))
* **bulma-ui:** migrate domain from bestax.cc to bestax.io ([#64](https://github.com/allxsmith/bestax/issues/64)) ([4870b1e](https://github.com/allxsmith/bestax/commit/4870b1e7d9edd7295f907ae07df9fe00f1217f46))
* **bulma-ui:** resolve flex item properties and Card compound component issues ([#55](https://github.com/allxsmith/bestax/issues/55)) ([e774da3](https://github.com/allxsmith/bestax/commit/e774da3b7a8890b77d7d699c5b5d0d3a20920fed))
* **bulma-ui:** resolve flex item properties and Card compound component issues ([#55](https://github.com/allxsmith/bestax/issues/55)) ([7641a53](https://github.com/allxsmith/bestax/commit/7641a536db1c4a3928ccc7a15407b939fe205b06))
* **bulma-ui:** restrict semantic-release to bulma-ui scoped commits only ([2d67bf9](https://github.com/allxsmith/bestax/commit/2d67bf9a0ed65d1258c664ca741a1b0966445b79)), closes [#62](https://github.com/allxsmith/bestax/issues/62)
* **bulma-ui:** setup gpg signing with semantic-release ([3e24722](https://github.com/allxsmith/bestax/commit/3e24722d05cd231638864eebb5ff768991633c42))
* **bulma-ui:** update bundle size claims to accurate 21KB gzipped ([#66](https://github.com/allxsmith/bestax/issues/66)) ([6e381bd](https://github.com/allxsmith/bestax/commit/6e381bdc16ad5572a40983ccc079e33c7882c0c6))
* **bulma-ui:** update package-lock.json ([853d585](https://github.com/allxsmith/bestax/commit/853d585ddfb0622c963b29b050c23f96923fad81))
* **bulma-ui:** update package.json for better seo, exports, types, engines, funding, etc ([98cbc56](https://github.com/allxsmith/bestax/commit/98cbc5637b81c6cba560953bf95eb4c6371b4392))


### Features

* add theme system and config provider with comprehensive test coverage ([f3ca7f0](https://github.com/allxsmith/bestax/commit/f3ca7f08bc756c89d5b939c8d5e193b68578782f))
* **bulma-ui:** Add skeletons ([6c46e4b](https://github.com/allxsmith/bestax/commit/6c46e4b97a73a127406a25272ca584f2e84ea5fa))
* **create-bestax:** add CLI tool with Vite templates and automated publishing ([9748c3d](https://github.com/allxsmith/bestax/commit/9748c3d28ec9bd46fe571d7ba2cc7579ad9fc0ee))
* **docs:** add Google Analytics tracking for usage insights ([#68](https://github.com/allxsmith/bestax/issues/68)) ([90ab951](https://github.com/allxsmith/bestax/commit/90ab951f901df9bb71e2306b2a8ff74036d9d85a))
* **docs:** add pronunciation guide and dark mode support ([#58](https://github.com/allxsmith/bestax/issues/58)) ([48a8916](https://github.com/allxsmith/bestax/commit/48a8916755716d85837ac502fbf5343414d62f68))


### BREAKING CHANGES

* None - all changes are additive and backward compatible
