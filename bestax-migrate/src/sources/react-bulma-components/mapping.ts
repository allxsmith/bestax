/**
 * Declarative react-bulma-components (v4) → @allxsmith/bestax-bulma mapping.
 *
 * Every entry was verified against the react-bulma-components 4.1.0 type
 * declarations on one side and bulma-ui/src on the other. `special` keys are
 * implemented in transform.ts — they cover structural conversions a rename
 * table can't express (align-driven targets, child rewrites, unwrapping).
 *
 * The mapping-coverage test asserts every name in RBC_EXPORTS (and every
 * compound sub listed there) resolves to an entry here, so extending coverage
 * later is a table edit that cannot silently regress.
 */

import type { ComponentMapping, PropAction } from '../../types.js';

const DOCS = 'https://bestax.io/docs';

/** Bulma spacing values are string unions in bestax ('0'–'6'). */
const spacing: PropAction = { numberToString: true };

/**
 * Universal RBC modifier props (ElementProps) → bestax useBulmaClasses props.
 * Applied to every element that maps to a bestax component, after the
 * component's own `props` actions.
 */
export const UNIVERSAL_PROPS: Record<string, PropAction> = {
  renderAs: {
    // Only some bestax components are polymorphic; those get a per-component
    // `rename: 'as'` override in MAPPING. Everything else is a semantic
    // element where renderAs has no equivalent.
    todo: 'this bestax component has no `as` prop; restructure the element instead',
  },
  domRef: {
    todo: 'bestax-bulma components do not take domRef; use a ref on a DOM child or wrap the component',
  },
  // ColorProps
  backgroundColor: { rename: 'bgColor' },
  textColor: {},
  colorVariant: {
    todo: "no direct equivalent; use isLight (Button/Notification) or a color shade like textColor='primary-dark'",
  },
  // TypographyProps
  textSize: { numberToString: true },
  textAlign: {
    valueMap: {
      center: 'centered',
      justify: 'justified',
      left: 'left',
      right: 'right',
    },
  },
  textTransform: {},
  textWeight: {},
  textFamily: { rename: 'fontFamily' },
  italic: { booleanToProp: { name: 'textTransform', value: 'italic' } },
  // SpacingProps
  m: spacing,
  mt: spacing,
  mr: spacing,
  mb: spacing,
  ml: spacing,
  mx: spacing,
  my: spacing,
  p: spacing,
  pt: spacing,
  pr: spacing,
  pb: spacing,
  pl: spacing,
  px: spacing,
  py: spacing,
  // HelperProps
  clearfix: {},
  pull: { rename: 'float' },
  marginless: { booleanToProp: { name: 'm', value: '0' } },
  paddingless: { booleanToProp: { name: 'p', value: '0' } },
  overlay: {},
  clipped: { booleanToProp: { name: 'overflow', value: 'clipped' } },
  radiusless: { booleanToProp: { name: 'radius', value: 'radiusless' } },
  shadowless: { booleanToProp: { name: 'shadow', value: 'shadowless' } },
  unselectable: {
    booleanToProp: { name: 'interaction', value: 'unselectable' },
  },
  invisible: { booleanToProp: { name: 'visibility', value: 'invisible' } },
  hidden: { booleanToProp: { name: 'visibility', value: 'hidden' } },
  srOnly: { booleanToProp: { name: 'visibility', value: 'sr-only' } },
  // FlexboxProps carry identical names and values in bestax
  flexDirection: {},
  flexWrap: {},
  justifyContent: {},
  alignContent: {},
  alignItems: {},
  // ResponsiveProps.display (top-level)
  display: {
    valueMap: {
      block: 'block',
      flex: 'flex',
      inline: 'inline',
      'inline-block': 'inline-block',
      'inline-flex': 'inline-flex',
    },
    valueTodo: {
      hidden: "use visibility='hidden' (already a separate bestax prop)",
      relative: 'use the boolean `relative` prop',
    },
  },
};

/** Breakpoint-object props flattened by the responsive pass. */
export const RESPONSIVE_BREAKPOINTS: Record<string, string | null> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
  widescreen: 'Widescreen',
  fullhd: 'Fullhd',
  // No touch/until* helper-class variants exist in bestax-bulma.
  touch: null,
  untilWidescreen: null,
  untilFullhd: null,
};

const activeKept: Record<string, PropAction> = { active: {} };

export const MAPPING: Record<string, ComponentMapping> = {
  Block: { status: 'mapped', target: 'Block' },
  Box: { status: 'mapped', target: 'Box' },
  Breadcrumb: {
    status: 'mapped',
    target: 'Breadcrumb',
    props: {
      align: {
        rename: 'alignment',
        valueMap: { center: 'centered', right: 'right' },
      },
      separator: {},
      size: {},
    },
    subs: {
      // bestax Breadcrumb renders <ul>{children}</ul>; items are plain <li><a>.
      Item: { status: 'mapped', special: 'breadcrumb-item' },
    },
  },
  Button: {
    status: 'mapped',
    target: 'Button',
    special: 'button',
    props: {
      renderAs: { rename: 'as' },
      color: {
        valueTodo: {
          'black-bis':
            'shade colors are not Button colors in bestax; use bgColor/textColor',
          'black-ter':
            'shade colors are not Button colors in bestax; use bgColor/textColor',
          'white-bis':
            'shade colors are not Button colors in bestax; use bgColor/textColor',
          'white-ter':
            'shade colors are not Button colors in bestax; use bgColor/textColor',
          'grey-darker':
            'shade colors are not Button colors in bestax; use bgColor/textColor',
          'grey-dark':
            'shade colors are not Button colors in bestax; use bgColor/textColor',
          'grey-light':
            'shade colors are not Button colors in bestax; use bgColor/textColor',
          'grey-lighter':
            'shade colors are not Button colors in bestax; use bgColor/textColor',
        },
      },
      size: {},
      state: {
        valueMap: {
          active: 'isActive',
          focus: 'isFocused',
          hover: 'isHovered',
        },
        valueToProp: true,
      },
      outlined: { booleanToProp: { name: 'isOutlined' } },
      inverted: { booleanToProp: { name: 'isInverted' } },
      loading: { booleanToProp: { name: 'isLoading' } },
      fullwidth: { booleanToProp: { name: 'isFullWidth' } },
      rounded: { booleanToProp: { name: 'isRounded' } },
      text: { booleanToProp: { name: 'color', value: 'text' } },
      isSelected: {
        todo: 'no bestax equivalent (Bulma is-selected in button groups)',
      },
      submit: { booleanToProp: { name: 'type', value: 'submit' } },
      reset: { booleanToProp: { name: 'type', value: 'reset' } },
    },
    subs: {
      Group: {
        status: 'mapped',
        target: 'Buttons',
        props: {
          hasAddons: {},
          align: {
            valueMap: { center: 'isCentered', right: 'isRight' },
            valueToProp: true,
          },
          size: {
            todo: 'bestax Buttons has no group size; set size on each Button',
          },
        },
      },
    },
  },
  Card: {
    status: 'mapped',
    target: 'Card',
    subs: {
      Image: {
        // RBC Card.Image takes ImageProps itself; bestax Card.Image wraps an
        // inner <Image> — the special moves the props onto a new child.
        status: 'mapped',
        target: 'Card.Image',
        special: 'card-image',
      },
      Content: { status: 'mapped', target: 'Card.Content' },
      Header: {
        status: 'mapped',
        target: 'Card.Header',
        subs: {
          Title: { status: 'mapped', target: 'Card.Header.Title' },
          Icon: { status: 'mapped', target: 'Card.Header.Icon' },
        },
      },
      Footer: {
        status: 'mapped',
        target: 'Card.Footer',
        subs: {
          Item: { status: 'mapped', target: 'Card.FooterItem' },
        },
      },
    },
  },
  Columns: {
    status: 'mapped',
    target: 'Columns',
    special: 'columns',
    props: {
      multiline: { booleanToProp: { name: 'isMultiline' } },
      centered: { booleanToProp: { name: 'isCentered' } },
      vCentered: { booleanToProp: { name: 'isVCentered' } },
      breakpoint: {
        valueMap: { mobile: 'isMobile', desktop: 'isDesktop' },
        valueToProp: true,
        valueTodo: {
          tablet: 'is-tablet is the Bulma default; remove the prop',
          touch: 'no bestax Columns touch breakpoint',
          widescreen: 'no bestax Columns widescreen breakpoint',
          fullhd: 'no bestax Columns fullhd breakpoint',
        },
      },
      gap: {},
    },
    subs: {
      Column: {
        status: 'mapped',
        target: 'Column',
        special: 'column',
        props: {
          size: {},
          offset: {},
          narrow: { booleanToProp: { name: 'isNarrow' } },
        },
      },
    },
  },
  Container: {
    status: 'mapped',
    target: 'Container',
    props: {
      max: { booleanToProp: { name: 'isMax' } },
      breakpoint: {
        // 'tablet' / 'desktop' stay as breakpoint="..." (same prop in bestax)
        valueMap: {
          fluid: 'fluid',
          widescreen: 'widescreen',
          fullhd: 'fullhd',
        },
        valueToProp: true,
        valueTodo: {
          touch: 'no bestax Container touch breakpoint',
          mobile: 'no bestax Container mobile breakpoint',
        },
      },
    },
  },
  Content: {
    status: 'mapped',
    target: 'Content',
    props: { size: {} },
  },
  Dropdown: {
    status: 'partial',
    target: 'Dropdown',
    props: {
      label: {},
      color: {},
      hoverable: {},
      right: {},
      up: {},
      disabled: {},
      align: { valueMap: { right: 'right' }, valueToProp: true },
      closeOnSelect: { rename: 'closeOnClick' },
      value: {
        todo: 'bestax Dropdown is compositional: track the selection yourself and set onClick on each Dropdown.Item',
      },
      onChange: {
        todo: 'bestax Dropdown is compositional: track the selection yourself and set onClick on each Dropdown.Item',
      },
      icon: { todo: 'render the icon inside the label instead' },
      menuId: { drop: true },
    },
    subs: {
      Item: {
        status: 'partial',
        target: 'Dropdown.Item',
        props: {
          renderAs: { rename: 'as' },
          value: {
            todo: 'bestax Dropdown.Item has no value prop; use onClick and your own state',
          },
        },
      },
      Divider: { status: 'mapped', target: 'Dropdown.Divider' },
    },
  },
  Element: {
    status: 'todo',
    todo: `no generic Element in bestax-bulma; use a semantic component (Block, Box, …) with helper props, or plain JSX with classNames — see ${DOCS}/api/helpers/usebulmaclasses`,
  },
  Footer: {
    status: 'mapped',
    target: 'Footer',
    props: { renderAs: { rename: 'as' } },
  },
  Form: {
    // Namespace only — <Form> itself is never rendered in RBC.
    status: 'mapped',
    subs: {
      Field: {
        status: 'mapped',
        target: 'Field',
        special: 'field',
        props: {
          horizontal: {},
          multiline: { drop: true }, // folded into grouped='multiline' by the special
          kind: { drop: true },
          align: { drop: true },
        },
        subs: {
          Label: {
            status: 'mapped',
            target: 'FieldLabel',
            props: { size: {} },
          },
          Body: { status: 'mapped', target: 'FieldBody' },
        },
      },
      Control: {
        status: 'mapped',
        target: 'Control',
        props: {
          fullwidth: { booleanToProp: { name: 'isExpanded' } },
          loading: { booleanToProp: { name: 'isLoading' } },
          iconType: {
            todo: 'use iconLeft/iconRight props on bestax Control instead',
          },
        },
      },
      Input: {
        status: 'mapped',
        target: 'Input',
        props: {
          size: {},
          color: {},
          isStatic: {},
          rounded: { booleanToProp: { name: 'isRounded' } },
          status: {
            valueMap: { focus: 'isFocused', hover: 'isHovered' },
            valueToProp: true,
          },
        },
      },
      Label: { status: 'mapped', special: 'plain-label' },
      Textarea: {
        status: 'mapped',
        target: 'TextArea',
        props: {
          size: {},
          color: {},
          fixedSize: { booleanToProp: { name: 'hasFixedSize' } },
        },
      },
      Select: {
        status: 'mapped',
        target: 'Select',
        props: {
          size: {},
          color: {},
          multiple: {},
          loading: { booleanToProp: { name: 'isLoading' } },
          fullwidth: { booleanToProp: { name: 'isFullwidth' } },
          status: {
            valueMap: { focus: 'isFocused', hover: 'isHovered' },
            valueToProp: true,
          },
        },
      },
      Checkbox: { status: 'mapped', target: 'Checkbox' },
      Radio: { status: 'mapped', target: 'Radio' },
      Help: { status: 'mapped', special: 'plain-help' },
      InputFile: {
        status: 'partial',
        target: 'File',
        special: 'input-file',
        props: {
          color: {},
          size: {},
          boxed: { booleanToProp: { name: 'isBoxed' } },
          fullwidth: { booleanToProp: { name: 'isFullwidth' } },
          align: {
            valueMap: { center: 'isCentered', right: 'isRight' },
            valueToProp: true,
          },
          label: { rename: 'buttonLabel' },
          icon: { rename: 'iconLeft' },
          inputProps: { todo: 'spread these onto bestax File directly' },
        },
      },
    },
  },
  Heading: {
    status: 'mapped',
    special: 'heading',
    props: {
      renderAs: { rename: 'as' },
      size: { numberToString: true },
      weight: { rename: 'textWeight' },
      spaced: { booleanToProp: { name: 'isSpaced' } },
      // `subtitle` / `heading` are consumed by the special handler.
    },
  },
  Hero: {
    status: 'mapped',
    target: 'Hero',
    props: {
      color: {},
      size: {
        valueTodo: {
          halfheight:
            'bestax Hero has no halfheight size; set a height via CSS or use size="medium"',
        },
      },
      gradient: {
        todo: 'Bulma v1 removed is-bold gradients; delete or restyle',
      },
      hasNavbar: { booleanToProp: { name: 'fullheightWithNavbar' } },
    },
    subs: {
      Header: { status: 'mapped', target: 'Hero.Head' },
      Body: { status: 'mapped', target: 'Hero.Body' },
      Footer: { status: 'mapped', target: 'Hero.Foot' },
    },
  },
  Icon: {
    status: 'partial',
    target: 'Icon',
    special: 'icon',
    props: {
      icon: { rename: 'name' },
      color: {},
      size: {
        valueTodo: { auto: 'no auto size in bestax Icon; drop the prop' },
      },
      align: {
        todo: 'inside a Control use its hasIconsLeft/iconLeft (or right) props instead',
      },
      text: { todo: 'wrap the icon and text in <IconText> instead' },
    },
    subs: {
      Text: { status: 'mapped', target: 'IconText' },
    },
  },
  Image: {
    status: 'mapped',
    target: 'Image',
    special: 'image',
    props: {
      rounded: { booleanToProp: { name: 'isRounded' } },
      fallback: {
        todo: 'no fallback prop in bestax Image; handle onError yourself',
      },
      fullwidth: {
        todo: 'no fullwidth prop in bestax Image; use className="is-fullwidth"',
      },
    },
  },
  Level: {
    status: 'mapped',
    target: 'Level',
    props: {
      breakpoint: {
        valueMap: { mobile: 'isMobile' },
        valueToProp: true,
      },
    },
    subs: {
      Side: { status: 'mapped', special: 'level-side' },
      Item: {
        status: 'mapped',
        target: 'Level.Item',
        props: { renderAs: { rename: 'as' } },
      },
    },
  },
  Loader: {
    // RBC Loader is an inline spinner; bestax Loading needs active to render.
    status: 'mapped',
    target: 'Loading',
    special: 'loader',
  },
  Media: {
    // bestax Media has no attached compounds; the parts are flat exports.
    status: 'mapped',
    target: 'Media',
    props: { renderAs: { rename: 'as' } },
    subs: {
      Item: {
        status: 'mapped',
        special: 'media-item',
        props: { renderAs: { rename: 'as' } },
      },
    },
  },
  Menu: {
    status: 'mapped',
    target: 'Menu',
    subs: {
      List: {
        status: 'mapped',
        target: 'Menu.List',
        special: 'menu-list',
        subs: {
          Item: {
            status: 'mapped',
            target: 'Menu.Item',
            props: { active: {}, renderAs: { rename: 'as' } },
          },
        },
      },
    },
  },
  Message: {
    status: 'mapped',
    target: 'Message',
    props: {
      color: {},
      size: {
        todo: 'no size prop on bestax Message; use textSize on the body',
      },
    },
    subs: {
      Header: { status: 'mapped', target: 'Message.Header' },
      Body: { status: 'mapped', target: 'Message.Body' },
    },
  },
  Modal: {
    status: 'partial',
    target: 'Modal',
    props: {
      show: { rename: 'active' },
      onClose: {},
      closeOnEsc: { todo: 'bestax Modal closes on Esc by default; remove' },
      closeOnBlur: {
        todo: 'bestax Modal background click closes when onClose is set; remove',
      },
      showClose: {
        todo: 'bestax Modal renders the close button when onClose is set; remove',
      },
      document: { drop: true },
    },
    subs: {
      Content: { status: 'mapped', target: 'Modal.Content' },
      Card: {
        status: 'mapped',
        target: 'Modal.Card',
        subs: {
          Header: {
            status: 'mapped',
            target: 'Modal.Card.Head',
            props: {
              showClose: {
                todo: 'render a <Delete onClick={...}/> in the head instead',
              },
              onClose: {
                todo: 'render a <Delete onClick={...}/> in the head instead',
              },
            },
          },
          Body: { status: 'mapped', target: 'Modal.Card.Body' },
          Footer: { status: 'mapped', target: 'Modal.Card.Foot' },
          Title: { status: 'mapped', target: 'Modal.Card.Title' },
        },
      },
    },
  },
  Navbar: {
    status: 'mapped',
    target: 'Navbar',
    props: {
      transparent: {},
      fixed: {},
      color: {},
      active: {
        todo: 'bestax Navbar.Burger/Menu take isActive; control open state there',
      },
      size: { todo: 'no size prop on bestax Navbar' },
    },
    subs: {
      Brand: { status: 'mapped', target: 'Navbar.Brand' },
      Burger: { status: 'mapped', target: 'Navbar.Burger' },
      Menu: { status: 'mapped', target: 'Navbar.Menu' },
      Item: {
        status: 'mapped',
        target: 'Navbar.Item',
        // The special turns an Item wrapping an RBC Navbar.Dropdown into the
        // bestax Navbar.Dropdown container (hoverable/active are native there).
        special: 'navbar-item',
        props: {
          renderAs: { rename: 'as' },
          active: {},
          hoverable: {
            todo: 'move hoverable to the bestax Navbar.Dropdown container',
          },
          arrowless: { todo: 'set arrowless on bestax Navbar.Link instead' },
        },
      },
      Dropdown: {
        // RBC Navbar.Dropdown is the menu (div.navbar-dropdown); bestax calls
        // that Navbar.DropdownMenu. The wrapping Item becomes the container.
        status: 'mapped',
        target: 'Navbar.DropdownMenu',
        props: {
          right: {},
          up: {},
          boxed: {
            todo: 'no boxed prop; add className="is-boxed" to Navbar.DropdownMenu',
          },
        },
      },
      Link: {
        status: 'mapped',
        target: 'Navbar.Link',
        props: { arrowless: {}, renderAs: { rename: 'as' } },
      },
      Divider: { status: 'mapped', target: 'Navbar.Divider' },
      Container: { status: 'mapped', special: 'navbar-container' },
    },
  },
  Notification: {
    status: 'mapped',
    target: 'Notification',
    props: {
      color: {},
      light: { booleanToProp: { name: 'isLight' } },
    },
  },
  Pagination: {
    status: 'partial',
    target: 'Pagination',
    props: {
      current: {},
      total: {},
      size: {},
      disabled: {},
      rounded: {},
      onChange: { rename: 'onPageChange' },
      align: { valueMap: { center: 'centered', right: 'right' } },
      delta: { todo: 'no delta prop in bestax Pagination' },
      next: { todo: 'no custom next label in bestax Pagination' },
      previous: { todo: 'no custom previous label in bestax Pagination' },
      showPrevNext: { todo: 'no showPrevNext prop in bestax Pagination' },
      showFirstLast: { todo: 'no showFirstLast prop in bestax Pagination' },
      autoHide: {
        todo: 'no autoHide prop in bestax Pagination; render conditionally',
      },
    },
  },
  Panel: {
    status: 'mapped',
    target: 'Panel',
    props: { color: {} },
    subs: {
      Header: { status: 'mapped', target: 'Panel.Heading' },
      Tabs: {
        status: 'mapped',
        target: 'Panel.Tabs',
        subs: {
          // bestax Panel.Tabs children are plain anchors.
          Tab: { status: 'mapped', special: 'panel-tab' },
        },
      },
      Block: { status: 'mapped', target: 'Panel.Block', props: activeKept },
      Icon: { status: 'partial', target: 'Panel.Icon', special: 'icon' },
    },
  },
  Progress: {
    status: 'mapped',
    target: 'Progress',
    props: { value: {}, max: {}, size: {}, color: {} },
  },
  Section: {
    status: 'mapped',
    target: 'Section',
    props: { size: {} },
  },
  Table: {
    status: 'mapped',
    target: 'Table',
    props: {
      striped: { booleanToProp: { name: 'isStriped' } },
      bordered: { booleanToProp: { name: 'isBordered' } },
      hoverable: { booleanToProp: { name: 'isHoverable' } },
      size: {
        valueMap: { fullwidth: 'isFullwidth', narrow: 'isNarrow' },
        valueToProp: true,
      },
    },
    subs: {
      Container: { status: 'mapped', special: 'table-container' },
    },
  },
  Tabs: {
    status: 'mapped',
    target: 'Tabs',
    special: 'tabs',
    props: {
      align: { valueMap: { center: 'centered', right: 'right' } },
      size: {},
      fullwidth: {},
      type: {
        valueMap: {
          toggle: 'toggle',
          boxed: 'boxed',
          'toggle-rounded': 'toggle rounded',
        },
        valueToProp: true,
      },
    },
    subs: {
      Tab: { status: 'mapped', target: 'Tabs.Item', props: activeKept },
    },
  },
  Tag: {
    status: 'mapped',
    target: 'Tag',
    props: {
      color: {},
      size: {},
      rounded: { booleanToProp: { name: 'isRounded' } },
      remove: { booleanToProp: { name: 'isDelete' } },
    },
    subs: {
      Group: {
        status: 'mapped',
        target: 'Tags',
        props: {
          hasAddons: {},
          gapless: { booleanToProp: { name: 'hasAddons' } },
        },
      },
    },
  },
  Tile: {
    status: 'todo',
    todo: `Bulma v1 replaced tiles with the Grid/Cell components — see ${DOCS}/api/grid/grid and the migration guide ${DOCS}/guides/getting-started/migration/bulma-0-9-to-1`,
  },
};

/**
 * The complete react-bulma-components v4.1.0 public surface, vendored from its
 * src/index.d.ts + per-component declarations. The mapping-coverage test walks
 * this list against MAPPING, so new RBC surface can never be silently ignored.
 */
export const RBC_EXPORTS: Record<string, string[]> = {
  Block: [],
  Box: [],
  Breadcrumb: ['Item'],
  Button: ['Group'],
  Card: [
    'Image',
    'Content',
    'Header',
    'Header.Title',
    'Header.Icon',
    'Footer',
    'Footer.Item',
  ],
  Columns: ['Column'],
  Container: [],
  Content: [],
  Dropdown: ['Item', 'Divider'],
  Element: [],
  Footer: [],
  Form: [
    'Field',
    'Field.Label',
    'Field.Body',
    'Control',
    'Input',
    'Label',
    'Textarea',
    'Select',
    'Checkbox',
    'Radio',
    'Help',
    'InputFile',
  ],
  Heading: [],
  Hero: ['Header', 'Body', 'Footer'],
  Icon: ['Text'],
  Image: [],
  Level: ['Side', 'Item'],
  Loader: [],
  Media: ['Item'],
  Menu: ['List', 'List.Item'],
  Message: ['Header', 'Body'],
  Modal: [
    'Content',
    'Card',
    'Card.Header',
    'Card.Body',
    'Card.Footer',
    'Card.Title',
  ],
  Navbar: [
    'Brand',
    'Burger',
    'Menu',
    'Item',
    'Dropdown',
    'Link',
    'Divider',
    'Container',
  ],
  Notification: [],
  Pagination: [],
  Panel: ['Header', 'Tabs', 'Tabs.Tab', 'Block', 'Icon'],
  Progress: [],
  Section: [],
  Table: ['Container'],
  Tabs: ['Tab'],
  Tag: ['Group'],
  Tile: [],
};

/** Resolve a canonical RBC path like ['Form','Field','Label'] in MAPPING. */
export function resolveMapping(path: string[]): ComponentMapping | undefined {
  let current: ComponentMapping | undefined = MAPPING[path[0]];
  for (const segment of path.slice(1)) {
    current = current?.subs?.[segment];
  }
  return current;
}
