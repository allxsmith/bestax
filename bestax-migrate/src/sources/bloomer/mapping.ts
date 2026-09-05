/**
 * bloomer (0.6) → @allxsmith/bestax-bulma mapping tables.
 *
 * Data only — no AST work. `MAPPING` is the single source of truth for what
 * the transform does with each bloomer export; `BLOOMER_EXPORTS` vendors
 * bloomer's public surface so `mapping-coverage.test.ts` can close it in both
 * directions.
 *
 * bloomer's shape is the reverse of rbx's: every export is a FLAT name
 * (`CardHeaderTitle`, `NavbarItem`), while bestax groups the same components
 * into dotted compounds (`Card.Header.Title`, `Navbar.Item`). So most rows
 * here rename a flat identifier onto a dotted target — a shape the rename and
 * value-reference passes already build, since the first segment of a dotted
 * target is what gets imported.
 *
 * Its modifier vocabulary is already bestax's for the booleans (`isActive`,
 * `isLoading`, `isOutlined`, …) — those are `{}` entries, present so the
 * universal pass never sees them. What differs is the value-carrying props:
 * `isColor` → `color`, `isSize` → `size` (claimed per component, because its
 * type differs per component: numeric on Title/Subtitle, sizes-or-fractions on
 * Column, `'128x128'` on Image, `'large'` elsewhere), `isAlign` → whatever
 * the target calls it, and `tag` → `as` where bestax declares one.
 */

import type { ComponentMapping, PropAction } from '../../types.js';

const DOCS = 'https://bestax.io/docs';

/**
 * The two Bulma 0.6 shades bestax's `validColors` does not carry. Every other
 * colour and shade name of that era exists in bestax verbatim.
 */
const SHADE_TODO = {
  'white-ter': `\`white-ter\` is not a bestax colour; use \`white\` or a custom class (${DOCS}/api/helpers/usebulmaclasses)`,
  'white-bis': `\`white-bis\` is not a bestax colour; use \`white\` or a custom class (${DOCS}/api/helpers/usebulmaclasses)`,
};

/**
 * `tag` is on nearly every bloomer component (`Bulma.Tag`, rendered through
 * `React.createElement(tag, …)`), but bestax declares `as` on only some
 * components, several of them constrained to a literal union (`Footer` is
 * `'footer' | 'div'`). So the default is a TODO, and the components whose
 * bestax counterpart really does accept `as` opt in with `TAG_AS` in their
 * own prop map, which runs first and wins. A literal outside the target's
 * union still surfaces — as a type error the user can see, not a rewrite.
 */
const TAG_TODO: PropAction = {
  todo: `bloomer's \`tag\` renders a different HTML element; bestax declares \`as\` on only some components, and this is not one of them — render the tag directly or restructure (${DOCS}/api)`,
};
const TAG_AS: PropAction = { rename: 'as' };

/**
 * `render` (`Bulma.Render`) let a component hand its computed props to a
 * custom renderer. bestax has no render-prop escape hatch, and there is no
 * way to rewrite a function value into markup, so it is always a TODO.
 */
export const RENDER_TODO: PropAction = {
  todo: `bloomer's \`render\` prop injected the computed props into your own renderer; bestax has no render-prop escape hatch — render the markup directly (\`useBulmaClasses\` yields the helper classes) or wrap the component (${DOCS}/api/helpers/usebulmaclasses)`,
};

/**
 * `isFullWidth` is universal in bloomer (via `withHelpersModifiers`), but
 * Bulma's `is-fullwidth` only means something on a handful of elements, and
 * bestax declares `isFullWidth` on exactly those: Button, Select, Table and
 * Tabs opt in with `FULLWIDTH_OK`.
 */
const FULLWIDTH_TODO: PropAction = {
  todo: 'bestax declares `isFullWidth` on Button, Select, Table and Tabs only, and Bulma\'s `is-fullwidth` has no effect elsewhere — drop it, or add className="is-fullwidth" if your own CSS relied on the class',
};
const FULLWIDTH_OK: PropAction = {};

const size: PropAction = { rename: 'size' };
const color: PropAction = { rename: 'color' };
const active: PropAction = { rename: 'active' };

/** A Bulma modifier bestax has no prop for on this target; the class still exists in v1. */
const classTodo = (cls: string, target: string): PropAction => ({
  todo: `bestax \`${target}\` has no prop for Bulma's \`${cls}\`; add className="${cls}"`,
});

const NAV_TODO = (name: string): ComponentMapping => ({
  status: 'todo',
  todo: `\`${name}\` is Bulma 0.4's \`.nav\`, which Bulma removed in 0.5 (bloomer kept the component); rebuild it with bestax's \`Navbar\` — \`Nav\` → \`Navbar\`, \`NavLeft\`/\`NavRight\` → \`Navbar.Start\`/\`Navbar.End\`, \`NavItem\` → \`Navbar.Item\`, \`NavToggle\` → \`Navbar.Burger\` (${DOCS}/api/components/navbar)`,
});

/**
 * bestax's `Message.color` is the six semantic colours; bloomer's `isColor`
 * is any string. The Bulma 0.6 colours outside that union are named so they
 * become a TODO instead of a silent type error.
 */
const MESSAGE_COLOR_TODO = Object.fromEntries(
  ['white', 'black', 'light', 'dark'].map(c => [
    c,
    `bestax \`Message\` takes only the semantic colours (primary … danger); use \`bgColor="${c}"\` or a custom class`,
  ])
);

/**
 * Helper props `withHelpersModifiers` mixes into EVERY bloomer component.
 * Applied after each component's own prop map, to whatever attributes are
 * left.
 *
 * `isDisplay` and `isHidden` are deliberately absent: they are consumed
 * structurally by responsive.ts before this pass runs (their values are
 * strings, arrays or objects that flatten to several bestax props), and
 * bestax has no prop of either name, so a leftover would be an
 * excess-property type error rather than a TODO.
 */
export const UNIVERSAL_PROPS: Record<string, PropAction> = {
  // --- typography ----------------------------------------------------------
  hasTextAlign: { rename: 'textAlign' }, // left | right | centered — same union
  hasTextColor: { rename: 'textColor', valueTodo: SHADE_TODO },

  // --- float / overlay -----------------------------------------------------
  isPulled: { rename: 'float' }, // left | right — same union
  isClearfix: { booleanToProp: { name: 'clearfix' } },
  isOverlay: { booleanToProp: { name: 'overlay' } },
  isUnselectable: {
    booleanToProp: { name: 'interaction', value: 'unselectable' },
  },

  // --- spacing: bestax expresses the `is-*less` helpers as `m`/`p` --------
  isMarginless: { booleanToProp: { name: 'm', value: '0' } },
  isPaddingless: { booleanToProp: { name: 'p', value: '0' } },

  // Per-component maps override these where bestax has the prop.
  isFullWidth: FULLWIDTH_TODO,
  tag: TAG_TODO,
  render: RENDER_TODO,
};

/**
 * The helper props responsive.ts consumes. Named here so the plain-element
 * path can strip them from an element that is becoming intrinsic HTML: the
 * structural pass runs before the rename step, which a `replaced: true`
 * special skips.
 */
export const RESPONSIVE_PROPS: Record<string, string | null> = {
  isDisplay: null,
  isHidden: null,
};

/** Bloomer's fraction and width spellings → bestax's `BulmaColumnSize` names. */
export const COLUMN_SIZE_MAP: Record<string, string> = {
  '1/2': 'half',
  '1/3': 'one-third',
  '1/4': 'one-quarter',
  '2/3': 'two-thirds',
  '3/4': 'three-quarters',
  full: 'full',
};

export const MAPPING: Record<string, ComponentMapping> = {
  // ---- grid ---------------------------------------------------------------
  Columns: {
    status: 'mapped',
    target: 'Columns',
    props: {
      isMobile: {},
      isDesktop: {},
      isGapless: {},
      isMultiline: {},
      isVCentered: {},
      isCentered: {},
      isGrid: {
        todo: 'Bulma removed `columns.is-grid` in 0.5; bestax `Columns` has no equivalent — use `isMultiline` with sized Columns, or the Grid component',
      },
    },
  },
  // `isSize` / `isOffset` (numbers, fractions, or a per-breakpoint object)
  // are flattened by responsive.ts, which the `column` special opts into.
  Column: { status: 'mapped', target: 'Column', special: 'column' },
  Tile: {
    status: 'todo',
    todo: `Bulma v1 replaced tiles with the Grid/Cell components — see ${DOCS}/api/grid and the migration guide ${DOCS}/guides/getting-started/migration/bulma-0-9-to-1`,
  },

  // ---- elements -----------------------------------------------------------
  Box: { status: 'mapped', target: 'Box' },
  Button: {
    status: 'mapped',
    target: 'Button',
    // `isLink` and `href` are handled by the special: the first is a colour
    // that may collide with `isColor`, the second selects the anchor form.
    special: 'button',
    props: {
      isColor: color,
      isSize: size,
      isOutlined: {},
      isInverted: {},
      isStatic: {},
      isActive: {},
      isHovered: {},
      isFocused: {},
      isLoading: {},
      isFullWidth: FULLWIDTH_OK,
    },
  },
  Content: { status: 'mapped', target: 'Content', props: { isSize: size } },
  Delete: {
    status: 'mapped',
    target: 'Delete',
    props: {
      isSize: size,
      href: {
        todo: 'bestax `Delete` renders a <button> and has no anchor form; wrap it in an <a>, or handle the navigation in `onClick`',
      },
    },
  },
  Icon: {
    status: 'partial',
    target: 'Icon',
    special: 'icon',
    props: { isSize: size },
  },
  Image: { status: 'mapped', target: 'Image', special: 'image' },
  Notification: {
    status: 'mapped',
    target: 'Notification',
    props: { isColor: color },
  },
  Progress: {
    status: 'mapped',
    target: 'Progress',
    props: { isColor: color, isSize: size },
  },
  Table: {
    status: 'mapped',
    target: 'Table',
    props: {
      isBordered: {},
      isStriped: {},
      isNarrow: {},
      isFullWidth: FULLWIDTH_OK,
    },
  },
  Tag: {
    status: 'mapped',
    target: 'Tag',
    props: { isColor: color, isSize: size },
  },
  // bestax's `Title.size` accepts the numbers 1–6 as well as their string
  // forms, so bloomer's numeric `isSize` carries over untouched.
  Title: {
    status: 'mapped',
    target: 'Title',
    props: { isSize: size, isSpaced: {}, tag: TAG_AS },
  },
  Subtitle: {
    status: 'mapped',
    target: 'SubTitle',
    props: {
      isSize: size,
      isSpaced: classTodo('is-spaced', 'SubTitle'),
      tag: TAG_AS,
    },
  },
  // bloomer's Heading is Bulma's `.heading` label, whose styles Bulma v1 no
  // longer ships — bestax has no component for it.
  Heading: { status: 'partial', special: 'heading' },

  // ---- form ---------------------------------------------------------------
  Checkbox: { status: 'mapped', target: 'Checkbox' },
  Radio: { status: 'mapped', target: 'Radio' },
  Control: {
    status: 'mapped',
    target: 'Control',
    special: 'control-icons',
    props: { isExpanded: {}, isLoading: {}, tag: TAG_AS },
  },
  Help: { status: 'mapped', special: 'help' },
  Input: {
    status: 'mapped',
    target: 'Input',
    props: {
      isColor: color,
      isSize: size,
      isHovered: {},
      isFocused: {},
      isActive: classTodo('is-active', 'Input'),
    },
  },
  Label: { status: 'mapped', special: 'label' },
  Select: {
    status: 'mapped',
    target: 'Select',
    props: {
      isColor: color,
      isSize: size,
      isLoading: {},
      isFullWidth: FULLWIDTH_OK,
    },
  },
  TextArea: {
    status: 'mapped',
    target: 'TextArea',
    props: { isSize: size, isActive: {}, isHovered: {}, isFocused: {} },
  },
  Field: {
    status: 'mapped',
    target: 'Field',
    props: {
      // `boolean | 'right' | 'centered'` on both sides.
      isGrouped: { rename: 'grouped' },
      hasAddons: {
        valueTodo: {
          fullwidth:
            'bestax `Field.hasAddons` takes `true`, "centered" or "right"; Bulma v1 keeps `has-addons-fullwidth`, so use `hasAddons` plus className="has-addons-fullwidth"',
        },
      },
      isHorizontal: { rename: 'horizontal' },
    },
  },
  FieldBody: { status: 'mapped', target: 'Field.Body' },
  FieldLabel: {
    status: 'mapped',
    target: 'Field.Label',
    props: {
      isSize: size,
      isNormal: { booleanToProp: { name: 'size', value: 'normal' } },
    },
  },

  // ---- breadcrumb ---------------------------------------------------------
  Breadcrumb: {
    status: 'mapped',
    target: 'Breadcrumb',
    props: {
      hasSeparator: { rename: 'separator' },
      isAlign: { rename: 'alignment' }, // centered | right — same union
      isSize: size,
    },
  },
  // bestax's Breadcrumb renders the <ul> and takes plain <li> children.
  BreadcrumbItem: { status: 'mapped', special: 'breadcrumb-item' },

  // ---- card ---------------------------------------------------------------
  Card: { status: 'mapped', target: 'Card' },
  CardImage: { status: 'mapped', target: 'Card.Image' },
  CardContent: { status: 'mapped', target: 'Card.Content' },
  CardHeader: { status: 'mapped', target: 'Card.Header' },
  CardHeaderTitle: { status: 'mapped', target: 'Card.Header.Title' },
  CardHeaderIcon: {
    status: 'mapped',
    target: 'Card.Header.Icon',
    props: {
      href: {
        todo: 'bestax `Card.Header.Icon` renders a <button>; put an <a> inside it, or handle the navigation in `onClick`',
      },
    },
  },
  CardFooter: { status: 'mapped', target: 'Card.Footer' },
  CardFooterItem: {
    status: 'mapped',
    target: 'Card.FooterItem',
    props: {
      href: {
        todo: 'bestax `Card.FooterItem` renders a <span> with no anchor form; put an <a> inside it',
      },
    },
  },

  // ---- dropdown -----------------------------------------------------------
  // bestax's Dropdown takes a `label` and renders its own trigger and menu, so
  // bloomer's trigger/menu/content wrappers have nothing to become.
  Dropdown: {
    status: 'partial',
    target: 'Dropdown',
    special: 'dropdown',
    props: {
      isActive: active,
      isHoverable: { rename: 'hoverable' },
      isAlign: { valueMap: { right: 'right' }, valueToProp: true },
    },
  },
  DropdownTrigger: {
    status: 'todo',
    todo: 'bestax `Dropdown` renders its own trigger; move this content into its `label` prop and drop the wrapper',
  },
  DropdownMenu: {
    status: 'todo',
    todo: 'bestax `Dropdown` renders its own menu; drop this wrapper and keep the `<Dropdown.Item>`s as direct children',
  },
  DropdownContent: {
    status: 'todo',
    todo: 'bestax `Dropdown` renders its own menu content; drop this wrapper and keep the `<Dropdown.Item>`s as direct children',
  },
  DropdownItem: {
    status: 'mapped',
    target: 'Dropdown.Item',
    special: 'anchor-when-href',
    props: { isActive: active, tag: TAG_AS },
  },
  DropdownDivider: { status: 'mapped', target: 'Dropdown.Divider' },

  // ---- level / media / menu / message ------------------------------------
  Level: { status: 'mapped', target: 'Level', props: { isMobile: {} } },
  LevelItem: {
    status: 'mapped',
    target: 'Level.Item',
    special: 'level-item',
    props: { isFlexible: classTodo('is-flexible', 'Level.Item'), tag: TAG_AS },
  },
  LevelLeft: { status: 'mapped', target: 'Level.Left' },
  LevelRight: { status: 'mapped', target: 'Level.Right' },
  Media: {
    status: 'mapped',
    target: 'Media',
    props: { isSize: classTodo('is-large', 'Media'), tag: TAG_AS },
  },
  MediaContent: { status: 'mapped', target: 'Media.Content' },
  MediaLeft: { status: 'mapped', target: 'Media.Left', props: { tag: TAG_AS } },
  MediaRight: { status: 'mapped', target: 'Media.Right' },
  Menu: { status: 'mapped', target: 'Menu' },
  MenuLabel: { status: 'mapped', target: 'Menu.Label' },
  MenuList: { status: 'mapped', target: 'Menu.List' },
  MenuLink: {
    status: 'mapped',
    target: 'Menu.Item',
    special: 'anchor-when-href',
    props: { isActive: active, tag: TAG_AS },
  },
  Message: {
    status: 'mapped',
    target: 'Message',
    props: { isColor: { rename: 'color', valueTodo: MESSAGE_COLOR_TODO } },
  },
  MessageHeader: { status: 'mapped', target: 'Message.Header' },
  MessageBody: { status: 'mapped', target: 'Message.Body' },

  // ---- modal --------------------------------------------------------------
  Modal: {
    status: 'partial',
    target: 'Modal',
    special: 'modal',
    props: { isActive: active },
  },
  ModalBackground: { status: 'mapped', target: 'Modal.Background' },
  ModalContent: { status: 'mapped', target: 'Modal.Content' },
  ModalClose: {
    status: 'mapped',
    target: 'Modal.Close',
    props: { isSize: size },
  },
  ModalCard: { status: 'mapped', target: 'Modal.Card' },
  ModalCardHeader: { status: 'mapped', target: 'Modal.Card.Head' },
  ModalCardTitle: { status: 'mapped', target: 'Modal.Card.Title' },
  ModalCardBody: { status: 'mapped', target: 'Modal.Card.Body' },
  ModalCardFooter: { status: 'mapped', target: 'Modal.Card.Foot' },

  // ---- nav (Bulma 0.4) ----------------------------------------------------
  Nav: NAV_TODO('Nav'),
  NavLeft: NAV_TODO('NavLeft'),
  NavCenter: NAV_TODO('NavCenter'),
  NavRight: NAV_TODO('NavRight'),
  NavToggle: NAV_TODO('NavToggle'),
  NavItem: NAV_TODO('NavItem'),

  // ---- navbar -------------------------------------------------------------
  Navbar: {
    status: 'mapped',
    target: 'Navbar',
    props: { isTransparent: { rename: 'transparent' } },
  },
  NavbarBrand: { status: 'mapped', target: 'Navbar.Brand' },
  NavbarBurger: {
    status: 'mapped',
    target: 'Navbar.Burger',
    props: { isActive: active },
  },
  NavbarMenu: {
    status: 'mapped',
    target: 'Navbar.Menu',
    props: { isActive: active },
  },
  NavbarStart: { status: 'mapped', target: 'Navbar.Start' },
  NavbarEnd: { status: 'mapped', target: 'Navbar.End' },
  // `hasDropdown` picks between Navbar.Item and the Navbar.Dropdown container.
  NavbarItem: {
    status: 'mapped',
    special: 'navbar-item',
    props: { isActive: active, tag: TAG_AS },
  },
  NavbarLink: {
    status: 'mapped',
    target: 'Navbar.Link',
    props: { isActive: classTodo('is-active', 'Navbar.Link'), tag: TAG_AS },
  },
  NavbarDropdown: { status: 'mapped', special: 'navbar-dropdown' },
  NavbarDivider: {
    status: 'mapped',
    target: 'Navbar.Divider',
    props: { isBoxed: classTodo('is-boxed', 'Navbar.Divider') },
  },

  // ---- pagination ---------------------------------------------------------
  Pagination: {
    status: 'mapped',
    target: 'Pagination',
    special: 'pagination',
    props: { isSize: size },
  },
  PageControl: {
    status: 'mapped',
    special: 'page-control',
    props: {
      isActive: classTodo('is-active', 'Pagination.Previous/Next'),
      isFocused: classTodo('is-focused', 'Pagination.Previous/Next'),
    },
  },
  PageEllipsis: {
    status: 'mapped',
    target: 'Pagination.Ellipsis',
    props: {
      isActive: classTodo('is-active', 'Pagination.Ellipsis'),
      isFocused: classTodo('is-focused', 'Pagination.Ellipsis'),
    },
  },
  // bestax's Pagination.Link and Pagination.Ellipsis render their own <li>.
  Page: { status: 'mapped', special: 'page' },
  PageList: { status: 'mapped', target: 'Pagination.List' },
  PageLink: {
    status: 'mapped',
    target: 'Pagination.Link',
    props: {
      isCurrent: active, // bestax's `active` renders Bulma's `is-current`
      isActive: classTodo('is-active', 'Pagination.Link'),
      isFocused: classTodo('is-focused', 'Pagination.Link'),
    },
  },

  // ---- panel --------------------------------------------------------------
  Panel: { status: 'mapped', target: 'Panel' },
  PanelHeading: { status: 'mapped', target: 'Panel.Heading' },
  PanelTabs: { status: 'mapped', target: 'Panel.Tabs' },
  PanelTab: { status: 'mapped', special: 'panel-tab' },
  PanelBlock: {
    status: 'mapped',
    target: 'Panel.Block',
    special: 'anchor-when-href',
    props: {
      isActive: active,
      isWrapped: classTodo('is-wrapped', 'Panel.Block'),
    },
  },
  PanelIcon: {
    status: 'partial',
    target: 'Panel.Icon',
    special: 'panel-icon',
  },

  // ---- tabs ---------------------------------------------------------------
  Tabs: {
    status: 'mapped',
    target: 'Tabs',
    props: {
      isAlign: { rename: 'align' }, // left | centered | right — same union
      isSize: size,
      isBoxed: { rename: 'boxed' },
      isToggle: { rename: 'toggle' },
      isFullWidth: FULLWIDTH_OK,
    },
  },
  TabList: {
    status: 'mapped',
    target: 'Tabs.List',
    props: {
      isAlign: {
        todo: "Bulma aligns tabs on the `.tabs` container, not the list (bloomer's `is-center` on the <ul> did nothing); set `align` on the `<Tabs>` instead",
      },
    },
  },
  // bestax's `Tabs.Tab` is the controlled API and requires an `index`;
  // `Tabs.Item` is the plain <li> that bloomer's Tab actually is.
  Tab: { status: 'mapped', target: 'Tabs.Item', props: { isActive: active } },
  TabLink: { status: 'mapped', special: 'tab-link' },

  // ---- layout -------------------------------------------------------------
  Container: {
    status: 'mapped',
    target: 'Container',
    props: { isFluid: { rename: 'fluid' } },
  },
  Footer: { status: 'mapped', target: 'Footer', props: { tag: TAG_AS } },
  Section: { status: 'mapped', target: 'Section', props: { isSize: size } },
  Hero: {
    status: 'mapped',
    target: 'Hero',
    props: {
      isColor: color,
      isSize: size,
      isFullHeight: { booleanToProp: { name: 'size', value: 'fullheight' } },
      isHalfHeight: classTodo('is-halfheight', 'Hero'),
      isBold: classTodo('is-bold', 'Hero'),
    },
  },
  HeroHeader: { status: 'mapped', target: 'Hero.Head' },
  HeroBody: { status: 'mapped', target: 'Hero.Body' },
  HeroVideo: { status: 'mapped', special: 'hero-video' },
  HeroFooter: { status: 'mapped', target: 'Hero.Foot' },

  // ---- the helper HOC -----------------------------------------------------
  withHelpersModifiers: {
    status: 'todo',
    todo: `\`withHelpersModifiers\` wrapped a component so it accepted bloomer's helper props; every bestax component takes the same helpers natively, and a custom component can call \`useBulmaClasses\` itself (${DOCS}/api/helpers/usebulmaclasses)`,
  },
};

/**
 * bloomer's public export surface, vendored from `src/index.ts` at the SHA
 * `scripts/validate-corpus-bloomer.mjs` pins, in that file's order. Every
 * export is flat, so no entry carries sub-paths; the shape matches the other
 * sources' tables so the coverage and doc tests port unchanged.
 *
 * `mapping-coverage.test.ts` walks this against `MAPPING` in both directions,
 * so bloomer coverage cannot silently regress and `MAPPING` cannot grow an
 * entry for something bloomer never exported.
 */
export const BLOOMER_EXPORTS: Record<string, string[]> = Object.fromEntries(
  [
    // grid
    'Columns',
    'Column',
    'Tile',
    // elements
    'Box',
    'Button',
    'Content',
    'Delete',
    'Icon',
    'Image',
    'Notification',
    'Progress',
    'Table',
    'Tag',
    'Title',
    'Subtitle',
    'Heading',
    // form
    'Checkbox',
    'Control',
    'Help',
    'Input',
    'Label',
    'Radio',
    'Select',
    'TextArea',
    'Field',
    'FieldBody',
    'FieldLabel',
    // breadcrumb
    'Breadcrumb',
    'BreadcrumbItem',
    // card
    'Card',
    'CardImage',
    'CardContent',
    'CardHeader',
    'CardHeaderTitle',
    'CardHeaderIcon',
    'CardFooter',
    'CardFooterItem',
    // dropdown
    'Dropdown',
    'DropdownContent',
    'DropdownDivider',
    'DropdownItem',
    'DropdownMenu',
    'DropdownTrigger',
    // level
    'Level',
    'LevelItem',
    'LevelLeft',
    'LevelRight',
    // media
    'Media',
    'MediaContent',
    'MediaLeft',
    'MediaRight',
    // menu
    'Menu',
    'MenuLabel',
    'MenuList',
    'MenuLink',
    // message
    'Message',
    'MessageHeader',
    'MessageBody',
    // modal
    'Modal',
    'ModalBackground',
    'ModalContent',
    'ModalClose',
    'ModalCard',
    'ModalCardHeader',
    'ModalCardTitle',
    'ModalCardBody',
    'ModalCardFooter',
    // nav
    'Nav',
    'NavLeft',
    'NavCenter',
    'NavRight',
    'NavToggle',
    'NavItem',
    // navbar
    'Navbar',
    'NavbarBrand',
    'NavbarBurger',
    'NavbarMenu',
    'NavbarStart',
    'NavbarEnd',
    'NavbarItem',
    'NavbarLink',
    'NavbarDropdown',
    'NavbarDivider',
    // pagination
    'Pagination',
    'PageControl',
    'PageEllipsis',
    'Page',
    'PageList',
    'PageLink',
    // panel
    'Panel',
    'PanelHeading',
    'PanelTabs',
    'PanelTab',
    'PanelBlock',
    'PanelIcon',
    // tabs
    'Tabs',
    'Tab',
    'TabList',
    'TabLink',
    // layout
    'Container',
    'Footer',
    'Section',
    'Hero',
    'HeroHeader',
    'HeroBody',
    'HeroVideo',
    'HeroFooter',
    // the HOC
    'withHelpersModifiers',
  ].map(name => [name, []])
);

/** Walk a dotted component path through `MAPPING`. */
export function resolveMapping(path: string[]): ComponentMapping | undefined {
  let current: ComponentMapping | undefined = MAPPING[path[0]];
  for (const segment of path.slice(1)) {
    current = current?.subs?.[segment];
  }
  return current;
}
