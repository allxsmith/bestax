## Documentation Area

Which area of the documentation does this relate to?

- [x] Guides (`/docs/docs/guides`)
- [ ] API Reference (`/docs/docs/api`)
- [ ] Blog (`/docs/blog`)
- [ ] Other (please specify):

---

## Page(s) or Section(s) Affected

Top-level documentation structure and Getting Started section (`/docs/docs/`)

---

## Describe the Issue or Suggestion

The current documentation structure needs to be expanded and reorganized to provide a more comprehensive and intuitive navigation experience for users. The Getting Started section should be expanded with detailed guides, and the overall menu structure should be reorganized to better categorize different aspects of the library.

Currently, the documentation lacks clear organization and comprehensive coverage of key topics like installation alternatives, configuration options, theming capabilities, and component categorization.

---

## Suggested Change(s)

Implement a new four-tier documentation structure:

**Getting Started**

- Installation
  create an installation.md with heading below and following the details i provided below

  # Installation

  This should be a guide that covers how to (following my README.md)
  - Install the package
  - Install bulma
  - Import bulma css
  - Or instead of installing and importing bulma, it should cover adding the css from a cdn to your html
  - Optional, but recommended, install a Icon library
    - Fontawesome Free
    - Install fontawesome-free
    - importing fontawesome-free all.min.css
  - Quick example - this should be an App.js that imports bulma css, imports fontawesome, and has a Button example with an Icon.

  This guide also needs to include details about pre-requisites in index.html that are mentioned here: https://bulma.io/documentation/start/overview/

- Bulma Variations
  create an bulma-variations.md following the details below

  # Bulma Variations

  This section should list the different bulma versions from https://bulma.io/documentation/start/alternative-versions/

  The key difference, is I don't want a download with the css to donwload. I want you to list the import statements. For instance

  Complete (Library + Helpers, recommended)
  Prefix=none
  Import statement
  import 'bulma/css/bulma.min.css';

  Usage
  Provide the usage example from above

  Prefixed
  Prefix=bulma-
  Import statement
  import 'bulma/css/versions/bulma-prefixed.min.css';
  Usage
  see example in docs/docs/api/helpers/config.md

  Library only (No Helpers)
  AI you fill in the details

  No Helpers, Prefixed
  Prefix=bulma-
  AI you fill in the details

  No Dark Mode (light mode only)
  AI you fill in the details

  Custom Brand (custom prefix)
  AI you fill in the details, while looking at https://bestax.io/blog/prefixed-bulma-and-theming#custom-prefix-support

  Other Icons
  - Material Design Icons
  - Install material design icons
  - importing material design icons
  - Ionicons
  - Installing
  - importing

- React Setups
  create a react-setups.md and fill in details below

  # React Setups

  In this section I want you to show sections detailing setup with

  ## Vite + React + bulma + bestax-bulma

  JS and TS examples

  ## Next.js

  JS and TS examples

  ## CRA and other Legacy bundlers

  JS and TS examples

  ## SSR

  ## Troubleshooting

- Syntax
- Tree Shaking
- Responsiveness
- Migration

**Features**

- Configuration
- Theming
- CSS Variables
- Sass
- Bulma V1

**Library**

- Elements
- Components
- Form
- Columns
- Grid
- Layout

**Helpers**

- Color
- Margin & Padding
- Typography
- Visibility
- Flex
- Other

Each section should include comprehensive guides with examples, code snippets, and best practices. This structure will help users progress from basic setup through advanced features and provide clear reference sections for components and utilities.

---

## Additional Context

This restructure will:

1. Improve user onboarding with a clear Getting Started path
2. Provide better discoverability of advanced features
3. Create logical groupings for components and utilities
4. Support the new v2.0.0 features (theming, configuration) with dedicated sections
5. Make the documentation more maintainable and scalable

The new structure should align with the capabilities introduced in v2.0.0, particularly the theming and configuration features that are now core to the library's value proposition.
