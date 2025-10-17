## [2.4.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.4.0...@allxsmith/bestax-bulma@2.4.1) (2025-10-17)


### Bug Fixes

* **create-bestax:** synchronize version with bestax-bulma to 2.4.0 ([623ee79](https://github.com/allxsmith/bestax/commit/623ee79a5510261c7603dcb867db9baf3d7e6586)), closes [#96](https://github.com/allxsmith/bestax/issues/96)
* **create-bestax:** update template dependency to ^2.4.0 ([200971d](https://github.com/allxsmith/bestax/commit/200971d4500283a8be1d64c5bf3ca8396b76cdb1))

# [2.4.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.3.3...@allxsmith/bestax-bulma@2.4.0) (2025-10-17)


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

## [2.3.3](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.3.2...@allxsmith/bestax-bulma@2.3.3) (2025-10-04)


### Bug Fixes

* **bulma-ui:** correct blog post examples and add Modal compound components ([#81](https://github.com/allxsmith/bestax/issues/81)) ([559c2e3](https://github.com/allxsmith/bestax/commit/559c2e30fa15580c02f014754fa3846fdd5ed2f6))

## [2.3.2](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.3.1...@allxsmith/bestax-bulma@2.3.2) (2025-10-04)


### Bug Fixes

* **create-bestax:** correct template path resolution from ../../ to ../ ([65b4493](https://github.com/allxsmith/bestax/commit/65b44931859e162c46bfc8cdd6e0849942778968)), closes [#78](https://github.com/allxsmith/bestax/issues/78)

## [2.3.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.3.0...@allxsmith/bestax-bulma@2.3.1) (2025-10-04)


### Bug Fixes

* **create-bestax:** exclude templates directory from linting and typecheck ([18fec0b](https://github.com/allxsmith/bestax/commit/18fec0b50fe71b2ba0bf41beb4bbb1e5bd399e22))
* **create-bestax:** move templates into package directory and update docs ([195bf01](https://github.com/allxsmith/bestax/commit/195bf01fae72ce268a75156140912e2bc40052c3)), closes [#78](https://github.com/allxsmith/bestax/issues/78)

# [2.3.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.2.0...@allxsmith/bestax-bulma@2.3.0) (2025-10-03)


### Features

* **create-bestax:** add README with templates location note ([8ddc73d](https://github.com/allxsmith/bestax/commit/8ddc73d9a548b948d7cac1fdbe3dc05da88afca5))

# [2.2.0](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.1.3...@allxsmith/bestax-bulma@2.2.0) (2025-10-03)


### Features

* **create-bestax:** add CLI tool with Vite templates and automated publishing ([9748c3d](https://github.com/allxsmith/bestax/commit/9748c3d28ec9bd46fe571d7ba2cc7579ad9fc0ee))

## [2.1.3](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.1.2...@allxsmith/bestax-bulma@2.1.3) (2025-09-22)


### Bug Fixes

* **bulma-ui:** update bundle size claims to accurate 21KB gzipped ([#66](https://github.com/allxsmith/bestax/issues/66)) ([6e381bd](https://github.com/allxsmith/bestax/commit/6e381bdc16ad5572a40983ccc079e33c7882c0c6))

## [2.1.2](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.1.1...@allxsmith/bestax-bulma@2.1.2) (2025-09-21)


### Bug Fixes

* **bulma-ui:** improve npm package discoverability with optimized keywords and badges ([#72](https://github.com/allxsmith/bestax/issues/72)) ([8c7a696](https://github.com/allxsmith/bestax/commit/8c7a69664fcc6409096cd72b9bb006ff8edf8ddc))


### Features

* **docs:** add Google Analytics tracking for usage insights ([#68](https://github.com/allxsmith/bestax/issues/68)) ([90ab951](https://github.com/allxsmith/bestax/commit/90ab951f901df9bb71e2306b2a8ff74036d9d85a))

## [2.1.1](https://github.com/allxsmith/bestax/compare/@allxsmith/bestax-bulma@2.1.0...@allxsmith/bestax-bulma@2.1.1) (2025-09-19)


### Bug Fixes

* **bulma-ui:** complete domain migration and fix semantic-release configuration ([#64](https://github.com/allxsmith/bestax/issues/64)) ([f4cd71d](https://github.com/allxsmith/bestax/commit/f4cd71d531b757465bf3227aeb5c4e98419cfb97))
* **bulma-ui:** migrate domain from bestax.cc to bestax.io ([#64](https://github.com/allxsmith/bestax/issues/64)) ([4870b1e](https://github.com/allxsmith/bestax/commit/4870b1e7d9edd7295f907ae07df9fe00f1217f46))
* **bulma-ui:** restrict semantic-release to bulma-ui scoped commits only ([2d67bf9](https://github.com/allxsmith/bestax/commit/2d67bf9a0ed65d1258c664ca741a1b0966445b79)), closes [#62](https://github.com/allxsmith/bestax/issues/62)

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
