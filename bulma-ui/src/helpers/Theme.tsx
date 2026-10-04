import React, {
  useEffect,
  useMemo,
  useState,
  ReactNode,
  CSSProperties,
} from 'react';
import classNames from './classNames';
import { useBulmaClasses, BulmaClassesProps } from './useBulmaClasses';
import { validGaps, validRadii, type BulmaGapStep } from './bulmaClassHelpers';
import { warnOnce } from './devWarnings';
import { useClassPrefix } from './Config';

// --- FULL Bulma v1 CSS variable keys (auto-generated from CSSVAR_KEYS) ---
const bulmaCssVars = [
  // scheme
  '--bulma-scheme-h',
  '--bulma-scheme-s',
  '--bulma-scheme-main',
  '--bulma-scheme-main-bis',
  '--bulma-scheme-main-ter',
  '--bulma-scheme-invert',
  '--bulma-scheme-invert-bis',
  '--bulma-scheme-invert-ter',
  '--bulma-light-l',
  '--bulma-light-invert-l',
  '--bulma-dark-l',
  '--bulma-dark-invert-l',
  '--bulma-soft-l',
  '--bulma-bold-l',
  '--bulma-soft-invert-l',
  '--bulma-bold-invert-l',
  '--bulma-hover-background-l-delta',
  '--bulma-active-background-l-delta',
  '--bulma-hover-border-l-delta',
  '--bulma-active-border-l-delta',
  '--bulma-hover-color-l-delta',
  '--bulma-active-color-l-delta',
  '--bulma-hover-shadow-a-delta',
  '--bulma-active-shadow-a-delta',
  // colors
  '--bulma-primary-h',
  '--bulma-primary-s',
  '--bulma-primary-l',
  '--bulma-link-h',
  '--bulma-link-s',
  '--bulma-link-l',
  '--bulma-info-h',
  '--bulma-info-s',
  '--bulma-info-l',
  '--bulma-success-h',
  '--bulma-success-s',
  '--bulma-success-l',
  '--bulma-warning-h',
  '--bulma-warning-s',
  '--bulma-warning-l',
  '--bulma-danger-h',
  '--bulma-danger-s',
  '--bulma-danger-l',
  // shadow (the upstream token .box/.card/.dropdown/.panel derive their own
  // shadow variables from; overriding it from an ancestor is the route that
  // cascades, since those selectors re-declare their derived var on
  // themselves)
  '--bulma-shadow-h',
  '--bulma-shadow-s',
  '--bulma-shadow-l',
  '--bulma-shadow',
  // typography
  '--bulma-family-primary',
  '--bulma-family-secondary',
  '--bulma-family-code',
  '--bulma-size-small',
  '--bulma-size-normal',
  '--bulma-size-medium',
  '--bulma-size-large',
  '--bulma-weight-light',
  '--bulma-weight-normal',
  '--bulma-weight-medium',
  '--bulma-weight-semibold',
  '--bulma-weight-bold',
  '--bulma-weight-extrabold',
  // other
  '--bulma-block-spacing',
  '--bulma-duration',
  '--bulma-easing',
  '--bulma-radius-small',
  '--bulma-radius',
  '--bulma-radius-medium',
  '--bulma-radius-large',
  '--bulma-radius-rounded',
  '--bulma-speed',
  '--bulma-arrow-color',
  '--bulma-loading-color',
  '--bulma-burger-h',
  '--bulma-burger-s',
  '--bulma-burger-l',
  '--bulma-burger-border-radius',
  '--bulma-burger-gap',
  '--bulma-burger-item-height',
  '--bulma-burger-item-width',
  // generic
  '--bulma-body-background-color',
  '--bulma-body-size',
  '--bulma-body-min-width',
  '--bulma-body-rendering',
  '--bulma-body-family',
  '--bulma-body-overflow-x',
  '--bulma-body-overflow-y',
  '--bulma-body-color',
  '--bulma-body-font-size',
  '--bulma-body-weight',
  '--bulma-body-line-height',
  '--bulma-code-family',
  '--bulma-code-padding',
  '--bulma-code-weight',
  '--bulma-code-size',
  '--bulma-small-font-size',
  '--bulma-hr-background-color',
  '--bulma-hr-height',
  '--bulma-hr-margin',
  '--bulma-strong-color',
  '--bulma-strong-weight',
  '--bulma-pre-font-size',
  '--bulma-pre-padding',
  '--bulma-pre-code-font-size',
  // skeleton
  '--bulma-skeleton-background',
  '--bulma-skeleton-radius',
  '--bulma-skeleton-block-min-height',
  '--bulma-skeleton-lines-gap',
  '--bulma-skeleton-line-height',
  // breadcrumb
  '--bulma-breadcrumb-item-color',
  '--bulma-breadcrumb-item-hover-color',
  '--bulma-breadcrumb-item-active-color',
  '--bulma-breadcrumb-item-padding-vertical',
  '--bulma-breadcrumb-item-padding-horizontal',
  '--bulma-breadcrumb-item-separator-color',
  // card
  '--bulma-card-color',
  '--bulma-card-background-color',
  '--bulma-card-shadow',
  '--bulma-card-radius',
  '--bulma-card-header-background-color',
  '--bulma-card-header-color',
  '--bulma-card-header-padding',
  '--bulma-card-header-shadow',
  '--bulma-card-header-weight',
  '--bulma-card-content-background-color',
  '--bulma-card-content-padding',
  '--bulma-card-footer-background-color',
  '--bulma-card-footer-border-top',
  '--bulma-card-footer-padding',
  '--bulma-card-media-margin',
  // dropdown
  '--bulma-dropdown-menu-min-width',
  '--bulma-dropdown-content-background-color',
  '--bulma-dropdown-content-offset',
  '--bulma-dropdown-content-padding-bottom',
  '--bulma-dropdown-content-padding-top',
  '--bulma-dropdown-content-radius',
  '--bulma-dropdown-content-shadow',
  '--bulma-dropdown-content-z',
  '--bulma-dropdown-item-h',
  '--bulma-dropdown-item-s',
  '--bulma-dropdown-item-l',
  '--bulma-dropdown-item-background-l',
  '--bulma-dropdown-item-background-l-delta',
  '--bulma-dropdown-item-hover-background-l-delta',
  '--bulma-dropdown-item-active-background-l-delta',
  '--bulma-dropdown-item-color-l',
  '--bulma-dropdown-item-selected-h',
  '--bulma-dropdown-item-selected-s',
  '--bulma-dropdown-item-selected-l',
  '--bulma-dropdown-item-selected-background-l',
  '--bulma-dropdown-item-selected-color-l',
  '--bulma-dropdown-divider-background-color',
  // menu
  '--bulma-menu-item-h',
  '--bulma-menu-item-s',
  '--bulma-menu-item-l',
  '--bulma-menu-item-background-l',
  '--bulma-menu-item-background-l-delta',
  '--bulma-menu-item-hover-background-l-delta',
  '--bulma-menu-item-active-background-l-delta',
  '--bulma-menu-item-color-l',
  '--bulma-menu-item-radius',
  '--bulma-menu-item-selected-h',
  '--bulma-menu-item-selected-s',
  '--bulma-menu-item-selected-l',
  '--bulma-menu-item-selected-background-l',
  '--bulma-menu-item-selected-color-l',
  '--bulma-menu-list-border-left',
  '--bulma-menu-list-line-height',
  '--bulma-menu-list-link-padding',
  '--bulma-menu-nested-list-margin',
  '--bulma-menu-nested-list-padding-left',
  '--bulma-menu-label-color',
  '--bulma-menu-label-font-size',
  '--bulma-menu-label-letter-spacing',
  '--bulma-menu-label-spacing',
  // message
  '--bulma-message-h',
  '--bulma-message-s',
  '--bulma-message-background-l',
  '--bulma-message-border-l',
  '--bulma-message-border-l-delta',
  '--bulma-message-border-style',
  '--bulma-message-border-width',
  '--bulma-message-color-l',
  '--bulma-message-radius',
  '--bulma-message-header-weight',
  '--bulma-message-header-padding',
  '--bulma-message-header-radius',
  '--bulma-message-header-body-border-width',
  '--bulma-message-header-background-l',
  '--bulma-message-header-color-l',
  '--bulma-message-body-border-width',
  '--bulma-message-body-color',
  '--bulma-message-body-padding',
  '--bulma-message-body-radius',
  '--bulma-message-body-pre-code-background-color',
  // modal
  '--bulma-modal-z',
  '--bulma-modal-background-background-color',
  '--bulma-modal-content-width',
  '--bulma-modal-content-margin-mobile',
  '--bulma-modal-content-spacing-mobile',
  '--bulma-modal-content-spacing-tablet',
  '--bulma-modal-close-dimensions',
  '--bulma-modal-close-right',
  '--bulma-modal-close-top',
  '--bulma-modal-card-spacing',
  '--bulma-modal-card-head-background-color',
  '--bulma-modal-card-head-padding',
  '--bulma-modal-card-head-radius',
  '--bulma-modal-card-title-color',
  '--bulma-modal-card-title-line-height',
  '--bulma-modal-card-title-size',
  '--bulma-modal-card-foot-background-color',
  '--bulma-modal-card-foot-radius',
  '--bulma-modal-card-body-background-color',
  '--bulma-modal-card-body-padding',
  // navbar
  '--bulma-navbar-h',
  '--bulma-navbar-s',
  '--bulma-navbar-l',
  '--bulma-navbar-background-color',
  '--bulma-navbar-box-shadow-size',
  '--bulma-navbar-box-shadow-color',
  '--bulma-navbar-padding-vertical',
  '--bulma-navbar-padding-horizontal',
  '--bulma-navbar-z',
  '--bulma-navbar-fixed-z',
  '--bulma-navbar-item-background-a',
  '--bulma-navbar-item-background-l',
  '--bulma-navbar-item-background-l-delta',
  '--bulma-navbar-item-hover-background-l-delta',
  '--bulma-navbar-item-active-background-l-delta',
  '--bulma-navbar-item-color-l',
  '--bulma-navbar-item-selected-h',
  '--bulma-navbar-item-selected-s',
  '--bulma-navbar-item-selected-l',
  '--bulma-navbar-item-selected-background-l',
  '--bulma-navbar-item-selected-color-l',
  '--bulma-navbar-item-img-max-height',
  '--bulma-navbar-burger-color',
  '--bulma-navbar-tab-hover-background-color',
  '--bulma-navbar-tab-hover-border-bottom-color',
  '--bulma-navbar-tab-active-color',
  '--bulma-navbar-tab-active-background-color',
  '--bulma-navbar-tab-active-border-bottom-color',
  '--bulma-navbar-tab-active-border-bottom-style',
  '--bulma-navbar-tab-active-border-bottom-width',
  '--bulma-navbar-dropdown-background-color',
  '--bulma-navbar-dropdown-border-l',
  '--bulma-navbar-dropdown-border-color',
  '--bulma-navbar-dropdown-border-style',
  '--bulma-navbar-dropdown-border-width',
  '--bulma-navbar-dropdown-offset',
  '--bulma-navbar-dropdown-arrow',
  '--bulma-navbar-dropdown-radius',
  '--bulma-navbar-dropdown-z',
  '--bulma-navbar-dropdown-boxed-radius',
  '--bulma-navbar-dropdown-boxed-shadow',
  '--bulma-navbar-dropdown-item-h',
  '--bulma-navbar-dropdown-item-s',
  '--bulma-navbar-dropdown-item-l',
  '--bulma-navbar-dropdown-item-background-l',
  '--bulma-navbar-dropdown-item-color-l',
  '--bulma-navbar-divider-background-l',
  '--bulma-navbar-divider-height',
  '--bulma-navbar-bottom-box-shadow-size',
  // pagination
  '--bulma-pagination-margin',
  '--bulma-pagination-min-width',
  '--bulma-pagination-item-h',
  '--bulma-pagination-item-s',
  '--bulma-pagination-item-l',
  '--bulma-pagination-item-background-l-delta',
  '--bulma-pagination-item-hover-background-l-delta',
  '--bulma-pagination-item-active-background-l-delta',
  '--bulma-pagination-item-border-style',
  '--bulma-pagination-item-border-width',
  '--bulma-pagination-item-border-l',
  '--bulma-pagination-item-border-l-delta',
  '--bulma-pagination-item-hover-border-l-delta',
  '--bulma-pagination-item-active-border-l-delta',
  '--bulma-pagination-item-focus-border-l-delta',
  '--bulma-pagination-item-color-l',
  '--bulma-pagination-item-font-size',
  '--bulma-pagination-item-margin',
  '--bulma-pagination-item-padding-left',
  '--bulma-pagination-item-padding-right',
  '--bulma-pagination-item-outer-shadow-h',
  '--bulma-pagination-item-outer-shadow-s',
  '--bulma-pagination-item-outer-shadow-l',
  '--bulma-pagination-item-outer-shadow-a',
  '--bulma-pagination-nav-padding-left',
  '--bulma-pagination-nav-padding-right',
  '--bulma-pagination-disabled-color',
  '--bulma-pagination-disabled-background-color',
  '--bulma-pagination-disabled-border-color',
  '--bulma-pagination-current-color',
  '--bulma-pagination-current-background-color',
  '--bulma-pagination-current-border-color',
  '--bulma-pagination-ellipsis-color',
  '--bulma-pagination-shadow-inset',
  '--bulma-pagination-selected-item-h',
  '--bulma-pagination-selected-item-s',
  '--bulma-pagination-selected-item-l',
  '--bulma-pagination-selected-item-background-l',
  '--bulma-pagination-selected-item-border-l',
  '--bulma-pagination-selected-item-color-l',
  // panel
  '--bulma-panel-margin',
  '--bulma-panel-item-border',
  '--bulma-panel-radius',
  '--bulma-panel-shadow',
  '--bulma-panel-heading-line-height',
  '--bulma-panel-heading-padding',
  '--bulma-panel-heading-radius',
  '--bulma-panel-heading-size',
  '--bulma-panel-heading-weight',
  '--bulma-panel-tabs-font-size',
  '--bulma-panel-tab-border-bottom-color',
  '--bulma-panel-tab-border-bottom-style',
  '--bulma-panel-tab-border-bottom-width',
  '--bulma-panel-tab-active-color',
  '--bulma-panel-list-item-color',
  '--bulma-panel-list-item-hover-color',
  '--bulma-panel-block-color',
  '--bulma-panel-block-hover-background-color',
  '--bulma-panel-block-active-border-left-color',
  '--bulma-panel-block-active-color',
  '--bulma-panel-block-active-icon-color',
  '--bulma-panel-icon-color',
  // tabs
  '--bulma-tabs-border-bottom-color',
  '--bulma-tabs-border-bottom-style',
  '--bulma-tabs-border-bottom-width',
  '--bulma-tabs-link-color',
  '--bulma-tabs-link-hover-border-bottom-color',
  '--bulma-tabs-link-hover-color',
  '--bulma-tabs-link-active-border-bottom-color',
  '--bulma-tabs-link-active-color',
  '--bulma-tabs-link-padding',
  '--bulma-tabs-boxed-link-radius',
  '--bulma-tabs-boxed-link-hover-background-color',
  '--bulma-tabs-boxed-link-hover-border-bottom-color',
  '--bulma-tabs-boxed-link-active-background-color',
  '--bulma-tabs-boxed-link-active-border-color',
  '--bulma-tabs-boxed-link-active-border-bottom-color',
  '--bulma-tabs-toggle-link-border-color',
  '--bulma-tabs-toggle-link-border-style',
  '--bulma-tabs-toggle-link-border-width',
  '--bulma-tabs-toggle-link-hover-background-color',
  '--bulma-tabs-toggle-link-hover-border-color',
  '--bulma-tabs-toggle-link-radius',
  '--bulma-tabs-toggle-link-active-background-color',
  '--bulma-tabs-toggle-link-active-border-color',
  '--bulma-tabs-toggle-link-active-color',
  // box
  '--bulma-box-background-color',
  '--bulma-box-color',
  '--bulma-box-radius',
  '--bulma-box-shadow',
  '--bulma-box-padding',
  '--bulma-box-link-hover-shadow',
  '--bulma-box-link-active-shadow',
  // content
  '--bulma-content-heading-color',
  '--bulma-content-heading-weight',
  '--bulma-content-heading-line-height',
  '--bulma-content-block-margin-bottom',
  '--bulma-content-blockquote-background-color',
  '--bulma-content-blockquote-border-left',
  '--bulma-content-blockquote-padding',
  '--bulma-content-pre-padding',
  '--bulma-content-table-cell-border',
  '--bulma-content-table-cell-border-width',
  '--bulma-content-table-cell-padding',
  '--bulma-content-table-cell-heading-color',
  '--bulma-content-table-head-cell-border-width',
  '--bulma-content-table-head-cell-color',
  '--bulma-content-table-body-last-row-cell-border-bottom-width',
  '--bulma-content-table-foot-cell-border-width',
  '--bulma-content-table-foot-cell-color',
  // delete
  '--bulma-delete-dimensions',
  '--bulma-delete-background-l',
  '--bulma-delete-background-alpha',
  '--bulma-delete-color',
  // icon
  '--bulma-icon-dimensions',
  '--bulma-icon-dimensions-small',
  '--bulma-icon-dimensions-medium',
  '--bulma-icon-dimensions-large',
  '--bulma-icon-text-spacing',
  // notification
  '--bulma-notification-h',
  '--bulma-notification-s',
  '--bulma-notification-background-l',
  '--bulma-notification-color-l',
  '--bulma-notification-code-background-color',
  '--bulma-notification-radius',
  '--bulma-notification-padding',
  // progress
  '--bulma-progress-border-radius',
  '--bulma-progress-bar-background-color',
  '--bulma-progress-value-background-color',
  '--bulma-progress-indeterminate-duration',
  // table
  '--bulma-table-color',
  '--bulma-table-background-color',
  '--bulma-table-cell-border-color',
  '--bulma-table-cell-border-style',
  '--bulma-table-cell-border-width',
  '--bulma-table-cell-padding',
  '--bulma-table-cell-heading-color',
  '--bulma-table-cell-text-align',
  '--bulma-table-head-cell-border-width',
  '--bulma-table-head-cell-color',
  '--bulma-table-foot-cell-border-width',
  '--bulma-table-foot-cell-color',
  '--bulma-table-head-background-color',
  '--bulma-table-body-background-color',
  '--bulma-table-foot-background-color',
  '--bulma-table-row-hover-background-color',
  '--bulma-table-row-active-background-color',
  '--bulma-table-row-active-color',
  '--bulma-table-striped-row-even-background-color',
  '--bulma-table-striped-row-even-hover-background-color',
  // tag
  '--bulma-tag-h',
  '--bulma-tag-s',
  '--bulma-tag-background-l',
  '--bulma-tag-background-l-delta',
  '--bulma-tag-hover-background-l-delta',
  '--bulma-tag-active-background-l-delta',
  '--bulma-tag-color-l',
  '--bulma-tag-radius',
  '--bulma-tag-delete-margin',
  // title
  '--bulma-title-color',
  '--bulma-title-family',
  '--bulma-title-size',
  '--bulma-title-weight',
  '--bulma-title-line-height',
  '--bulma-title-strong-color',
  '--bulma-title-strong-weight',
  '--bulma-title-sub-size',
  '--bulma-title-sup-size',
  '--bulma-subtitle-color',
  '--bulma-subtitle-family',
  '--bulma-subtitle-size',
  '--bulma-subtitle-weight',
  '--bulma-subtitle-line-height',
  '--bulma-subtitle-strong-color',
  '--bulma-subtitle-strong-weight',
  // control
  '--bulma-control-radius',
  '--bulma-control-radius-small',
  '--bulma-control-border-width',
  '--bulma-control-height',
  '--bulma-control-line-height',
  '--bulma-control-padding-vertical',
  '--bulma-control-padding-horizontal',
  '--bulma-control-size',
  '--bulma-control-focus-shadow-l',
  // file
  '--bulma-file-radius',
  '--bulma-file-name-border-color',
  '--bulma-file-name-border-style',
  '--bulma-file-name-border-width',
  '--bulma-file-name-max-width',
  '--bulma-file-h',
  '--bulma-file-s',
  '--bulma-file-background-l',
  '--bulma-file-background-l-delta',
  '--bulma-file-hover-background-l-delta',
  '--bulma-file-active-background-l-delta',
  '--bulma-file-border-l',
  '--bulma-file-border-l-delta',
  '--bulma-file-hover-border-l-delta',
  '--bulma-file-active-border-l-delta',
  '--bulma-file-cta-color-l',
  '--bulma-file-name-color-l',
  '--bulma-file-color-l-delta',
  '--bulma-file-hover-color-l-delta',
  '--bulma-file-active-color-l-delta',
  // input
  '--bulma-input-h',
  '--bulma-input-s',
  '--bulma-input-l',
  '--bulma-input-border-style',
  '--bulma-input-border-l',
  '--bulma-input-border-l-delta',
  '--bulma-input-hover-border-l-delta',
  '--bulma-input-active-border-l-delta',
  '--bulma-input-focus-h',
  '--bulma-input-focus-s',
  '--bulma-input-focus-l',
  '--bulma-input-focus-shadow-size',
  '--bulma-input-focus-shadow-alpha',
  '--bulma-input-color-l',
  '--bulma-input-background-l',
  '--bulma-input-background-l-delta',
  '--bulma-input-height',
  '--bulma-input-shadow',
  '--bulma-input-placeholder-color',
  '--bulma-input-disabled-color',
  '--bulma-input-disabled-background-color',
  '--bulma-input-disabled-border-color',
  '--bulma-input-disabled-placeholder-color',
  '--bulma-input-arrow',
  '--bulma-input-icon-color',
  '--bulma-input-icon-hover-color',
  '--bulma-input-icon-focus-color',
  '--bulma-input-radius',
  // columns
  '--bulma-column-gap',
  // grid
  '--bulma-grid-gap',
  '--bulma-grid-column-count',
  '--bulma-grid-column-min',
  '--bulma-grid-cell-column-span',
  '--bulma-grid-cell-column-start',
  // footer
  '--bulma-footer-background-color',
  '--bulma-footer-color',
  '--bulma-footer-padding',
  // hero
  '--bulma-hero-body-padding',
  '--bulma-hero-body-padding-tablet',
  '--bulma-hero-body-padding-small',
  '--bulma-hero-body-padding-medium',
  '--bulma-hero-body-padding-large',
  // media
  '--bulma-media-border-color',
  '--bulma-media-border-size',
  '--bulma-media-spacing',
  '--bulma-media-spacing-large',
  '--bulma-media-content-spacing',
  '--bulma-media-level-1-spacing',
  '--bulma-media-level-1-content-spacing',
  '--bulma-media-level-2-spacing',
  // section
  '--bulma-section-padding',
  '--bulma-section-padding-desktop',
  '--bulma-section-padding-medium',
  '--bulma-section-padding-large',
] as const;

/** A single Bulma CSS variable key from the `bulmaCssVars` tuple. */
type BulmaVarKey = (typeof bulmaCssVars)[number];
/** A partial record mapping Bulma CSS variable keys to string values. */
type BulmaVars = Partial<Record<BulmaVarKey, string>>;

/**
 * Convert a Bulma CSS variable name to a camelCase prop name.
 * @param {string} varName - CSS variable name (e.g., '--bulma-primary-h').
 * @returns {string} The camelCase prop name (e.g., 'primaryH').
 */
function cssVarToProp(varName: string): string {
  return varName
    .replace(/^--bulma-/, '')
    .split('-')
    .map((part, i) =>
      i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');
}

/**
 * Prop names `cssVarToProp` would mint that are already helper props:
 * `--bulma-shadow` becomes `shadow`, `--bulma-radius` becomes `radius` and
 * `--bulma-column-gap` becomes `columnGap`. They stay out of
 * `bulmaVarPropMap`, so on Theme each is the helper prop it is on every other
 * component, and every one of those variables is still reachable through
 * `bulmaVars`.
 *
 * `radius` was missed here once and set `--bulma-radius` while typed as the
 * helper (#694). It still writes that variable, so what it did then keeps
 * working; see `themeRadiusVar`. `columnGap` joined when the gap helpers
 * became shared helper props, and keeps its old variable route the same way;
 * see `themeColumnGapVar`.
 */
const helperPropNames: readonly string[] = ['shadow', 'radius', 'columnGap'];

/**
 * Mapping of camelCase prop names to their Bulma CSS variable counterparts,
 * minus the `helperPropNames` above.
 */
const bulmaVarPropMap = Object.fromEntries(
  bulmaCssVars
    .map(cssVar => [cssVarToProp(cssVar), cssVar])
    .filter(([prop]) => !helperPropNames.includes(prop))
) as Record<string, string>;

/**
 * What each helper value of `radius` writes to `--bulma-radius` on a Theme,
 * alongside its class.
 *
 * Before #694, `radius="radiusless"` wrote `--bulma-radius: radiusless`. That
 * is not a length, and a declaration reading an invalid variable falls back
 * to its property's initial value, which for a border radius is 0. So
 * everything inside the Theme that takes its radius from that variable lost
 * it, and under `isRoot` so did everything on the page that does. Writing a
 * real 0 keeps what
 * people see and makes it valid CSS. Keyed by the helper values, so adding
 * one means saying what it writes.
 *
 * The sizes write nothing and only add their class. Their classes read the
 * radius variables, so `normal` would point `--bulma-radius` at itself, which
 * is invalid and computes to 0, and `rounded` would turn every control inside
 * the Theme into a pill.
 */
const radiusHelperVars: Record<
  (typeof validRadii)[number],
  string | undefined
> = {
  radiusless: '0',
  small: undefined,
  normal: undefined,
  large: undefined,
  rounded: undefined,
};

/**
 * What `radius` writes to `--bulma-radius` on a Theme, or `undefined` when it
 * writes nothing.
 *
 * A helper value writes its `radiusHelperVars` entry. Any other non-empty
 * string is written as given: before #694 every `radius` on Theme set the
 * variable whatever its type said, and a JavaScript caller passing a length
 * got the radius it asked for. That keeps working so nothing breaks, but the
 * type rejects it, so it warns in development and points at `bulmaVars`.
 *
 * Only a string writes anything, because only a string ever set the variable
 * to something usable: an empty value or zero was dropped, and a boolean or
 * any other bare number is not a length. The helper ignores those too, the
 * way it does on every other component.
 */
const themeRadiusVar = (radius: unknown): string | undefined => {
  if (typeof radius !== 'string' || radius === '') {
    return undefined;
  }
  if ((validRadii as readonly string[]).includes(radius)) {
    return radiusHelperVars[radius as keyof typeof radiusHelperVars];
  }
  warnOnce(
    'Theme:radius-variable',
    `[bestax-bulma] <Theme radius="${radius}">: setting --bulma-radius ` +
      'through the radius prop is deprecated and will stop working in a ' +
      'future major version. On Theme, as on every other component, radius ' +
      `is the border radius helper ("${validRadii.join('", "')}"). Set the variable with ` +
      `bulmaVars={{ '--bulma-radius': '${radius}' }} instead.`
  );
  return radius;
};

/**
 * What `columnGap` writes to `--bulma-column-gap` on a Theme, or `undefined`
 * when it writes nothing.
 *
 * Until the gap helpers were shared helper props, `columnGap` on Theme was
 * the camelCase prop Theme mints for `--bulma-column-gap`. It was never in
 * `ThemeProps`, so only untyped code reached it, but that code got the
 * columns gutter it asked for. It is the column gap helper now, as on every
 * other component, so a gap step goes to the helper and writes nothing here.
 * Any other non-empty string is still written as given, so a length such as
 * `'1rem'` keeps working, with a development warning pointing at `bulmaVars`.
 *
 * Only a string writes anything, for the reason `themeRadiusVar` gives: a
 * number or a boolean was never a usable length.
 */
const themeColumnGapVar = (columnGap: unknown): string | undefined => {
  if (typeof columnGap !== 'string' || columnGap === '') {
    return undefined;
  }
  if ((validGaps as readonly string[]).includes(columnGap)) {
    return undefined;
  }
  warnOnce(
    'Theme:column-gap-variable',
    `[bestax-bulma] <Theme columnGap="${columnGap}">: setting ` +
      '--bulma-column-gap through the columnGap prop is deprecated and will ' +
      'stop working in a future major version. On Theme, as on every other ' +
      'component, columnGap is the column gap helper ' +
      `("${validGaps.join('", "')}"). Set the variable with ` +
      `bulmaVars={{ '--bulma-column-gap': '${columnGap}' }} instead.`
  );
  return columnGap;
};

/** The one `<style>` element every `isRoot` Theme writes into. */
const ROOT_STYLE_ID = 'bestax-bulma-theme-vars';

/**
 * The `:root` rules of every mounted `isRoot` Theme that has any, keyed by the
 * Theme's render order.
 *
 * Root Themes share one `<style>` element, so each keeps its rules here and
 * the element is rebuilt from all of them whenever one mounts, changes or
 * unmounts. Before this each Theme overwrote the element with only its own
 * rules, and the first to unmount removed it for all of them (#736).
 *
 * The key is a number each Theme takes when it first renders. React renders a
 * parent before its children and an earlier sibling before a later one, so an
 * inner or later-mounted root Theme sorts later, comes later in the
 * stylesheet, and wins a variable two of them set, as an inner scoped Theme
 * does. Effects would give the wrong answer for nesting: React runs a child's
 * effects before its parent's. Only the relative order matters, so a number
 * skipped by StrictMode calling the initializer twice, or by a render React
 * throws away, is harmless. The key never changes, so an update keeps its
 * place and re-rendering one Theme never changes which one wins.
 */
const rootThemeRules = new Map<number, string>();
let nextRootOrder = 0;

/**
 * Write every registered root Theme's rules into the shared element, creating
 * it when needed and removing it once no Theme has any rules left.
 */
const renderRootThemeRules = (): void => {
  let element = document.getElementById(ROOT_STYLE_ID);
  if (rootThemeRules.size === 0) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('style');
    element.id = ROOT_STYLE_ID;
    document.head.appendChild(element);
  }
  element.textContent = [...rootThemeRules]
    .sort(([a], [b]) => a - b)
    .map(([, rules]) => rules)
    .join('\n');
};

/**
 * Record one Theme's `:root` rules, where an empty string means it has none,
 * and rebuild the shared element if that changed anything. A Theme with no
 * rules never touches the element, which is what it did before the registry
 * too.
 */
const setRootThemeRules = (order: number, rules: string): void => {
  if ((rootThemeRules.get(order) ?? '') === rules) {
    return;
  }
  if (rules) {
    rootThemeRules.set(order, rules);
  } else {
    rootThemeRules.delete(order);
  }
  renderRootThemeRules();
};

/**
 * Props for the Theme component.
 *
 * @property {React.ReactNode} children - Content to render inside the theme scope.
 * @property {string} [className] - Additional CSS classes (only when isRoot is false).
 * @property {BulmaVars} [bulmaVars] - Object mapping Bulma CSS variable names to values.
 * @property {string} [schemeH] - Scheme hue value.
 * @property {string} [schemeS] - Scheme saturation value.
 * @property {string} [lightL] - Light theme lightness value.
 * @property {string} [lightInvertL] - Light theme inverted lightness value.
 * @property {string} [darkL] - Dark theme lightness value.
 * @property {string} [darkInvertL] - Dark theme inverted lightness value.
 * @property {string} [softL] - Soft lightness value.
 * @property {string} [boldL] - Bold lightness value.
 * @property {string} [softInvertL] - Soft inverted lightness value.
 * @property {string} [boldInvertL] - Bold inverted lightness value.
 * @property {string} [hoverBackgroundLDelta] - Background lightness delta on hover.
 * @property {string} [activeBackgroundLDelta] - Background lightness delta on active.
 * @property {string} [hoverBorderLDelta] - Border lightness delta on hover.
 * @property {string} [activeBorderLDelta] - Border lightness delta on active.
 * @property {string} [hoverColorLDelta] - Text color lightness delta on hover.
 * @property {string} [activeColorLDelta] - Text color lightness delta on active.
 * @property {string} [hoverShadowADelta] - Shadow alpha delta on hover.
 * @property {string} [activeShadowADelta] - Shadow alpha delta on active.
 * @property {string} [primaryH] - Primary color hue.
 * @property {string} [primaryS] - Primary color saturation.
 * @property {string} [primaryL] - Primary color lightness.
 * @property {string} [linkH] - Link color hue.
 * @property {string} [linkS] - Link color saturation.
 * @property {string} [linkL] - Link color lightness.
 * @property {string} [infoH] - Info color hue.
 * @property {string} [infoS] - Info color saturation.
 * @property {string} [infoL] - Info color lightness.
 * @property {string} [successH] - Success color hue.
 * @property {string} [successS] - Success color saturation.
 * @property {string} [successL] - Success color lightness.
 * @property {string} [warningH] - Warning color hue.
 * @property {string} [warningS] - Warning color saturation.
 * @property {string} [warningL] - Warning color lightness.
 * @property {string} [dangerH] - Danger color hue.
 * @property {string} [dangerS] - Danger color saturation.
 * @property {string} [dangerL] - Danger color lightness.
 */
export interface ThemeProps extends Omit<
  BulmaClassesProps,
  'color' | 'backgroundColor'
> {
  children: ReactNode;
  className?: string;
  /**
   * Inject the variables globally at `:root` instead of scoping them to a
   * wrapper div. Default: false.
   *
   * Several root Themes can be mounted at once, and each contributes its own
   * variables. Where two set the same one, the inner or later-mounted Theme
   * wins, as with nested scoped Themes, and unmounting a Theme removes only
   * what it contributed. The variables are written from an effect, so a
   * server render does not include them.
   */
  isRoot?: boolean;
  /**
   * Set Bulma's light/dark scheme by writing its theme attribute on the
   * document root (`<html>`). This is always global, even on a scoped Theme.
   * `'system'` removes the attribute so Bulma follows the OS
   * `prefers-color-scheme`. Omit to leave the current setting untouched.
   *
   * The attribute is `data-theme`. A stylesheet built with a class prefix
   * reads Bulma's prefixed form instead (`data-bestax-theme` for the
   * `bestax-prefixed` builds), so under a `ConfigProvider` `classPrefix`
   * Theme writes both, and `'system'` or unmounting clears or restores both.
   */
  colorMode?: 'light' | 'dark' | 'system';
  bulmaVars?: BulmaVars;
  /**
   * Border radius helper, as on every other component: `radiusless` adds
   * `is-radiusless` to the wrapper div. On a Theme it also sets
   * `--bulma-radius` to 0, so what is inside the Theme loses its radius too.
   * Under `isRoot` there is no wrapper for the class, and the variable is
   * written at `:root`, which squares everything on the page that takes its
   * radius from it.
   *
   * The sizes (`small`, `normal`, `large`, `rounded`) add their
   * `has-radius-<value>` class to the wrapper div and set no variable, so
   * they round the wrapper and leave what is inside it alone. Under `isRoot`
   * there is no wrapper, so they do nothing, and say so in development.
   *
   * To change the radius of what is inside, set the variable through `bulmaVars`
   * (`bulmaVars={{ '--bulma-radius': '6px' }}`). This prop used to write the
   * variable for every value, so any other non-empty string still does, but
   * that route is deprecated and logs a warning in development. A number or
   * a boolean never produced a usable radius that way, and is now ignored as
   * it is on every other component.
   */
  radius?: (typeof validRadii)[number];
  /**
   * Column gap helper, as on every other component: a gap step adds
   * `is-column-gap-<step>` to the wrapper div, which spaces the wrapper's own
   * children when it is a flex or grid container. Under `isRoot` there is no
   * wrapper, so it does nothing, and says so in development.
   *
   * It does not set `--bulma-column-gap`, the variable `Columns` reads for
   * its gutters; set that through `bulmaVars`
   * (`bulmaVars={{ '--bulma-column-gap': '1rem' }}`). Before `columnGap` was
   * a helper prop, untyped JavaScript could pass it to Theme as that
   * variable. A string that is not a gap step (`'1rem'`) still sets it, but
   * that route is deprecated and logs a warning in development. A gap step
   * does not: `columnGap="0"` used to zero the gutters inside the Theme, and
   * now adds `is-column-gap-0` to the wrapper instead.
   */
  columnGap?: BulmaGapStep;
  // Bulma scheme variables
  schemeH?: string;
  schemeS?: string;
  lightL?: string;
  lightInvertL?: string;
  darkL?: string;
  darkInvertL?: string;
  softL?: string;
  boldL?: string;
  softInvertL?: string;
  boldInvertL?: string;
  hoverBackgroundLDelta?: string;
  activeBackgroundLDelta?: string;
  hoverBorderLDelta?: string;
  activeBorderLDelta?: string;
  hoverColorLDelta?: string;
  activeColorLDelta?: string;
  hoverShadowADelta?: string;
  activeShadowADelta?: string;
  // Bulma color variables
  primaryH?: string;
  primaryS?: string;
  primaryL?: string;
  linkH?: string;
  linkS?: string;
  linkL?: string;
  infoH?: string;
  infoS?: string;
  infoL?: string;
  successH?: string;
  successS?: string;
  successL?: string;
  warningH?: string;
  warningS?: string;
  warningL?: string;
  dangerH?: string;
  dangerS?: string;
  dangerL?: string;
  // Add other commonly used ones as needed
}

/**
 * Theme component that injects Bulma CSS variables either globally or locally.
 *
 * When `isRoot` is true, variables are injected at `:root`. Otherwise, a wrapping
 * `<div>` scopes the variables to its children.
 *
 * @function
 * @param {ThemeProps} props - Props for the Theme component.
 * @returns {JSX.Element} The theme wrapper or fragment.
 *
 * @example
 * // Local theme scope
 * <Theme primaryH="171" primaryS="100%" primaryL="41%">
 *   <Button color="primary">Themed</Button>
 * </Theme>
 */
export const Theme: React.FC<ThemeProps> = ({
  bulmaVars = {},
  children,
  className,
  isRoot = false,
  colorMode,
  radius,
  columnGap,
  ...restProps
}) => {
  const radiusVar = themeRadiusVar(radius);
  const columnGapVar = themeColumnGapVar(columnGap);
  const radiusHelper = (validRadii as readonly unknown[]).includes(radius)
    ? radius
    : undefined;

  // A radius size only adds its class, and a root Theme renders no wrapper to
  // carry one, so on `isRoot` it does nothing at all. Say so, as the other
  // radius routes that do not do what they look like do.
  if (isRoot && radiusHelper && radiusHelperVars[radiusHelper] === undefined) {
    warnOnce(
      'Theme:root-radius-size',
      `[bestax-bulma] <Theme isRoot radius="${radiusHelper}">: a root Theme ` +
        `has no wrapper element for has-radius-${radiusHelper}, and the ` +
        'radius sizes set no variable, so this does nothing. To round one ' +
        `element, put radius="${radiusHelper}" on it. To change the radius ` +
        "across the page, set bulmaVars={{ '--bulma-radius': '…' }} instead."
    );
  }

  // The same for a gap step in `columnGap`, which reads like the columns
  // gutter it once set and, at the root, has no element for its class.
  const columnGapStep =
    typeof columnGap === 'number' ? String(columnGap) : columnGap;
  if (
    isRoot &&
    columnGapStep !== undefined &&
    (validGaps as readonly unknown[]).includes(columnGapStep)
  ) {
    warnOnce(
      'Theme:root-column-gap',
      `[bestax-bulma] <Theme isRoot columnGap="${columnGapStep}">: a root ` +
        `Theme has no wrapper element for is-column-gap-${columnGapStep}, ` +
        'and a gap step sets no variable, so this does nothing. To change ' +
        'the columns gutter across the page, set ' +
        "bulmaVars={{ '--bulma-column-gap': '…' }} instead."
    );
  }

  // Extract Bulma variable props from restProps
  const { bulmaVarProps, otherProps } = useMemo(() => {
    const varProps: Record<string, string | undefined> = {};
    const otherPropsObj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(restProps)) {
      if (Object.prototype.hasOwnProperty.call(bulmaVarPropMap, key)) {
        varProps[key] = value as string;
      } else {
        otherPropsObj[key] = value;
      }
    }

    return { bulmaVarProps: varProps, otherProps: otherPropsObj };
  }, [restProps]);

  // Use Bulma classes for styling (only when not isRoot). Only a helper value
  // of `radius` reaches the helper; a legacy string went to the variable.
  const { bulmaHelperClasses, rest } = useBulmaClasses({
    ...otherProps,
    radius: radiusHelper,
    columnGap,
  });

  // Merge bulmaVars and individual props, with props taking precedence
  const mergedVars: BulmaVars = useMemo(() => {
    const vars: BulmaVars = { ...bulmaVars };
    for (const [propName, cssVar] of Object.entries(bulmaVarPropMap)) {
      if (bulmaVarProps[propName] !== undefined) {
        vars[cssVar as BulmaVarKey] = bulmaVarProps[propName] as string;
      }
    }
    if (radiusVar !== undefined) {
      vars['--bulma-radius'] = radiusVar;
    }
    if (columnGapVar !== undefined) {
      vars['--bulma-column-gap'] = columnGapVar;
    }
    return vars;
  }, [bulmaVars, bulmaVarProps, radiusVar, columnGapVar]);

  // This Theme's place among root Themes; see `rootThemeRules`.
  const [rootOrder] = useState(() => nextRootOrder++);

  // The `:root` rules this Theme contributes, or '' when it contributes none.
  const rootRules = useMemo(() => {
    if (!isRoot) {
      return '';
    }
    const cssRules = Object.entries(mergedVars)
      .filter(
        ([key, value]) => bulmaCssVars.includes(key as BulmaVarKey) && value
      )
      .map(([key, value]) => `${key}: ${value};`)
      .join(' ');
    return cssRules ? `:root { ${cssRules} }` : '';
  }, [mergedVars, isRoot]);

  // Inject CSS variables globally at :root level, alongside any other root
  // Themes. Clearing `isRoot` or every variable passes '', which withdraws
  // this Theme's rules.
  useEffect(() => {
    setRootThemeRules(rootOrder, rootRules);
  }, [rootOrder, rootRules]);

  // Withdraw them on unmount. Kept apart from the effect above so a change
  // rewrites the shared element in place rather than removing and recreating
  // it between the cleanup and the next run.
  useEffect(() => () => setRootThemeRules(rootOrder, ''), [rootOrder]);

  // Bulma names its scheme attribute after the class prefix a stylesheet was
  // built with (`data-<prefix>theme`), so the prefixed builds read
  // `data-bestax-theme` and never `data-theme`.
  const classPrefix = useClassPrefix();

  // Toggle Bulma's light/dark scheme by writing the theme attribute on the
  // document root (<html>). This is always global, even on a scoped Theme.
  // Under a class prefix the prefixed attribute is written as well as
  // `data-theme`, so whichever build is loaded sees it; with no prefix only
  // `data-theme` is. `'system'` removes them so Bulma follows the OS
  // preference.
  useEffect(() => {
    if (colorMode === undefined) {
      return;
    }

    const root = document.documentElement;
    const names = classPrefix
      ? ['data-theme', `data-${classPrefix}theme`]
      : ['data-theme'];
    const previous = names.map(name => root.getAttribute(name));

    for (const name of names) {
      if (colorMode === 'system') {
        root.removeAttribute(name);
        continue;
      }
      try {
        root.setAttribute(name, colorMode);
      } catch {
        // A class prefix can hold characters an attribute name cannot.
        // `data-theme` is still written, as it was before the prefixed
        // attribute existed, but a sheet built with that prefix keeps its
        // scheme, so say so.
        warnOnce(
          'Theme:color-mode-prefix',
          `[bestax-bulma] <Theme colorMode="${colorMode}">: the class ` +
            `prefix "${classPrefix}" makes ${name} an invalid attribute ` +
            'name, so only data-theme is written, and a stylesheet built ' +
            'with that prefix keeps its scheme.'
        );
      }
    }

    // Restore the previous values when colorMode changes or the component unmounts.
    return () => {
      names.forEach((name, i) => {
        const value = previous[i];
        if (value === null) {
          root.removeAttribute(name);
        } else {
          root.setAttribute(name, value);
        }
      });
    };
  }, [colorMode, classPrefix]);

  // For local injection (when isRoot is false), prepare style object for CSS vars
  const style: CSSProperties = useMemo(() => {
    if (isRoot) {
      return {};
    }

    const styleObj: CSSProperties = {};
    for (const [key, value] of Object.entries(mergedVars)) {
      if (bulmaCssVars.includes(key as BulmaVarKey) && value) {
        (styleObj as Record<string, string>)[key] = value;
      }
    }
    return styleObj;
  }, [mergedVars, isRoot]);

  // Generate combined class names for the wrapper div
  const combinedClassName = useMemo(() => {
    if (isRoot) {
      return '';
    }
    return classNames(className, bulmaHelperClasses);
  }, [className, bulmaHelperClasses, isRoot]);

  return isRoot ? (
    <>{children}</>
  ) : (
    <div className={combinedClassName || undefined} style={style} {...rest}>
      {children}
    </div>
  );
};
