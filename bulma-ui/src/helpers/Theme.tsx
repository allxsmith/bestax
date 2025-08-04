import React, { useEffect, useMemo, ReactNode, CSSProperties } from 'react';
import classNames from './classNames';
import { useBulmaClasses, BulmaClassesProps } from './useBulmaClasses';

// --- FULL Bulma v1 CSS variable keys (auto-generated from CSSVAR_KEYS) ---
const bulmaCssVars = [
  // scheme
  '--bulma-scheme-h',
  '--bulma-scheme-s',
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

type BulmaVarKey = (typeof bulmaCssVars)[number];
type BulmaVars = Partial<Record<BulmaVarKey, string>>;

// Utility: Convert Bulma CSS var to camelCase prop name (e.g., --bulma-primary-h -> primaryH)
function cssVarToProp(varName: string): string {
  return varName
    .replace(/^--bulma-/, '')
    .split('-')
    .map((part, i) =>
      i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');
}

// Generate prop names and mapping
const bulmaVarPropMap = Object.fromEntries(
  bulmaCssVars.map(cssVar => [cssVarToProp(cssVar), cssVar])
) as Record<string, string>;

// Explicitly define the props interface to avoid index signature conflicts
export interface ThemeProps
  extends Omit<BulmaClassesProps, 'color' | 'backgroundColor'> {
  children: ReactNode;
  className?: string;
  isRoot?: boolean;
  bulmaVars?: BulmaVars;
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
 * Theme injects Bulma CSS variables as a wrapper component.
 * - className: Additional CSS classes to apply to the wrapper div (when isRoot=false)
 * - bulmaVars: An object mapping Bulma CSS variable names to values.
 * - isRoot: If true, CSS variables are injected globally at :root level. If false (default), they're injected locally on a wrapping div.
 * - Individual props for each Bulma CSS variable (e.g., primaryH, schemeH, etc.)
 * - Supports all BulmaClassesProps for additional styling when isRoot=false
 */
export const Theme: React.FC<ThemeProps> = ({
  bulmaVars = {},
  children,
  className,
  isRoot = false,
  ...restProps
}) => {
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

  // Use Bulma classes for styling (only when not isRoot)
  const { bulmaHelperClasses, rest } = useBulmaClasses(otherProps);

  // Merge bulmaVars and individual props, with props taking precedence
  const mergedVars: BulmaVars = useMemo(() => {
    const vars: BulmaVars = { ...bulmaVars };
    for (const [propName, cssVar] of Object.entries(bulmaVarPropMap)) {
      if (bulmaVarProps[propName] !== undefined) {
        vars[cssVar as BulmaVarKey] = bulmaVarProps[propName] as string;
      }
    }
    return vars;
  }, [bulmaVars, bulmaVarProps]);

  // Inject CSS variables globally at :root level
  useEffect(() => {
    if (!isRoot) {
      return;
    }

    const validVars = Object.entries(mergedVars).filter(
      ([key, value]) => bulmaCssVars.includes(key as BulmaVarKey) && value
    );

    if (validVars.length === 0) {
      return;
    }

    // Create and inject a style element for global CSS variables
    const styleId = 'bestax-bulma-theme-vars';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const cssRules = validVars
      .map(([key, value]) => `${key}: ${value};`)
      .join(' ');
    styleElement.textContent = `:root { ${cssRules} }`;

    // Cleanup function to remove the style element when component unmounts
    return () => {
      const element = document.getElementById(styleId);
      if (element) {
        element.remove();
      }
    };
  }, [mergedVars, isRoot]);

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
