---
title: Theme
sidebar_label: Theme
sidebar_position: 3
---

# Theme

## Overview

The `Theme` component provides a powerful way to customize Bulma's appearance using CSS custom properties (CSS variables). It allows you to override Bulma's design tokens like colors, spacing, typography, and other visual properties either globally or locally within specific component trees. The Theme component supports both CSS variable injection via props and direct CSS variable objects.

---

## Import

```tsx
import { Theme } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                     | Description                                                                                                                      |
| ----------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `children`  | `ReactNode`              | The child components to apply the theme to.                                                                                      |
| `className` | `string`                 | Additional CSS classes for the theme wrapper.                                                                                    |
| `isRoot`    | `boolean`                | When `true`, applies CSS variables globally at `:root` level. When `false` (default), applies variables only to the wrapper div. |
| `bulmaVars` | `Record<string, string>` | Object containing CSS custom properties as key-value pairs (e.g., `{'--bulma-primary-h': '210'}`).                               |

### CSS Variable Props

The Theme component accepts individual CSS variable props that correspond to Bulma's design tokens. These props are automatically converted to their corresponding CSS custom properties (e.g., `primaryH` → `--bulma-primary-h`).

#### Scheme Variables

| Prop                     | Type     | Description                                       | CSS Variable                        |
| ------------------------ | -------- | ------------------------------------------------- | ----------------------------------- |
| `schemeH`                | `string` | Base hue for the color scheme (0-360)             | `--bulma-scheme-h`                  |
| `schemeS`                | `string` | Base saturation for the color scheme (percentage) | `--bulma-scheme-s`                  |
| `lightL`                 | `string` | Lightness value for light backgrounds             | `--bulma-light-l`                   |
| `lightInvertL`           | `string` | Inverted lightness for light backgrounds          | `--bulma-light-invert-l`            |
| `darkL`                  | `string` | Lightness value for dark backgrounds              | `--bulma-dark-l`                    |
| `darkInvertL`            | `string` | Inverted lightness for dark backgrounds           | `--bulma-dark-invert-l`             |
| `softL`                  | `string` | Lightness value for soft colors                   | `--bulma-soft-l`                    |
| `boldL`                  | `string` | Lightness value for bold colors                   | `--bulma-bold-l`                    |
| `softInvertL`            | `string` | Inverted lightness for soft colors                | `--bulma-soft-invert-l`             |
| `boldInvertL`            | `string` | Inverted lightness for bold colors                | `--bulma-bold-invert-l`             |
| `hoverBackgroundLDelta`  | `string` | Lightness delta for hover background states       | `--bulma-hover-background-l-delta`  |
| `activeBackgroundLDelta` | `string` | Lightness delta for active background states      | `--bulma-active-background-l-delta` |
| `hoverBorderLDelta`      | `string` | Lightness delta for hover border states           | `--bulma-hover-border-l-delta`      |
| `activeBorderLDelta`     | `string` | Lightness delta for active border states          | `--bulma-active-border-l-delta`     |
| `hoverColorLDelta`       | `string` | Lightness delta for hover text color states       | `--bulma-hover-color-l-delta`       |
| `activeColorLDelta`      | `string` | Lightness delta for active text color states      | `--bulma-active-color-l-delta`      |
| `hoverShadowADelta`      | `string` | Alpha delta for hover shadow states               | `--bulma-hover-shadow-a-delta`      |
| `activeShadowADelta`     | `string` | Alpha delta for active shadow states              | `--bulma-active-shadow-a-delta`     |

#### Color Variables

| Prop       | Type     | Description                           | CSS Variable        |
| ---------- | -------- | ------------------------------------- | ------------------- |
| `primaryH` | `string` | Primary color hue (0-360)             | `--bulma-primary-h` |
| `primaryS` | `string` | Primary color saturation (percentage) | `--bulma-primary-s` |
| `primaryL` | `string` | Primary color lightness (percentage)  | `--bulma-primary-l` |
| `linkH`    | `string` | Link color hue (0-360)                | `--bulma-link-h`    |
| `linkS`    | `string` | Link color saturation (percentage)    | `--bulma-link-s`    |
| `linkL`    | `string` | Link color lightness (percentage)     | `--bulma-link-l`    |
| `infoH`    | `string` | Info color hue (0-360)                | `--bulma-info-h`    |
| `infoS`    | `string` | Info color saturation (percentage)    | `--bulma-info-s`    |
| `infoL`    | `string` | Info color lightness (percentage)     | `--bulma-info-l`    |
| `successH` | `string` | Success color hue (0-360)             | `--bulma-success-h` |
| `successS` | `string` | Success color saturation (percentage) | `--bulma-success-s` |
| `successL` | `string` | Success color lightness (percentage)  | `--bulma-success-l` |
| `warningH` | `string` | Warning color hue (0-360)             | `--bulma-warning-h` |
| `warningS` | `string` | Warning color saturation (percentage) | `--bulma-warning-s` |
| `warningL` | `string` | Warning color lightness (percentage)  | `--bulma-warning-l` |
| `dangerH`  | `string` | Danger color hue (0-360)              | `--bulma-danger-h`  |
| `dangerS`  | `string` | Danger color saturation (percentage)  | `--bulma-danger-s`  |
| `dangerL`  | `string` | Danger color lightness (percentage)   | `--bulma-danger-l`  |

#### Complete CSS Variables List

The Theme component supports all 500+ Bulma CSS variables through the `bulmaVars` prop and individual props:

**Typography Variables:**

- `--bulma-family-primary`, `--bulma-family-secondary`, `--bulma-family-code`
- `--bulma-size-small`, `--bulma-size-normal`, `--bulma-size-medium`, `--bulma-size-large`
- `--bulma-weight-light`, `--bulma-weight-normal`, `--bulma-weight-medium`, `--bulma-weight-semibold`, `--bulma-weight-bold`, `--bulma-weight-extrabold`
- `--bulma-body-background-color`, `--bulma-body-size`, `--bulma-body-min-width`, `--bulma-body-rendering`
- `--bulma-body-family`, `--bulma-body-overflow-x`, `--bulma-body-overflow-y`, `--bulma-body-color`
- `--bulma-body-font-size`, `--bulma-body-weight`, `--bulma-body-line-height`
- `--bulma-code-family`, `--bulma-code-padding`, `--bulma-code-weight`, `--bulma-code-size`
- `--bulma-small-font-size`, `--bulma-hr-background-color`, `--bulma-hr-height`, `--bulma-hr-margin`
- `--bulma-strong-color`, `--bulma-strong-weight`, `--bulma-pre-font-size`, `--bulma-pre-padding`, `--bulma-pre-code-font-size`

**Layout & Spacing Variables:**

- `--bulma-block-spacing`, `--bulma-duration`, `--bulma-easing`, `--bulma-speed`
- `--bulma-radius-small`, `--bulma-radius`, `--bulma-radius-medium`, `--bulma-radius-large`, `--bulma-radius-rounded`
- `--bulma-arrow-color`, `--bulma-loading-color`
- `--bulma-column-gap`, `--bulma-grid-gap`, `--bulma-grid-column-count`, `--bulma-grid-column-min`
- `--bulma-grid-cell-column-span`, `--bulma-grid-cell-column-start`

**Box Variables:**

- `--bulma-box-background-color`, `--bulma-box-color`, `--bulma-box-radius`, `--bulma-box-shadow`
- `--bulma-box-padding`, `--bulma-box-link-hover-shadow`, `--bulma-box-link-active-shadow`

**Breadcrumb Variables:**

- `--bulma-breadcrumb-item-color`, `--bulma-breadcrumb-item-hover-color`, `--bulma-breadcrumb-item-active-color`
- `--bulma-breadcrumb-item-padding-vertical`, `--bulma-breadcrumb-item-padding-horizontal`
- `--bulma-breadcrumb-item-separator-color`

**Card Variables:**

- `--bulma-card-color`, `--bulma-card-background-color`, `--bulma-card-shadow`, `--bulma-card-radius`
- `--bulma-card-header-background-color`, `--bulma-card-header-color`, `--bulma-card-header-padding`
- `--bulma-card-header-shadow`, `--bulma-card-header-weight`
- `--bulma-card-content-background-color`, `--bulma-card-content-padding`
- `--bulma-card-footer-background-color`, `--bulma-card-footer-border-top`, `--bulma-card-footer-padding`
- `--bulma-card-media-margin`

**Dropdown Variables:**

- `--bulma-dropdown-menu-min-width`, `--bulma-dropdown-content-background-color`
- `--bulma-dropdown-content-offset`, `--bulma-dropdown-content-padding-bottom`
- `--bulma-dropdown-content-padding-top`, `--bulma-dropdown-content-radius`
- `--bulma-dropdown-content-shadow`, `--bulma-dropdown-content-z`
- `--bulma-dropdown-item-h`, `--bulma-dropdown-item-s`, `--bulma-dropdown-item-l`
- `--bulma-dropdown-item-background-l`, `--bulma-dropdown-item-background-l-delta`
- `--bulma-dropdown-item-hover-background-l-delta`, `--bulma-dropdown-item-active-background-l-delta`
- `--bulma-dropdown-item-color-l`, `--bulma-dropdown-item-selected-h`
- `--bulma-dropdown-item-selected-s`, `--bulma-dropdown-item-selected-l`
- `--bulma-dropdown-item-selected-background-l`, `--bulma-dropdown-item-selected-color-l`
- `--bulma-dropdown-divider-background-color`

**Input Variables:**

- `--bulma-input-h`, `--bulma-input-s`, `--bulma-input-l`, `--bulma-input-border-style`
- `--bulma-input-border-l`, `--bulma-input-border-l-delta`, `--bulma-input-hover-border-l-delta`
- `--bulma-input-active-border-l-delta`, `--bulma-input-focus-h`, `--bulma-input-focus-s`
- `--bulma-input-focus-l`, `--bulma-input-focus-shadow-size`, `--bulma-input-focus-shadow-alpha`
- `--bulma-input-color-l`, `--bulma-input-background-l`, `--bulma-input-background-l-delta`
- `--bulma-input-height`, `--bulma-input-shadow`, `--bulma-input-placeholder-color`
- `--bulma-input-disabled-color`, `--bulma-input-disabled-background-color`
- `--bulma-input-disabled-border-color`, `--bulma-input-disabled-placeholder-color`
- `--bulma-input-arrow`, `--bulma-input-icon-color`, `--bulma-input-icon-hover-color`
- `--bulma-input-icon-focus-color`, `--bulma-input-radius`

**Menu Variables:**

- `--bulma-menu-item-h`, `--bulma-menu-item-s`, `--bulma-menu-item-l`
- `--bulma-menu-item-background-l`, `--bulma-menu-item-background-l-delta`
- `--bulma-menu-item-hover-background-l-delta`, `--bulma-menu-item-active-background-l-delta`
- `--bulma-menu-item-color-l`, `--bulma-menu-item-radius`
- `--bulma-menu-item-selected-h`, `--bulma-menu-item-selected-s`, `--bulma-menu-item-selected-l`
- `--bulma-menu-item-selected-background-l`, `--bulma-menu-item-selected-color-l`
- `--bulma-menu-list-border-left`, `--bulma-menu-list-line-height`, `--bulma-menu-list-link-padding`
- `--bulma-menu-nested-list-margin`, `--bulma-menu-nested-list-padding-left`
- `--bulma-menu-label-color`, `--bulma-menu-label-font-size`, `--bulma-menu-label-letter-spacing`
- `--bulma-menu-label-spacing`

**Message Variables:**

- `--bulma-message-h`, `--bulma-message-s`, `--bulma-message-background-l`
- `--bulma-message-border-l`, `--bulma-message-border-l-delta`, `--bulma-message-border-style`
- `--bulma-message-border-width`, `--bulma-message-color-l`, `--bulma-message-radius`
- `--bulma-message-header-weight`, `--bulma-message-header-padding`, `--bulma-message-header-radius`
- `--bulma-message-header-body-border-width`, `--bulma-message-header-background-l`
- `--bulma-message-header-color-l`, `--bulma-message-body-border-width`
- `--bulma-message-body-color`, `--bulma-message-body-padding`, `--bulma-message-body-radius`
- `--bulma-message-body-pre-code-background-color`

**Modal Variables:**

- `--bulma-modal-z`, `--bulma-modal-background-background-color`, `--bulma-modal-content-width`
- `--bulma-modal-content-margin-mobile`, `--bulma-modal-content-spacing-mobile`
- `--bulma-modal-content-spacing-tablet`, `--bulma-modal-close-dimensions`
- `--bulma-modal-close-right`, `--bulma-modal-close-top`, `--bulma-modal-card-spacing`
- `--bulma-modal-card-head-background-color`, `--bulma-modal-card-head-padding`
- `--bulma-modal-card-head-radius`, `--bulma-modal-card-title-color`
- `--bulma-modal-card-title-line-height`, `--bulma-modal-card-title-size`
- `--bulma-modal-card-foot-background-color`, `--bulma-modal-card-foot-radius`
- `--bulma-modal-card-body-background-color`, `--bulma-modal-card-body-padding`

**Navbar Variables:**

- `--bulma-navbar-h`, `--bulma-navbar-s`, `--bulma-navbar-l`, `--bulma-navbar-background-color`
- `--bulma-navbar-box-shadow-size`, `--bulma-navbar-box-shadow-color`
- `--bulma-navbar-padding-vertical`, `--bulma-navbar-padding-horizontal`
- `--bulma-navbar-z`, `--bulma-navbar-fixed-z`, `--bulma-navbar-item-background-a`
- `--bulma-navbar-item-background-l`, `--bulma-navbar-item-background-l-delta`
- `--bulma-navbar-item-hover-background-l-delta`, `--bulma-navbar-item-active-background-l-delta`
- `--bulma-navbar-item-color-l`, `--bulma-navbar-item-selected-h`
- `--bulma-navbar-item-selected-s`, `--bulma-navbar-item-selected-l`
- `--bulma-navbar-item-selected-background-l`, `--bulma-navbar-item-selected-color-l`
- `--bulma-navbar-item-img-max-height`, `--bulma-navbar-burger-color`
- `--bulma-navbar-tab-hover-background-color`, `--bulma-navbar-tab-hover-border-bottom-color`
- `--bulma-navbar-tab-active-color`, `--bulma-navbar-tab-active-background-color`
- `--bulma-navbar-tab-active-border-bottom-color`, `--bulma-navbar-tab-active-border-bottom-style`
- `--bulma-navbar-tab-active-border-bottom-width`, `--bulma-navbar-dropdown-background-color`
- `--bulma-navbar-dropdown-border-l`, `--bulma-navbar-dropdown-border-color`
- `--bulma-navbar-dropdown-border-style`, `--bulma-navbar-dropdown-border-width`
- `--bulma-navbar-dropdown-offset`, `--bulma-navbar-dropdown-arrow`
- `--bulma-navbar-dropdown-radius`, `--bulma-navbar-dropdown-z`
- `--bulma-navbar-dropdown-boxed-radius`, `--bulma-navbar-dropdown-boxed-shadow`
- `--bulma-navbar-dropdown-item-h`, `--bulma-navbar-dropdown-item-s`
- `--bulma-navbar-dropdown-item-l`, `--bulma-navbar-dropdown-item-background-l`
- `--bulma-navbar-dropdown-item-color-l`, `--bulma-navbar-divider-background-l`
- `--bulma-navbar-divider-height`, `--bulma-navbar-bottom-box-shadow-size`

**Notification Variables:**

- `--bulma-notification-h`, `--bulma-notification-s`, `--bulma-notification-background-l`
- `--bulma-notification-color-l`, `--bulma-notification-code-background-color`
- `--bulma-notification-radius`, `--bulma-notification-padding`

**Pagination Variables:**

- `--bulma-pagination-margin`, `--bulma-pagination-min-width`
- `--bulma-pagination-item-h`, `--bulma-pagination-item-s`, `--bulma-pagination-item-l`
- `--bulma-pagination-item-background-l-delta`, `--bulma-pagination-item-hover-background-l-delta`
- `--bulma-pagination-item-active-background-l-delta`, `--bulma-pagination-item-border-style`
- `--bulma-pagination-item-border-width`, `--bulma-pagination-item-border-l`
- `--bulma-pagination-item-border-l-delta`, `--bulma-pagination-item-hover-border-l-delta`
- `--bulma-pagination-item-active-border-l-delta`, `--bulma-pagination-item-focus-border-l-delta`
- `--bulma-pagination-item-color-l`, `--bulma-pagination-item-font-size`
- `--bulma-pagination-item-margin`, `--bulma-pagination-item-padding-left`
- `--bulma-pagination-item-padding-right`, `--bulma-pagination-item-outer-shadow-h`
- `--bulma-pagination-item-outer-shadow-s`, `--bulma-pagination-item-outer-shadow-l`
- `--bulma-pagination-item-outer-shadow-a`, `--bulma-pagination-nav-padding-left`
- `--bulma-pagination-nav-padding-right`, `--bulma-pagination-disabled-color`
- `--bulma-pagination-disabled-background-color`, `--bulma-pagination-disabled-border-color`
- `--bulma-pagination-current-color`, `--bulma-pagination-current-background-color`
- `--bulma-pagination-current-border-color`, `--bulma-pagination-ellipsis-color`
- `--bulma-pagination-shadow-inset`, `--bulma-pagination-selected-item-h`
- `--bulma-pagination-selected-item-s`, `--bulma-pagination-selected-item-l`
- `--bulma-pagination-selected-item-background-l`, `--bulma-pagination-selected-item-border-l`
- `--bulma-pagination-selected-item-color-l`

**Panel Variables:**

- `--bulma-panel-margin`, `--bulma-panel-item-border`, `--bulma-panel-radius`, `--bulma-panel-shadow`
- `--bulma-panel-heading-line-height`, `--bulma-panel-heading-padding`, `--bulma-panel-heading-radius`
- `--bulma-panel-heading-size`, `--bulma-panel-heading-weight`, `--bulma-panel-tabs-font-size`
- `--bulma-panel-tab-border-bottom-color`, `--bulma-panel-tab-border-bottom-style`
- `--bulma-panel-tab-border-bottom-width`, `--bulma-panel-tab-active-color`
- `--bulma-panel-list-item-color`, `--bulma-panel-list-item-hover-color`
- `--bulma-panel-block-color`, `--bulma-panel-block-hover-background-color`
- `--bulma-panel-block-active-border-left-color`, `--bulma-panel-block-active-color`
- `--bulma-panel-block-active-icon-color`, `--bulma-panel-icon-color`

**Progress Variables:**

- `--bulma-progress-border-radius`, `--bulma-progress-bar-background-color`
- `--bulma-progress-value-background-color`, `--bulma-progress-indeterminate-duration`

**Skeleton Variables:**

- `--bulma-skeleton-background`, `--bulma-skeleton-radius`, `--bulma-skeleton-block-min-height`
- `--bulma-skeleton-lines-gap`, `--bulma-skeleton-line-height`

**Table Variables:**

- `--bulma-table-color`, `--bulma-table-background-color`, `--bulma-table-cell-border-color`
- `--bulma-table-cell-border-style`, `--bulma-table-cell-border-width`, `--bulma-table-cell-padding`
- `--bulma-table-cell-heading-color`, `--bulma-table-cell-text-align`
- `--bulma-table-head-cell-border-width`, `--bulma-table-head-cell-color`
- `--bulma-table-foot-cell-border-width`, `--bulma-table-foot-cell-color`
- `--bulma-table-head-background-color`, `--bulma-table-body-background-color`
- `--bulma-table-foot-background-color`, `--bulma-table-row-hover-background-color`
- `--bulma-table-row-active-background-color`, `--bulma-table-row-active-color`
- `--bulma-table-striped-row-even-background-color`, `--bulma-table-striped-row-even-hover-background-color`

**Tabs Variables:**

- `--bulma-tabs-border-bottom-color`, `--bulma-tabs-border-bottom-style`, `--bulma-tabs-border-bottom-width`
- `--bulma-tabs-link-color`, `--bulma-tabs-link-hover-border-bottom-color`, `--bulma-tabs-link-hover-color`
- `--bulma-tabs-link-active-border-bottom-color`, `--bulma-tabs-link-active-color`, `--bulma-tabs-link-padding`
- `--bulma-tabs-boxed-link-radius`, `--bulma-tabs-boxed-link-hover-background-color`
- `--bulma-tabs-boxed-link-hover-border-bottom-color`, `--bulma-tabs-boxed-link-active-background-color`
- `--bulma-tabs-boxed-link-active-border-color`, `--bulma-tabs-boxed-link-active-border-bottom-color`
- `--bulma-tabs-toggle-link-border-color`, `--bulma-tabs-toggle-link-border-style`
- `--bulma-tabs-toggle-link-border-width`, `--bulma-tabs-toggle-link-hover-background-color`
- `--bulma-tabs-toggle-link-hover-border-color`, `--bulma-tabs-toggle-link-radius`
- `--bulma-tabs-toggle-link-active-background-color`, `--bulma-tabs-toggle-link-active-border-color`
- `--bulma-tabs-toggle-link-active-color`

**Tag Variables:**

- `--bulma-tag-h`, `--bulma-tag-s`, `--bulma-tag-background-l`, `--bulma-tag-background-l-delta`
- `--bulma-tag-hover-background-l-delta`, `--bulma-tag-active-background-l-delta`
- `--bulma-tag-color-l`, `--bulma-tag-radius`, `--bulma-tag-delete-margin`

**Title & Subtitle Variables:**

- `--bulma-title-color`, `--bulma-title-family`, `--bulma-title-size`, `--bulma-title-weight`
- `--bulma-title-line-height`, `--bulma-title-strong-color`, `--bulma-title-strong-weight`
- `--bulma-title-sub-size`, `--bulma-title-sup-size`
- `--bulma-subtitle-color`, `--bulma-subtitle-family`, `--bulma-subtitle-size`, `--bulma-subtitle-weight`
- `--bulma-subtitle-line-height`, `--bulma-subtitle-strong-color`, `--bulma-subtitle-strong-weight`

**Content Variables:**

- `--bulma-content-heading-color`, `--bulma-content-heading-weight`, `--bulma-content-heading-line-height`
- `--bulma-content-block-margin-bottom`, `--bulma-content-blockquote-background-color`
- `--bulma-content-blockquote-border-left`, `--bulma-content-blockquote-padding`, `--bulma-content-pre-padding`
- `--bulma-content-table-cell-border`, `--bulma-content-table-cell-border-width`
- `--bulma-content-table-cell-padding`, `--bulma-content-table-cell-heading-color`
- `--bulma-content-table-head-cell-border-width`, `--bulma-content-table-head-cell-color`
- `--bulma-content-table-body-last-row-cell-border-bottom-width`
- `--bulma-content-table-foot-cell-border-width`, `--bulma-content-table-foot-cell-color`

**Control Variables:**

- `--bulma-control-radius`, `--bulma-control-radius-small`, `--bulma-control-border-width`
- `--bulma-control-height`, `--bulma-control-line-height`, `--bulma-control-padding-vertical`
- `--bulma-control-padding-horizontal`, `--bulma-control-size`, `--bulma-control-focus-shadow-l`

**Delete Variables:**

- `--bulma-delete-dimensions`, `--bulma-delete-background-l`, `--bulma-delete-background-alpha`
- `--bulma-delete-color`

**File Variables:**

- `--bulma-file-radius`, `--bulma-file-name-border-color`, `--bulma-file-name-border-style`
- `--bulma-file-name-border-width`, `--bulma-file-name-max-width`
- `--bulma-file-h`, `--bulma-file-s`, `--bulma-file-background-l`, `--bulma-file-background-l-delta`
- `--bulma-file-hover-background-l-delta`, `--bulma-file-active-background-l-delta`
- `--bulma-file-border-l`, `--bulma-file-border-l-delta`, `--bulma-file-hover-border-l-delta`
- `--bulma-file-active-border-l-delta`, `--bulma-file-cta-color-l`, `--bulma-file-name-color-l`
- `--bulma-file-color-l-delta`, `--bulma-file-hover-color-l-delta`, `--bulma-file-active-color-l-delta`

**Footer Variables:**

- `--bulma-footer-background-color`, `--bulma-footer-color`, `--bulma-footer-padding`

**Hero Variables:**

- `--bulma-hero-body-padding`, `--bulma-hero-body-padding-tablet`, `--bulma-hero-body-padding-small`
- `--bulma-hero-body-padding-medium`, `--bulma-hero-body-padding-large`

**Icon Variables:**

- `--bulma-icon-dimensions`, `--bulma-icon-dimensions-small`, `--bulma-icon-dimensions-medium`
- `--bulma-icon-dimensions-large`, `--bulma-icon-text-spacing`

**Media Variables:**

- `--bulma-media-border-color`, `--bulma-media-border-size`, `--bulma-media-spacing`
- `--bulma-media-spacing-large`, `--bulma-media-content-spacing`, `--bulma-media-level-1-spacing`
- `--bulma-media-level-1-content-spacing`, `--bulma-media-level-2-spacing`

**Section Variables:**

- `--bulma-section-padding`, `--bulma-section-padding-desktop`, `--bulma-section-padding-medium`
- `--bulma-section-padding-large`

**Burger Variables:**

- `--bulma-burger-h`, `--bulma-burger-s`, `--bulma-burger-l`, `--bulma-burger-border-radius`
- `--bulma-burger-gap`, `--bulma-burger-item-height`, `--bulma-burger-item-width`

The Theme component also supports all [Bulma helper class props](./usebulmaclasses.md) for styling the wrapper element.

---

## Usage

### Basic Theme Customization

```tsx
function BasicThemeCustomization() {
  return (
    <Theme primaryH="270" primaryS="100%" primaryL="50%">
      <Box p="4">
        <Button color="primary">Purple Primary Button</Button>
      </Box>
    </Theme>
  );
}
```

### Global Theme (Root Level)

```tsx
function GlobalTheme() {
  return (
    <Theme isRoot={true} primaryH="270" primaryS="100%" primaryL="50%">
      <div>
        <Button color="primary">Global Purple Theme</Button>
        <Button color="info">Info Button</Button>
      </div>
    </Theme>
  );
}
```

### Local Theme (Component Level)

```tsx
function LocalTheme() {
  return (
    <div>
      <Button color="primary">Standard Primary</Button>

      <Theme primaryH="120" primaryS="100%" primaryL="40%">
        <Button color="primary">Green Primary</Button>
      </Theme>

      <Button color="primary">Standard Primary Again</Button>
    </div>
  );
}
```

### Using CSS Variables Object

```tsx
function SunsetTheme() {
  const sunsetTheme = {
    '--bulma-scheme-h': '18',
    '--bulma-scheme-s': '90%',
    '--bulma-light-l': '85%',
    '--bulma-dark-l': '20%',
    '--bulma-primary-h': '25',
    '--bulma-primary-s': '85%',
    '--bulma-primary-l': '55%',
  };

  return (
    <Theme bulmaVars={sunsetTheme} isRoot>
      <Box p="4">
        <Title>Sunset Theme</Title>
        <Button color="primary">Sunset Button</Button>
        <Button color="info">Info Button</Button>
      </Box>
    </Theme>
  );
}
```

### Advanced CSS Variables Usage

```tsx
function TypographyTheme() {
  const typographyTheme = {
    '--bulma-family-primary': '"Helvetica Neue", sans-serif',
    '--bulma-family-code': '"Fira Code", monospace',
    '--bulma-size-normal': '16px',
    '--bulma-weight-bold': '700',
    '--bulma-title-color': 'hsl(0, 0%, 21%)',
    '--bulma-subtitle-color': 'hsl(0, 0%, 48%)',
  };

  return (
    <Theme bulmaVars={typographyTheme}>
      <Title>Custom Typography</Title>
      <Subtitle>With custom fonts and weights</Subtitle>
    </Theme>
  );
}
```

```tsx
function CustomButtonTheme() {
  const customButton = {
    '--bulma-button-border-radius': '12px',
    '--bulma-button-padding-vertical': '0.75rem',
    '--bulma-button-padding-horizontal': '1.5rem',
    '--bulma-button-focus-box-shadow-size': '0 0 0 0.2rem',
    '--bulma-button-focus-box-shadow-color': 'rgba(72, 95, 199, 0.25)',
  };

  return (
    <Theme bulmaVars={customButton}>
      <Button color="primary">Custom Styled Button</Button>
    </Theme>
  );
}
```

```tsx
function SpacingTheme() {
  const spacingTheme = {
    '--bulma-block-spacing': '2rem',
    '--bulma-column-gap': '1rem',
    '--bulma-section-padding': '4rem 1.5rem',
    '--bulma-box-padding': '2rem',
    '--bulma-card-content-padding': '2rem',
  };

  return (
    <Theme bulmaVars={spacingTheme}>
      <Section>
        <Columns>
          <Column>
            <Box>Content with custom spacing</Box>
          </Column>
          <Column>
            <Card>
              <CardContent>Custom card padding</CardContent>
            </Card>
          </Column>
        </Columns>
      </Section>
    </Theme>
  );
}
```

### Complete Color Scheme

```tsx
function ForestTheme() {
  const forestScheme = {
    schemeH: '150', // forest green hue
    schemeS: '50%',
    lightL: '80%',
    lightInvertL: '20%',
    darkL: '18%',
    darkInvertL: '85%',
    softL: '55%',
    boldL: '35%',
    primaryH: '160',
    primaryS: '60%',
    primaryL: '45%',
    linkH: '155',
    linkS: '65%',
    linkL: '40%',
    successH: '120',
    successS: '70%',
    successL: '45%',
    warningH: '45',
    warningS: '85%',
    warningL: '55%',
    dangerH: '355',
    dangerS: '75%',
    dangerL: '50%',
    hoverBackgroundLDelta: '4%',
    activeBackgroundLDelta: '8%',
  };

  return (
    <Theme {...forestScheme} isRoot>
      <Box p="4">
        <Title>Forest Theme</Title>
        <Button color="primary">Forest Primary</Button>
        <Button color="success">Success</Button>
        <Button color="info">Info</Button>
        <Button color="warning">Warning</Button>
        <Button color="danger">Danger</Button>
      </Box>
    </Theme>
  );
}
```

````

### Theme with Styling

```tsx
function StyledTheme() {
  return (
    <Theme
      className="custom-theme-wrapper"
      primaryH="45"
      primaryS="100%"
      primaryL="50%"
      p="5"
      m="3"
      textAlign="centered"
      backgroundColor="light"
    >
      <Title>Styled Theme Container</Title>
      <Button color="primary">Styled Button</Button>
    </Theme>
  );
}
````

### Nested Themes

```tsx
function NestedThemes() {
  return (
    <Theme primaryH="210" primaryS="60%" primaryL="45%" p="4">
      <Title>Outer Theme (Blue)</Title>
      <Button color="primary">Blue Primary</Button>

      <Theme
        primaryH="120"
        primaryS="70%"
        primaryL="40%"
        p="3"
        mt="4"
        backgroundColor="light"
      >
        <Title size="4">Inner Theme (Green)</Title>
        <Button color="primary">Green Primary</Button>
      </Theme>

      <Button color="primary" mt="3">
        Blue Primary Again
      </Button>
    </Theme>
  );
}
```

### Theme with ConfigProvider

```tsx
function PrefixedTheme() {
  return (
    <ConfigProvider classPrefix="bulma-">
      <Theme primaryH="300" primaryS="80%" primaryL="50%" isRoot>
        <Button color="primary">Prefixed & Themed Button</Button>
      </Theme>
    </ConfigProvider>
  );
}
```

---

## Best Practices

### Global vs Local Themes

- Use `isRoot={true}` for application-wide themes that should affect all components
- Use local themes (default `isRoot={false}`) for component-specific styling or theme variations
- Local themes inherit from parent themes and can override specific variables

### CSS Variable Naming

- All Bulma CSS variables follow the `--bulma-*` naming convention
- Use the `bulmaVars` prop when you need to set variables not covered by individual props
- Individual props (like `primaryH`) are converted to their corresponding CSS variable names

### Performance Considerations

- Prefer setting themes at higher levels in your component tree rather than deeply nested
- Use `isRoot={true}` sparingly to avoid CSS specificity issues
- CSS variables are inherited, so child themes only need to override specific variables

### Color System

- Bulma uses HSL (Hue, Saturation, Lightness) for its color system
- Hue values range from 0-360 (color wheel degrees)
- Saturation and Lightness are typically percentages (e.g., '50%')
- The scheme variables control the base color relationships

---

## API Reference

### Prop to CSS Variable Conversion

The Theme component automatically converts camelCase prop names to their corresponding CSS custom property names using the following pattern:

```
propName → --bulma-prop-name
```

**Examples:**

- `primaryH` → `--bulma-primary-h`
- `schemeS` → `--bulma-scheme-s`
- `lightL` → `--bulma-light-l`
- `hoverBackgroundLDelta` → `--bulma-hover-background-l-delta`
- `cardContentPadding` → `--bulma-card-content-padding`

### Prop vs bulmaVars

You can use CSS variables in two ways:

1. **Individual Props** (recommended for commonly used variables):

   ```tsx
   <Theme primaryH="270" primaryS="100%" primaryL="50%" />
   ```

2. **bulmaVars Object** (for less common variables or when you have many variables):

   ```tsx
   <Theme
     bulmaVars={{
       '--bulma-primary-h': '270',
       '--bulma-primary-s': '100%',
       '--bulma-primary-l': '50%',
       '--bulma-card-content-padding': '2rem',
     }}
   />
   ```

3. **Combined** (props take precedence over bulmaVars):
   ```tsx
   <Theme
     primaryH="270" // This takes precedence
     bulmaVars={{
       '--bulma-primary-h': '180', // This is overridden
       '--bulma-card-content-padding': '2rem',
     }}
   />
   ```

### All Supported Props

The Theme component supports props for all 500+ Bulma CSS variables. Here's the complete list organized by category:

**Scheme & Base Color Props:**

- `schemeH`, `schemeS`, `lightL`, `lightInvertL`, `darkL`, `darkInvertL`
- `softL`, `boldL`, `softInvertL`, `boldInvertL`
- `hoverBackgroundLDelta`, `activeBackgroundLDelta`, `hoverBorderLDelta`, `activeBorderLDelta`
- `hoverColorLDelta`, `activeColorLDelta`, `hoverShadowADelta`, `activeShadowADelta`

**Color Props:**

- `primaryH`, `primaryS`, `primaryL`, `linkH`, `linkS`, `linkL`
- `infoH`, `infoS`, `infoL`, `successH`, `successS`, `successL`
- `warningH`, `warningS`, `warningL`, `dangerH`, `dangerS`, `dangerL`

**Typography Props:**

- `familyPrimary`, `familySecondary`, `familyCode`
- `sizeSmall`, `sizeNormal`, `sizeMedium`, `sizeLarge`
- `weightLight`, `weightNormal`, `weightMedium`, `weightSemibold`, `weightBold`, `weightExtrabold`
- `bodyBackgroundColor`, `bodySize`, `bodyMinWidth`, `bodyRendering`, `bodyFamily`
- `bodyOverflowX`, `bodyOverflowY`, `bodyColor`, `bodyFontSize`, `bodyWeight`, `bodyLineHeight`
- `codeFamily`, `codePadding`, `codeWeight`, `codeSize`, `smallFontSize`
- `hrBackgroundColor`, `hrHeight`, `hrMargin`, `strongColor`, `strongWeight`
- `preFontSize`, `prePadding`, `preCodeFontSize`

**Layout & Spacing Props:**

- `blockSpacing`, `duration`, `easing`, `speed`, `arrowColor`, `loadingColor`
- `radiusSmall`, `radius`, `radiusMedium`, `radiusLarge`, `radiusRounded`
- `columnGap`, `gridGap`, `gridColumnCount`, `gridColumnMin`
- `gridCellColumnSpan`, `gridCellColumnStart`

**Box Props:**

- `boxBackgroundColor`, `boxColor`, `boxRadius`, `boxShadow`, `boxPadding`
- `boxLinkHoverShadow`, `boxLinkActiveShadow`

**Breadcrumb Props:**

- `breadcrumbItemColor`, `breadcrumbItemHoverColor`, `breadcrumbItemActiveColor`
- `breadcrumbItemPaddingVertical`, `breadcrumbItemPaddingHorizontal`, `breadcrumbItemSeparatorColor`

**Burger Props:**

- `burgerH`, `burgerS`, `burgerL`, `burgerBorderRadius`, `burgerGap`
- `burgerItemHeight`, `burgerItemWidth`

**Card Props:**

- `cardColor`, `cardBackgroundColor`, `cardShadow`, `cardRadius`
- `cardHeaderBackgroundColor`, `cardHeaderColor`, `cardHeaderPadding`
- `cardHeaderShadow`, `cardHeaderWeight`, `cardContentBackgroundColor`
- `cardContentPadding`, `cardFooterBackgroundColor`, `cardFooterBorderTop`
- `cardFooterPadding`, `cardMediaMargin`

**Content Props:**

- `contentHeadingColor`, `contentHeadingWeight`, `contentHeadingLineHeight`
- `contentBlockMarginBottom`, `contentBlockquoteBackgroundColor`, `contentBlockquoteBorderLeft`
- `contentBlockquotePadding`, `contentPrePadding`, `contentTableCellBorder`
- `contentTableCellBorderWidth`, `contentTableCellPadding`, `contentTableCellHeadingColor`
- `contentTableHeadCellBorderWidth`, `contentTableHeadCellColor`
- `contentTableBodyLastRowCellBorderBottomWidth`, `contentTableFootCellBorderWidth`
- `contentTableFootCellColor`

**Control Props:**

- `controlRadius`, `controlRadiusSmall`, `controlBorderWidth`, `controlHeight`
- `controlLineHeight`, `controlPaddingVertical`, `controlPaddingHorizontal`
- `controlSize`, `controlFocusShadowL`

**Delete Props:**

- `deleteDimensions`, `deleteBackgroundL`, `deleteBackgroundAlpha`, `deleteColor`

**Dropdown Props:**

- `dropdownMenuMinWidth`, `dropdownContentBackgroundColor`, `dropdownContentOffset`
- `dropdownContentPaddingBottom`, `dropdownContentPaddingTop`, `dropdownContentRadius`
- `dropdownContentShadow`, `dropdownContentZ`, `dropdownItemH`, `dropdownItemS`
- `dropdownItemL`, `dropdownItemBackgroundL`, `dropdownItemBackgroundLDelta`
- `dropdownItemHoverBackgroundLDelta`, `dropdownItemActiveBackgroundLDelta`
- `dropdownItemColorL`, `dropdownItemSelectedH`, `dropdownItemSelectedS`
- `dropdownItemSelectedL`, `dropdownItemSelectedBackgroundL`, `dropdownItemSelectedColorL`
- `dropdownDividerBackgroundColor`

**File Props:**

- `fileRadius`, `fileNameBorderColor`, `fileNameBorderStyle`, `fileNameBorderWidth`
- `fileNameMaxWidth`, `fileH`, `fileS`, `fileBackgroundL`, `fileBackgroundLDelta`
- `fileHoverBackgroundLDelta`, `fileActiveBackgroundLDelta`, `fileBorderL`
- `fileBorderLDelta`, `fileHoverBorderLDelta`, `fileActiveBorderLDelta`
- `fileCtaColorL`, `fileNameColorL`, `fileColorLDelta`, `fileHoverColorLDelta`
- `fileActiveColorLDelta`

**Footer Props:**

- `footerBackgroundColor`, `footerColor`, `footerPadding`

**Hero Props:**

- `heroBodyPadding`, `heroBodyPaddingTablet`, `heroBodyPaddingSmall`
- `heroBodyPaddingMedium`, `heroBodyPaddingLarge`

**Icon Props:**

- `iconDimensions`, `iconDimensionsSmall`, `iconDimensionsMedium`
- `iconDimensionsLarge`, `iconTextSpacing`

**Input Props:**

- `inputH`, `inputS`, `inputL`, `inputBorderStyle`, `inputBorderL`
- `inputBorderLDelta`, `inputHoverBorderLDelta`, `inputActiveBorderLDelta`
- `inputFocusH`, `inputFocusS`, `inputFocusL`, `inputFocusShadowSize`
- `inputFocusShadowAlpha`, `inputColorL`, `inputBackgroundL`, `inputBackgroundLDelta`
- `inputHeight`, `inputShadow`, `inputPlaceholderColor`, `inputDisabledColor`
- `inputDisabledBackgroundColor`, `inputDisabledBorderColor`, `inputDisabledPlaceholderColor`
- `inputArrow`, `inputIconColor`, `inputIconHoverColor`, `inputIconFocusColor`, `inputRadius`

**Media Props:**

- `mediaBorderColor`, `mediaBorderSize`, `mediaSpacing`, `mediaSpacingLarge`
- `mediaContentSpacing`, `mediaLevel1Spacing`, `mediaLevel1ContentSpacing`, `mediaLevel2Spacing`

**Menu Props:**

- `menuItemH`, `menuItemS`, `menuItemL`, `menuItemBackgroundL`, `menuItemBackgroundLDelta`
- `menuItemHoverBackgroundLDelta`, `menuItemActiveBackgroundLDelta`, `menuItemColorL`
- `menuItemRadius`, `menuItemSelectedH`, `menuItemSelectedS`, `menuItemSelectedL`
- `menuItemSelectedBackgroundL`, `menuItemSelectedColorL`, `menuListBorderLeft`
- `menuListLineHeight`, `menuListLinkPadding`, `menuNestedListMargin`
- `menuNestedListPaddingLeft`, `menuLabelColor`, `menuLabelFontSize`
- `menuLabelLetterSpacing`, `menuLabelSpacing`

**Message Props:**

- `messageH`, `messageS`, `messageBackgroundL`, `messageBorderL`, `messageBorderLDelta`
- `messageBorderStyle`, `messageBorderWidth`, `messageColorL`, `messageRadius`
- `messageHeaderWeight`, `messageHeaderPadding`, `messageHeaderRadius`
- `messageHeaderBodyBorderWidth`, `messageHeaderBackgroundL`, `messageHeaderColorL`
- `messageBodyBorderWidth`, `messageBodyColor`, `messageBodyPadding`
- `messageBodyRadius`, `messageBodyPreCodeBackgroundColor`

**Modal Props:**

- `modalZ`, `modalBackgroundBackgroundColor`, `modalContentWidth`, `modalContentMarginMobile`
- `modalContentSpacingMobile`, `modalContentSpacingTablet`, `modalCloseDimensions`
- `modalCloseRight`, `modalCloseTop`, `modalCardSpacing`, `modalCardHeadBackgroundColor`
- `modalCardHeadPadding`, `modalCardHeadRadius`, `modalCardTitleColor`
- `modalCardTitleLineHeight`, `modalCardTitleSize`, `modalCardFootBackgroundColor`
- `modalCardFootRadius`, `modalCardBodyBackgroundColor`, `modalCardBodyPadding`

**Navbar Props:**

- `navbarH`, `navbarS`, `navbarL`, `navbarBackgroundColor`, `navbarBoxShadowSize`
- `navbarBoxShadowColor`, `navbarPaddingVertical`, `navbarPaddingHorizontal`
- `navbarZ`, `navbarFixedZ`, `navbarItemBackgroundA`, `navbarItemBackgroundL`
- `navbarItemBackgroundLDelta`, `navbarItemHoverBackgroundLDelta`, `navbarItemActiveBackgroundLDelta`
- `navbarItemColorL`, `navbarItemSelectedH`, `navbarItemSelectedS`, `navbarItemSelectedL`
- `navbarItemSelectedBackgroundL`, `navbarItemSelectedColorL`, `navbarItemImgMaxHeight`
- `navbarBurgerColor`, `navbarTabHoverBackgroundColor`, `navbarTabHoverBorderBottomColor`
- `navbarTabActiveColor`, `navbarTabActiveBackgroundColor`, `navbarTabActiveBorderBottomColor`
- `navbarTabActiveBorderBottomStyle`, `navbarTabActiveBorderBottomWidth`
- `navbarDropdownBackgroundColor`, `navbarDropdownBorderL`, `navbarDropdownBorderColor`
- `navbarDropdownBorderStyle`, `navbarDropdownBorderWidth`, `navbarDropdownOffset`
- `navbarDropdownArrow`, `navbarDropdownRadius`, `navbarDropdownZ`
- `navbarDropdownBoxedRadius`, `navbarDropdownBoxedShadow`, `navbarDropdownItemH`
- `navbarDropdownItemS`, `navbarDropdownItemL`, `navbarDropdownItemBackgroundL`
- `navbarDropdownItemColorL`, `navbarDividerBackgroundL`, `navbarDividerHeight`
- `navbarBottomBoxShadowSize`

**Notification Props:**

- `notificationH`, `notificationS`, `notificationBackgroundL`, `notificationColorL`
- `notificationCodeBackgroundColor`, `notificationRadius`, `notificationPadding`

**Pagination Props:**

- `paginationMargin`, `paginationMinWidth`, `paginationItemH`, `paginationItemS`
- `paginationItemL`, `paginationItemBackgroundLDelta`, `paginationItemHoverBackgroundLDelta`
- `paginationItemActiveBackgroundLDelta`, `paginationItemBorderStyle`, `paginationItemBorderWidth`
- `paginationItemBorderL`, `paginationItemBorderLDelta`, `paginationItemHoverBorderLDelta`
- `paginationItemActiveBorderLDelta`, `paginationItemFocusBorderLDelta`, `paginationItemColorL`
- `paginationItemFontSize`, `paginationItemMargin`, `paginationItemPaddingLeft`
- `paginationItemPaddingRight`, `paginationItemOuterShadowH`, `paginationItemOuterShadowS`
- `paginationItemOuterShadowL`, `paginationItemOuterShadowA`, `paginationNavPaddingLeft`
- `paginationNavPaddingRight`, `paginationDisabledColor`, `paginationDisabledBackgroundColor`
- `paginationDisabledBorderColor`, `paginationCurrentColor`, `paginationCurrentBackgroundColor`
- `paginationCurrentBorderColor`, `paginationEllipsisColor`, `paginationShadowInset`
- `paginationSelectedItemH`, `paginationSelectedItemS`, `paginationSelectedItemL`
- `paginationSelectedItemBackgroundL`, `paginationSelectedItemBorderL`, `paginationSelectedItemColorL`

**Panel Props:**

- `panelMargin`, `panelItemBorder`, `panelRadius`, `panelShadow`, `panelHeadingLineHeight`
- `panelHeadingPadding`, `panelHeadingRadius`, `panelHeadingSize`, `panelHeadingWeight`
- `panelTabsFontSize`, `panelTabBorderBottomColor`, `panelTabBorderBottomStyle`
- `panelTabBorderBottomWidth`, `panelTabActiveColor`, `panelListItemColor`
- `panelListItemHoverColor`, `panelBlockColor`, `panelBlockHoverBackgroundColor`
- `panelBlockActiveBorderLeftColor`, `panelBlockActiveColor`, `panelBlockActiveIconColor`
- `panelIconColor`

**Progress Props:**

- `progressBorderRadius`, `progressBarBackgroundColor`, `progressValueBackgroundColor`
- `progressIndeterminateDuration`

**Section Props:**

- `sectionPadding`, `sectionPaddingDesktop`, `sectionPaddingMedium`, `sectionPaddingLarge`

**Skeleton Props:**

- `skeletonBackground`, `skeletonRadius`, `skeletonBlockMinHeight`, `skeletonLinesGap`
- `skeletonLineHeight`

**Table Props:**

- `tableColor`, `tableBackgroundColor`, `tableCellBorderColor`, `tableCellBorderStyle`
- `tableCellBorderWidth`, `tableCellPadding`, `tableCellHeadingColor`, `tableCellTextAlign`
- `tableHeadCellBorderWidth`, `tableHeadCellColor`, `tableFootCellBorderWidth`
- `tableFootCellColor`, `tableHeadBackgroundColor`, `tableBodyBackgroundColor`
- `tableFootBackgroundColor`, `tableRowHoverBackgroundColor`, `tableRowActiveBackgroundColor`
- `tableRowActiveColor`, `tableStripedRowEvenBackgroundColor`, `tableStripedRowEvenHoverBackgroundColor`

**Tabs Props:**

- `tabsBorderBottomColor`, `tabsBorderBottomStyle`, `tabsBorderBottomWidth`
- `tabsLinkColor`, `tabsLinkHoverBorderBottomColor`, `tabsLinkHoverColor`
- `tabsLinkActiveBorderBottomColor`, `tabsLinkActiveColor`, `tabsLinkPadding`
- `tabsBoxedLinkRadius`, `tabsBoxedLinkHoverBackgroundColor`, `tabsBoxedLinkHoverBorderBottomColor`
- `tabsBoxedLinkActiveBackgroundColor`, `tabsBoxedLinkActiveBorderColor`
- `tabsBoxedLinkActiveBorderBottomColor`, `tabsToggleLinkBorderColor`, `tabsToggleLinkBorderStyle`
- `tabsToggleLinkBorderWidth`, `tabsToggleLinkHoverBackgroundColor`, `tabsToggleLinkHoverBorderColor`
- `tabsToggleLinkRadius`, `tabsToggleLinkActiveBackgroundColor`, `tabsToggleLinkActiveBorderColor`
- `tabsToggleLinkActiveColor`

**Tag Props:**

- `tagH`, `tagS`, `tagBackgroundL`, `tagBackgroundLDelta`, `tagHoverBackgroundLDelta`
- `tagActiveBackgroundLDelta`, `tagColorL`, `tagRadius`, `tagDeleteMargin`

**Title & Subtitle Props:**

- `titleColor`, `titleFamily`, `titleSize`, `titleWeight`, `titleLineHeight`
- `titleStrongColor`, `titleStrongWeight`, `titleSubSize`, `titleSupSize`
- `subtitleColor`, `subtitleFamily`, `subtitleSize`, `subtitleWeight`
- `subtitleLineHeight`, `subtitleStrongColor`, `subtitleStrongWeight`

### TypeScript Support

All props are fully typed in TypeScript. Use IDE autocomplete to discover available props:

```tsx
// TypeScript will provide autocomplete for all available props
<Theme
  primaryH="270"
  cardContent={/* TypeScript autocomplete will show all card-related props */}
/>
```

---

## See Also

- [ConfigProvider](./config.md) - For class prefixing and configuration
- [useBulmaClasses](./usebulmaclasses.md) - For applying Bulma helper classes
- [Bulma CSS Variables Documentation](https://bulma.io/documentation/features/css-variables/) - Official Bulma CSS variables reference
