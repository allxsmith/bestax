/**
 * rbx (v2) → @allxsmith/bestax-bulma mapping tables.
 *
 * Data only — no AST work. `MAPPING` is the single source of truth for what
 * the transform does with each rbx export; `RBX_EXPORTS` vendors rbx's public
 * surface so `mapping-coverage.test.ts` can close it in both directions.
 *
 * rbx and bestax both target Bulma, and rbx's helper vocabulary lines up with
 * `useBulmaClasses` far more closely than react-bulma-components' did — most
 * of the value unions below are identical on both sides, so they pass through
 * rather than being value-mapped. Where they diverge it is because Bulma v1
 * itself changed (`is-marginless` became `m-0`), and those are recorded as
 * explicit conversions rather than guesses.
 */

import type { ComponentMapping, PropAction } from '../../types.js';

const DOCS = 'https://bestax.io/docs';

/**
 * rbx's `shades` union that bestax's `validColors` does not carry. Every other
 * rbx colour and shade name exists in bestax verbatim.
 */
const SHADE_TODO = {
  'white-ter': `\`white-ter\` is not a bestax colour; use \`white\` or a custom class (${DOCS}/api/helpers/usebulmaclasses)`,
  'white-bis': `\`white-bis\` is not a bestax colour; use \`white\` or a custom class (${DOCS}/api/helpers/usebulmaclasses)`,
};

/** rbx sizes are numbers; every bestax size prop takes the string form. */
const numeric: PropAction = { numberToString: true };

/**
 * `as` is universal in rbx — `forwardRefAs` puts it on every component — but
 * bestax declares it on only ~16 components, several of them constrained to a
 * narrow literal union (`Footer` is `'footer' | 'div'`). So the default is a
 * TODO, and the components that really do accept `as` opt in with `AS_OK` in
 * their own prop map, which runs first and wins.
 */
const FILE_PART_TODO = `bestax's \`<File>\` renders the whole file structure from its own props — drop this element and set \`label\`, \`hasName\`, \`isBoxed\` etc. on \`<File>\` (${DOCS}/api/form/file)`;

const AS_TODO: PropAction = {
  todo: `bestax declares \`as\` on only some components, and this is not one of them; restructure the element or render the tag directly (${DOCS}/api)`,
};
/**
 * Components whose bestax counterpart really does accept `as`. An empty
 * action passes the prop through untouched; its job is to claim the name so
 * the universal `AS_TODO` never sees it.
 *
 * Several of these narrow `as` to a literal union (`Footer` is
 * `'footer' | 'div'`, `Control` is `'div'`), so an `as={SomeComponent}` still
 * surfaces — as a type error the user can see, rather than a silent rewrite.
 */
const AS_OK: PropAction = {};

/**
 * Helper props rbx mixes into every component via `HelpersProps`. Applied
 * after each component's own prop map, to whatever attributes are left.
 *
 * `badge*`, `tooltip*` and `responsive` are deliberately absent: they are
 * consumed structurally (see specials.ts / responsive.ts) before this pass
 * runs, and letting them fall through here would be wrong — bestax has its
 * own unrelated `responsive` prop (`'mobile' | 'narrow'`), so a pass-through
 * would silently produce a type error rather than a TODO.
 */
export const UNIVERSAL_PROPS: Record<string, PropAction> = {
  // --- typography: values are identical on both sides ---------------------
  backgroundColor: { rename: 'bgColor', valueTodo: SHADE_TODO },
  textColor: { valueTodo: SHADE_TODO },
  textAlign: {}, // centered | justified | left | right — same union
  textTransform: {}, // capitalized | lowercase | uppercase — bestax adds italic
  textWeight: {}, // light | medium | normal | semibold | bold — same union
  textSize: numeric, // rbx 1–7 as numbers, bestax as strings
  italic: { booleanToProp: { name: 'textTransform', value: 'italic' } },

  // --- float / overflow / overlay -----------------------------------------
  clearfix: {},
  pull: { rename: 'float' }, // left | right — same union
  clipped: { booleanToProp: { name: 'overflow', value: 'clipped' } },
  overlay: {}, // boolean on both sides

  // --- visibility ----------------------------------------------------------
  hidden: { booleanToProp: { name: 'visibility', value: 'hidden' } },
  invisible: { booleanToProp: { name: 'visibility', value: 'invisible' } },
  srOnly: { booleanToProp: { name: 'visibility', value: 'sr-only' } },

  // --- Bulma v1 dropped the `is-*less` spacing helpers ---------------------
  marginless: { booleanToProp: { name: 'm', value: '0' } },
  paddingless: { booleanToProp: { name: 'p', value: '0' } },
  radiusless: { booleanToProp: { name: 'radius', value: 'radiusless' } },
  shadowless: { booleanToProp: { name: 'shadow', value: 'shadowless' } },
  unselectable: {
    booleanToProp: { name: 'interaction', value: 'unselectable' },
  },
  relative: {}, // boolean on both sides

  // Per-component maps override this with AS_OK where bestax has an `as`.
  as: AS_TODO,
};

/** rbx badge helper props → bestax `<Badge>` props. */
export const BADGE_PROPS: Record<string, string | null> = {
  badge: 'content',
  badgeColor: 'color',
  // bestax's Badge has no outline, pill or size variants.
  badgeOutlined: null,
  badgeRounded: null,
  badgeSize: null,
};

/** rbx tooltip helper props → bestax `<Tooltip>` props. */
export const TOOLTIP_PROPS: Record<string, string | null> = {
  tooltip: 'label',
  tooltipActive: 'active',
  tooltipColor: 'color',
  tooltipMultiline: 'multiline',
  tooltipPosition: 'position',
  // A breakpoint→position object; bestax has one position for all viewports.
  tooltipResponsive: null,
};

/**
 * rbx breakpoints → the suffix bestax uses on its viewport-aware helper props
 * (`displayTablet`, `textSizeDesktop`, …). `null` means bestax has no
 * equivalent viewport, so the value becomes a TODO rather than a guess.
 */
export const RESPONSIVE_BREAKPOINTS: Record<string, string | null> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
  widescreen: 'Widescreen',
  fullhd: 'Fullhd',
  // Bulma v1 keeps `is-hidden-touch`, but bestax's validViewports does not
  // include it, so there is no prop to write.
  touch: null,
};

export const MAPPING: Record<string, ComponentMapping> = {
  // ---- base ---------------------------------------------------------------
  Generic: {
    status: 'todo',
    todo: `\`Generic\` is rbx's untyped base element; render the underlying HTML tag directly, or use a bestax component (${DOCS}/api)`,
  },
  forwardRefAs: {
    status: 'todo',
    todo: '`forwardRefAs` is rbx-internal; bestax components forward refs natively — use React.forwardRef',
  },

  // ---- elements -----------------------------------------------------------
  Block: { status: 'mapped', target: 'Block' },
  Box: { status: 'mapped', target: 'Box' },
  Button: {
    status: 'mapped',
    target: 'Button',
    props: {
      as: AS_OK,
      color: {},
      size: {},
      outlined: { booleanToProp: { name: 'isOutlined' } },
      rounded: { booleanToProp: { name: 'isRounded' } },
      inverted: { booleanToProp: { name: 'isInverted' } },
      fullwidth: { booleanToProp: { name: 'isFullwidth' } },
      static: { booleanToProp: { name: 'isStatic' } },
      state: {
        valueMap: {
          hovered: 'isHovered',
          focused: 'isFocused',
          active: 'isActive',
          loading: 'isLoading',
        },
        valueToProp: true,
      },
      selected: {
        todo: 'no bestax equivalent (Bulma is-selected in button groups)',
      },
      text: {
        todo: `no bestax equivalent for the \`is-text\` button; use \`<Button color="ghost">\` or a link (${DOCS}/api/elements/button)`,
      },
    },
    subs: {
      Group: {
        status: 'mapped',
        target: 'Buttons',
        props: {
          hasAddons: {},
          align: {
            valueMap: { centered: 'isCentered', right: 'isRight' },
            valueToProp: true,
          },
          size: {
            todo: 'bestax `Buttons` has no size prop; set `size` on each Button instead',
          },
        },
      },
    },
  },
  Container: {
    status: 'mapped',
    target: 'Container',
    props: {
      fluid: {},
      // bestax's ContainerBreakpoint is 'tablet' | 'desktop' | 'widescreen';
      // rbx accepts all six, so the other three are type errors if passed on.
      breakpoint: {
        valueTodo: {
          mobile:
            "bestax's Container has no mobile breakpoint (Bulma containers start at tablet); drop it",
          fullhd:
            "bestax's Container breakpoint stops at widescreen; use `isMax` or a custom class for fullhd",
          touch:
            "bestax's Container has no touch breakpoint; drop it or use a custom class",
        },
      },
    },
  },
  Content: {
    status: 'mapped',
    target: 'Content',
    props: { size: {} },
    subs: {
      OrderedList: {
        status: 'mapped',
        target: 'OrderedList',
        props: {
          type: {
            todo: 'bestax `OrderedList` has no `type` prop; set the `type` attribute on the underlying <ol> or a custom class',
          },
        },
        subs: {
          Item: { status: 'mapped', target: 'OrderedList.Item' },
        },
      },
    },
  },
  Delete: { status: 'mapped', target: 'Delete', props: { size: {} } },
  Divider: {
    status: 'partial',
    target: 'Divider',
    props: {
      color: {
        todo: 'bestax `Divider` takes only `bgColor`; set that or a custom class',
      },
      vertical: {
        todo: 'bestax `Divider` has no vertical variant; use a bordered Column or custom CSS',
      },
    },
  },
  Heading: { status: 'mapped', special: 'heading' },
  Highlight: {
    status: 'todo',
    todo: `\`Highlight\` (syntax-highlighted <pre>) has no bestax equivalent; use \`<Pre>\` plus your own highlighter (${DOCS}/api/elements/pre)`,
  },
  Icon: { status: 'partial', target: 'Icon', special: 'icon' },
  Image: {
    status: 'mapped',
    target: 'Image',
    props: { as: AS_OK, rounded: { booleanToProp: { name: 'isRounded' } } },
    subs: {
      // rbx nests <Image> inside <Image.Container>; bestax's Image renders the
      // figure itself, so the container collapses into it.
      Container: { status: 'mapped', special: 'image-container' },
    },
  },
  Notification: {
    status: 'mapped',
    target: 'Notification',
    props: { color: {} },
  },
  Numeric: {
    status: 'todo',
    todo: '`Numeric` (locale number formatting) has no bestax equivalent; use Intl.NumberFormat directly',
  },
  // NOT `Loading`: rbx's Loader always renders `div.loader`, while bestax's
  // Loading is an overlay that defaults `active` to false and returns null —
  // so a direct map made every migrated loader disappear. Bulma's `.loader`
  // is a plain element, and the react-bulma-components source already
  // emits exactly that for its own `Loader`.
  Loader: { status: 'mapped', special: 'loader' },
  PageLoader: {
    status: 'mapped',
    target: 'Loading',
    special: 'page-loader',
    props: {
      active: {},
      color: {},
      direction: {
        todo: 'bestax `Loading` has no directional variant; drop it or add a custom class',
      },
    },
  },
  Progress: {
    status: 'mapped',
    target: 'Progress',
    props: { color: {}, size: {}, max: {}, value: {} },
  },
  Table: {
    status: 'mapped',
    target: 'Table',
    props: {
      bordered: { booleanToProp: { name: 'isBordered' } },
      striped: { booleanToProp: { name: 'isStriped' } },
      narrow: { booleanToProp: { name: 'isNarrow' } },
      hoverable: { booleanToProp: { name: 'isHoverable' } },
      fullwidth: { booleanToProp: { name: 'isFullwidth' } },
    },
    subs: {
      Body: { status: 'mapped', target: 'Table.Tbody' },
      Cell: { status: 'mapped', target: 'Table.Td' },
      Foot: { status: 'mapped', target: 'Table.Tfoot' },
      Head: { status: 'mapped', target: 'Table.Thead' },
      Heading: { status: 'mapped', target: 'Table.Th' },
      Row: {
        status: 'mapped',
        target: 'Table.Tr',
        props: {
          selected: {
            todo: 'bestax `Table.Tr` has no `selected` prop; add className="is-selected"',
          },
        },
      },
    },
  },
  Tag: {
    status: 'mapped',
    target: 'Tag',
    props: {
      color: {},
      size: {},
      rounded: { booleanToProp: { name: 'isRounded' } },
      delete: { booleanToProp: { name: 'isDelete' } },
    },
    subs: {
      Group: {
        status: 'mapped',
        target: 'Tags',
        props: {
          gapless: { booleanToProp: { name: 'hasAddons' } },
          size: {
            todo: 'bestax `Tags` has no size prop; set `size` on each Tag instead',
          },
        },
      },
    },
  },
  Title: { status: 'mapped', special: 'title', props: { as: AS_OK } },
  Tile: {
    status: 'todo',
    todo: `Bulma v1 replaced tiles with the Grid/Cell components — see ${DOCS}/api/grid and the migration guide ${DOCS}/guides/getting-started/migration/bulma-0-9-to-1`,
  },

  // ---- form ---------------------------------------------------------------
  Checkbox: { status: 'mapped', target: 'Checkbox' },
  Control: {
    status: 'mapped',
    target: 'Control',
    props: {
      as: AS_OK,
      size: {},
      expanded: { booleanToProp: { name: 'isExpanded' } },
      loading: { booleanToProp: { name: 'isLoading' } },
      // rbx's iconLeft/iconRight are booleans; bestax's same-named props take
      // an IconProps object, so they map onto the has* booleans instead.
      iconLeft: { booleanToProp: { name: 'hasIconsLeft' } },
      iconRight: { booleanToProp: { name: 'hasIconsRight' } },
    },
  },
  Field: {
    status: 'mapped',
    target: 'Field',
    special: 'field',
    props: {
      horizontal: {},
      // rbx accepts `expanded` on the Field, but Bulma's `is-expanded` is a
      // Control modifier and bestax follows Bulma: `FieldProps` has no such
      // prop, so passing it through was a silent type error.
      expanded: {
        todo: 'bestax follows Bulma in putting `is-expanded` on the Control, not the Field; move this to the `<Control isExpanded>` inside it',
      },
      narrow: {},
      align: {
        todo: "rbx's `align` on a Field is Bulma's grouped alignment; set `isGrouped` plus the matching alignment class by hand",
      },
      kind: {
        valueMap: { addons: 'hasAddons', group: 'grouped' },
        valueToProp: true,
      },
      multiline: {},
    },
    subs: {
      Label: { status: 'mapped', target: 'Field.Label', props: { size: {} } },
      Body: { status: 'mapped', target: 'Field.Body' },
    },
  },
  Fieldset: {
    status: 'todo',
    todo: 'bestax has no `Fieldset` component; render a plain <fieldset> (its `disabled` attribute works natively)',
  },
  File: {
    status: 'mapped',
    target: 'File',
    props: {
      color: {},
      size: {},
      boxed: { booleanToProp: { name: 'isBoxed' } },
      fullwidth: { booleanToProp: { name: 'isFullwidth' } },
      hasName: {},
      align: {
        valueMap: { centered: 'isCentered', right: 'isRight' },
        valueToProp: true,
      },
    },
    // bestax's `<File>` renders the whole Bulma file structure itself from
    // props (`label`, `hasName`, `isBoxed`, …), so rbx's structural pieces
    // have no counterpart to become. Collapsing them automatically would mean
    // guessing which prop each one was standing in for.
    subs: {
      CTA: { status: 'todo', todo: FILE_PART_TODO },
      Icon: { status: 'todo', todo: FILE_PART_TODO },
      Input: { status: 'todo', todo: FILE_PART_TODO },
      Label: { status: 'todo', todo: FILE_PART_TODO },
      Name: { status: 'todo', todo: FILE_PART_TODO },
    },
  },
  Help: { status: 'mapped', special: 'help' },
  Input: {
    status: 'mapped',
    target: 'Input',
    props: {
      color: {},
      size: {},
      type: {},
      readOnly: {},
      rounded: { booleanToProp: { name: 'isRounded' } },
      static: { booleanToProp: { name: 'isStatic' } },
      state: {
        valueMap: { focused: 'isFocused', hovered: 'isHovered' },
        valueToProp: true,
      },
    },
  },
  Label: { status: 'mapped', special: 'label' },
  Radio: { status: 'mapped', target: 'Radio' },
  Select: {
    status: 'mapped',
    target: 'Select',
    props: { size: {} },
    subs: {
      // rbx wraps <Select> in <Select.Container>; bestax's Select renders the
      // wrapper itself.
      Container: { status: 'mapped', special: 'select-container' },
      Option: { status: 'mapped', special: 'plain-option' },
    },
  },
  Textarea: {
    status: 'mapped',
    target: 'TextArea',
    props: {
      color: {},
      size: {},
      fixedSize: { booleanToProp: { name: 'hasFixedSize' } },
      state: {
        valueMap: { focused: 'isFocused', hovered: 'isHovered' },
        valueToProp: true,
      },
    },
  },

  // ---- components ---------------------------------------------------------
  Breadcrumb: {
    status: 'mapped',
    target: 'Breadcrumb',
    props: {
      // rbx's alignments and separators are already bestax's unions.
      align: { rename: 'alignment' },
      separator: {},
      size: {},
    },
    subs: { Item: { status: 'mapped', special: 'breadcrumb-item' } },
  },
  Card: {
    status: 'mapped',
    target: 'Card',
    subs: {
      Content: { status: 'mapped', target: 'Card.Content' },
      Image: { status: 'mapped', target: 'Card.Image' },
      Header: {
        status: 'mapped',
        target: 'Card.Header',
        subs: {
          Title: {
            status: 'mapped',
            target: 'Card.Header.Title',
            props: {
              align: {
                valueMap: { centered: 'centered' },
                valueToProp: true,
              },
            },
          },
          Icon: { status: 'mapped', target: 'Card.Header.Icon' },
        },
      },
      Footer: {
        status: 'mapped',
        target: 'Card.Footer',
        subs: { Item: { status: 'mapped', target: 'Card.FooterItem' } },
      },
    },
  },
  Dropdown: {
    status: 'partial',
    target: 'Dropdown',
    special: 'dropdown',
    props: {
      active: {},
      hoverable: {},
      up: {},
      align: { valueMap: { right: 'right' }, valueToProp: true },
      managed: {
        todo: 'bestax `Dropdown` is uncontrolled by default; use `active` + `onActiveChange` for controlled behaviour',
      },
      innerRef: {
        todo: 'this bestax component is a plain function component and forwards no ref; drop `innerRef`, or put the ref on a wrapping element you control',
      },
    },
    subs: {
      Container: { status: 'mapped', special: 'dropdown-container' },
      Content: { status: 'mapped', special: 'dropdown-content' },
      Menu: { status: 'mapped', special: 'dropdown-menu' },
      Trigger: { status: 'mapped', special: 'dropdown-trigger' },
      Item: {
        status: 'mapped',
        target: 'Dropdown.Item',
        // `as` lives on DropdownItemProps ('a' | 'div' | 'button'), not on
        // the Dropdown root.
        props: { as: AS_OK, active: {}, onClick: {} },
      },
      Divider: { status: 'mapped', target: 'Dropdown.Divider' },
      Context: {
        status: 'todo',
        todo: '`Dropdown.Context` is rbx-internal; bestax exposes `active`/`onActiveChange` on `<Dropdown>` instead',
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
        valueTodo: {
          tablet: 'bestax `Level` only supports the mobile breakpoint',
          desktop: 'bestax `Level` only supports the mobile breakpoint',
          widescreen: 'bestax `Level` only supports the mobile breakpoint',
          fullhd: 'bestax `Level` only supports the mobile breakpoint',
          touch: 'bestax `Level` only supports the mobile breakpoint',
        },
      },
    },
    subs: {
      Item: { status: 'mapped', special: 'level-item', props: { as: AS_OK } },
    },
  },
  List: {
    status: 'todo',
    todo: `rbx's \`List\` is the bulma-list extension, which Bulma v1 does not ship; use \`<UnorderedList>\` or \`<Menu>\` (${DOCS}/api/elements/unorderedlist)`,
    subs: {
      Item: {
        status: 'todo',
        todo: `rbx's \`List.Item\` is the bulma-list extension, which Bulma v1 does not ship; use \`<UnorderedList.Item>\` or \`<Menu.Item>\` (${DOCS}/api/elements/unorderedlist)`,
      },
    },
  },
  Media: {
    status: 'mapped',
    target: 'Media',
    props: { as: AS_OK },
    subs: {
      // `as` is NOT opted in here: Media.Item resolves to Media.Left,
      // Media.Content or Media.Right by its `align` value, and only
      // MediaLeftProps declares `as`. The special decides per target.
      Item: { status: 'mapped', special: 'media-item' },
    },
  },
  Menu: {
    status: 'mapped',
    target: 'Menu',
    subs: {
      Label: { status: 'mapped', target: 'Menu.Label' },
      List: {
        status: 'mapped',
        target: 'Menu.List',
        subs: {
          Item: {
            status: 'mapped',
            target: 'Menu.Item',
            props: {
              as: AS_OK,
              active: {},
              menu: {
                todo: 'bestax `Menu.Item` has no `menu` prop; nest a `<Menu.List>` as a child instead',
              },
            },
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
        todo: 'bestax `Message` has no size prop; use the `size` helper on its children',
      },
    },
    subs: {
      Body: { status: 'mapped', target: 'Message.Body' },
      Header: { status: 'mapped', target: 'Message.Header' },
    },
  },
  Modal: {
    status: 'partial',
    target: 'Modal',
    special: 'modal',
    props: {
      active: {},
      onClose: {},
      closeOnEsc: {
        todo: 'bestax `Modal` implements no Escape handling at all; add your own keydown listener, or drop the prop if the behaviour is not needed',
      },
      closeOnBlur: {
        todo: "bestax `Modal` has no built-in background-click close; wire it through `Modal.Background`'s onClick and `onClose`",
      },
      document: {
        todo: 'bestax `Modal` renders into the default document; drop this prop',
      },
      containerClassName: { rename: 'className' },
      innerRef: {
        todo: 'this bestax component is a plain function component and forwards no ref; drop `innerRef`, or put the ref on a wrapping element you control',
      },
    },
    subs: {
      Background: { status: 'mapped', target: 'Modal.Background' },
      Close: { status: 'mapped', target: 'Modal.Close' },
      Content: { status: 'mapped', target: 'Modal.Content' },
      Container: { status: 'mapped', special: 'modal-container' },
      Card: {
        status: 'mapped',
        target: 'Modal.Card',
        subs: {
          Body: { status: 'mapped', target: 'Modal.Card.Body' },
          Foot: { status: 'mapped', target: 'Modal.Card.Foot' },
          Head: { status: 'mapped', target: 'Modal.Card.Head' },
          Title: { status: 'mapped', target: 'Modal.Card.Title' },
        },
      },
      Context: {
        status: 'todo',
        todo: '`Modal.Context` is rbx-internal; bestax exposes `active`/`onClose` on `<Modal>` instead',
      },
      Portal: {
        status: 'todo',
        todo: '`Modal.Portal` is rbx-internal; bestax `<Modal>` portals on its own',
      },
    },
  },
  Navbar: {
    status: 'mapped',
    target: 'Navbar',
    props: {
      color: {},
      fixed: {},
      transparent: {},
      active: {
        todo: 'bestax `Navbar` manages burger state itself; drop `active` or control the burger directly',
      },
      managed: {
        todo: 'bestax `Navbar` is uncontrolled; drop `managed`',
      },
      document: { todo: 'bestax `Navbar` has no `document` prop; drop it' },
      innerRef: {
        todo: 'this bestax component is a plain function component and forwards no ref; drop `innerRef`, or put the ref on a wrapping element you control',
      },
    },
    subs: {
      Brand: { status: 'mapped', target: 'Navbar.Brand' },
      Burger: { status: 'mapped', target: 'Navbar.Burger' },
      Divider: { status: 'mapped', target: 'Navbar.Divider' },
      Menu: { status: 'mapped', target: 'Navbar.Menu' },
      Link: {
        status: 'mapped',
        target: 'Navbar.Link',
        props: {
          as: AS_OK,
          arrowless: {},
          onClick: {},
        },
      },
      Item: {
        status: 'mapped',
        special: 'navbar-item',
        props: { active: {}, onClick: {}, as: AS_OK },
        subs: { Container: { status: 'mapped', special: 'navbar-container' } },
      },
      Dropdown: { status: 'mapped', special: 'navbar-dropdown' },
      Segment: { status: 'mapped', special: 'navbar-segment' },
      Container: { status: 'mapped', special: 'navbar-container' },
      Context: {
        status: 'todo',
        todo: '`Navbar.Context` is rbx-internal; bestax `<Navbar>` manages its own state',
      },
    },
  },
  Pagination: {
    status: 'mapped',
    target: 'Pagination',
    props: {
      align: {},
      size: {},
      rounded: {},
    },
    subs: {
      Link: { status: 'mapped', target: 'Pagination.Link' },
      List: { status: 'mapped', target: 'Pagination.List' },
      Ellipsis: { status: 'mapped', target: 'Pagination.Ellipsis' },
      Step: { status: 'mapped', special: 'pagination-step' },
    },
  },
  Panel: {
    status: 'mapped',
    target: 'Panel',
    props: { color: {} },
    subs: {
      Heading: { status: 'mapped', target: 'Panel.Heading' },
      Block: { status: 'mapped', target: 'Panel.Block', props: { active: {} } },
      Icon: { status: 'partial', target: 'Panel.Icon', special: 'icon' },
      Tab: {
        status: 'mapped',
        special: 'panel-tab',
        subs: { Group: { status: 'mapped', target: 'Panel.Tabs' } },
      },
    },
  },
  Tab: {
    // bestax's `Tabs.Tab` is the controlled API and requires an `index` that
    // cannot be derived from rbx's markup; `Tabs.Item` is the plain <li> that
    // rbx's `Tab` actually is.
    status: 'mapped',
    target: 'Tabs.Item',
    props: { active: {} },
    subs: {
      Group: {
        status: 'mapped',
        special: 'tab-group',
        target: 'Tabs',
        props: {
          align: {},
          size: {},
          fullwidth: { booleanToProp: { name: 'isFullwidth' } },
          kind: {
            valueMap: {
              boxed: 'boxed',
              toggle: 'toggle',
              'toggle-rounded': 'toggle rounded',
            },
            valueToProp: true,
          },
        },
      },
    },
  },

  // ---- grid ---------------------------------------------------------------
  Column: {
    status: 'mapped',
    target: 'Column',
    special: 'column',
    props: {
      // bestax's BulmaColumnSize accepts numbers as well as the named
      // strings, so rbx's numeric sizes carry over untouched.
      size: {},
      offset: {},
      narrow: { booleanToProp: { name: 'isNarrow' } },
    },
    subs: {
      Group: {
        status: 'mapped',
        target: 'Columns',
        special: 'column-group',
        props: {
          centered: { booleanToProp: { name: 'isCentered' } },
          gapless: { booleanToProp: { name: 'isGapless' } },
          multiline: { booleanToProp: { name: 'isMultiline' } },
          vcentered: { booleanToProp: { name: 'isVCentered' } },
          // bestax's `gapSize*` props are deprecated aliases of `gap*`, and
          // both take the same numeric 0-8 scale — so this is a rename, not
          // a value conversion.
          gapSize: { rename: 'gap' },
          breakpoint: {
            valueMap: { mobile: 'isMobile', desktop: 'isDesktop' },
            valueToProp: true,
            valueTodo: {
              tablet:
                'bestax `Columns` supports only the mobile and desktop breakpoints',
              widescreen:
                'bestax `Columns` supports only the mobile and desktop breakpoints',
              fullhd:
                'bestax `Columns` supports only the mobile and desktop breakpoints',
              touch:
                'bestax `Columns` supports only the mobile and desktop breakpoints',
            },
          },
        },
      },
    },
  },

  // ---- layout -------------------------------------------------------------
  Footer: { status: 'mapped', target: 'Footer', props: { as: AS_OK } },
  Hero: {
    status: 'mapped',
    target: 'Hero',
    props: {
      color: {},
      size: {
        valueTodo: {
          'fullheight-with-navbar':
            'set `size="fullheight"` plus `fullheightWithNavbar` on the bestax Hero',
        },
      },
      gradient: {
        todo: 'bestax `Hero` has no gradient variant; add a custom class or `bgColor`',
      },
    },
    subs: {
      Body: { status: 'mapped', target: 'Hero.Body' },
      Foot: { status: 'mapped', target: 'Hero.Foot' },
      Head: { status: 'mapped', target: 'Hero.Head' },
    },
  },
  Section: { status: 'mapped', target: 'Section', props: { size: {} } },
};

/**
 * rbx's public export surface, vendored from its five `index.ts` barrels at
 * the pinned SHA. Values are the dot-notation sub-paths each export carries.
 *
 * `mapping-coverage.test.ts` walks this against `MAPPING` in both directions,
 * so rbx coverage cannot silently regress and `MAPPING` cannot grow an entry
 * for something rbx never exported.
 */
export const RBX_EXPORTS: Record<string, string[]> = {
  Block: [],
  Box: [],
  Breadcrumb: ['Item'],
  Button: ['Group'],
  Card: [
    'Content',
    'Footer',
    'Footer.Item',
    'Header',
    'Header.Icon',
    'Header.Title',
    'Image',
  ],
  Checkbox: [],
  Column: ['Group'],
  Container: [],
  Content: ['OrderedList', 'OrderedList.Item'],
  Control: [],
  Delete: [],
  Divider: [],
  Dropdown: [
    'Container',
    'Content',
    'Context',
    'Divider',
    'Item',
    'Menu',
    'Trigger',
  ],
  Field: ['Body', 'Label'],
  Fieldset: [],
  File: ['CTA', 'Icon', 'Input', 'Label', 'Name'],
  Footer: [],
  Generic: [],
  Heading: [],
  Help: [],
  Hero: ['Body', 'Foot', 'Head'],
  Highlight: [],
  Icon: [],
  Image: ['Container'],
  Input: [],
  Label: [],
  Level: ['Item'],
  List: ['Item'],
  Loader: [],
  Media: ['Item'],
  Menu: ['Label', 'List', 'List.Item'],
  Message: ['Body', 'Header'],
  Modal: [
    'Background',
    'Card',
    'Card.Body',
    'Card.Foot',
    'Card.Head',
    'Card.Title',
    'Close',
    'Container',
    'Content',
    'Context',
    'Portal',
  ],
  Navbar: [
    'Brand',
    'Burger',
    'Container',
    'Context',
    'Divider',
    'Dropdown',
    'Item',
    'Item.Container',
    'Link',
    'Menu',
    'Segment',
  ],
  Notification: [],
  Numeric: [],
  PageLoader: [],
  Pagination: ['Ellipsis', 'Link', 'List', 'Step'],
  Panel: ['Block', 'Heading', 'Icon', 'Tab', 'Tab.Group'],
  Progress: [],
  Radio: [],
  Section: [],
  Select: ['Container', 'Option'],
  Tab: ['Group'],
  Table: ['Body', 'Cell', 'Foot', 'Head', 'Heading', 'Row'],
  Tag: ['Group'],
  Textarea: [],
  Tile: [],
  Title: [],
  forwardRefAs: [],
};

/** Walk a dotted component path through `MAPPING`. */
export function resolveMapping(path: string[]): ComponentMapping | undefined {
  let current: ComponentMapping | undefined = MAPPING[path[0]];
  for (const segment of path.slice(1)) {
    current = current?.subs?.[segment];
  }
  return current;
}
