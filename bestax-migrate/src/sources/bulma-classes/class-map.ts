/**
 * The bulma-classes table: for a Bulma class on a plain JSX element, which
 * bestax component renders that element, and which prop renders each of its
 * other classes.
 *
 * Every conversion this table allows must render exactly the HTML the raw
 * element rendered. That is a claim about bestax, and the render tests hold
 * it: each root, modifier and helper here is rendered through the built
 * library and compared with the raw markup it replaces.
 *
 * Data only: `scripts/gen-mcp-index.mjs` imports it directly for the MCP
 * server's `lookup_bulma_classes`, so nothing Node cannot strip (no enums, no
 * namespaces, type imports only), and a change to it wants `pnpm gen:mcp`.
 */

export interface PropWrite {
  readonly prop: string;
  /** Omitted for a bare boolean prop. */
  readonly value?: string;
}

export type TagSet =
  { readonly on: readonly string[] } | { readonly except: readonly string[] };

export function inTagSet(set: TagSet, tag: string): boolean {
  return 'on' in set ? set.on.includes(tag) : !set.except.includes(tag);
}

export interface Modifier {
  readonly writes: readonly PropWrite[];
  /** The raw tags the writes are exact on (Title's size picks its heading). */
  readonly tagIn?: readonly string[];
}

/**
 * - `mapped`: converts to `target`.
 * - `todo`: bestax has a component, but the markup does not map element by
 *   element yet; the family's outermost class gets a TODO.
 * - `plain`: valid Bulma with nothing to convert to; left alone, no TODO.
 */
export type RootStatus = 'mapped' | 'todo' | 'plain';

export interface RootEntry {
  readonly status: RootStatus;
  /** bestax JSX name, dotted for a part (`Hero.Body`). */
  readonly target?: string;
  /** The tag the target renders with no `as`. */
  readonly tag?: string;
  /** Tags `as` can reach: a list, any tag, or none (fixed). */
  readonly as?: readonly string[] | 'any';
  /** Title and SubTitle render `h{size}` whatever `as` says, unless `as="p"`. */
  readonly sizeDrivesTag?: boolean;
  readonly modifiers?: Readonly<Record<string, Modifier>>;
  /** The prop that renders `has-text-{color}` here, or null when none does. */
  readonly textColor?: 'textColor' | 'color' | null;
  /** The prop that renders `has-background-{color}` here, or null when none does. */
  readonly bgColor?: 'bgColor' | 'backgroundColor' | null;
  /** Attributes the target renders when the element does not set them. */
  readonly defaults?: Readonly<Record<string, string>>;
  /**
   * Attributes the element may carry that the target's props type rejects.
   * One that is also a default converts at exactly its default value (the
   * target renders it anyway, so it is dropped); otherwise it refuses.
   */
  readonly untypedAttrs?: readonly string[];
  /** The target's props type requires children. */
  readonly requiresChildren?: boolean;
  /**
   * Attributes the target types as numbers. A numeric string (`value="40"`)
   * becomes a number, which renders the same; any other string refuses.
   */
  readonly numberAttrs?: readonly string[];
  /** Attributes the target drops: on these tags, or on all tags except these. */
  readonly dropsAttr?: Readonly<Record<string, TagSet>>;
  /**
   * The target's props a raw attribute of the same name would be read as,
   * and the ones that reach the DOM unchanged. Together they are every prop
   * the target declares; a test holds that.
   */
  readonly ownProps?: readonly string[];
  readonly passThrough?: readonly string[];
  /** For `todo` roots: a part, whose family root carries the TODO. */
  readonly part?: boolean;
  /** Why a `todo` or `plain` root is what it is; `todo` messages quote it. */
  readonly why?: string;
  /**
   * Modifiers left out of `modifiers` on purpose, because the prop that
   * renders the class renders more than the class. They stay in `className`;
   * the reason is for the MCP lookup, which would otherwise say bestax has
   * no prop for them.
   */
  readonly omits?: Readonly<Record<string, string>>;
}

// ---- Value vocabularies (held to @allxsmith/bestax-bulma/constants) --------

export const COLORS = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'black-bis',
  'black-ter',
  'grey-darker',
  'grey-dark',
  'grey',
  'grey-light',
  'grey-lighter',
  'white',
  'white-bis',
  'white-ter',
  'light',
  'dark',
] as const;
export const SIZES = ['0', '1', '2', '3', '4', '5', '6', 'auto'] as const;
export const TEXT_SIZES = ['1', '2', '3', '4', '5', '6', '7'] as const;
export const ALIGNMENTS = ['centered', 'justified', 'left', 'right'] as const;
export const TEXT_TRANSFORMS = [
  'capitalized',
  'lowercase',
  'uppercase',
  'italic',
] as const;
export const TEXT_WEIGHTS = [
  'light',
  'normal',
  'medium',
  'semibold',
  'bold',
] as const;
export const FONT_FAMILIES = [
  'sans-serif',
  'monospace',
  'primary',
  'secondary',
  'code',
] as const;
export const DISPLAYS = [
  'block',
  'flex',
  'inline',
  'inline-block',
  'inline-flex',
  'grid',
] as const;
export const FLEX_DIRECTIONS = [
  'row',
  'row-reverse',
  'column',
  'column-reverse',
] as const;
export const FLEX_WRAPS = ['nowrap', 'wrap', 'wrap-reverse'] as const;
export const JUSTIFY_CONTENTS = [
  'flex-start',
  'flex-end',
  'center',
  'space-between',
  'space-around',
  'space-evenly',
  'start',
  'end',
  'left',
  'right',
] as const;
export const ALIGN_CONTENTS = [
  'flex-start',
  'flex-end',
  'center',
  'space-between',
  'space-around',
  'space-evenly',
  'stretch',
] as const;
export const ALIGN_ITEMS = [
  'stretch',
  'flex-start',
  'flex-end',
  'center',
  'baseline',
  'start',
  'end',
] as const;
export const ALIGN_SELFS = [
  'auto',
  'flex-start',
  'flex-end',
  'center',
  'baseline',
  'stretch',
] as const;
export const FLEX_GROW_SHRINK = ['0', '1', '2', '3', '4', '5'] as const;
export const VIEWPORTS = [
  'mobile',
  'tablet',
  'tablet-only',
  'touch',
  'desktop',
  'desktop-only',
  'widescreen',
  'widescreen-only',
  'fullhd',
] as const;

/** The viewports bestax's per-breakpoint size and alignment props cover. */
const SIZE_VIEWPORTS = [
  'mobile',
  'tablet',
  'desktop',
  'widescreen',
  'fullhd',
] as const;

/** Colors Bulma styles on a component (`.button.is-primary`), not just text. */
const COMPONENT_COLORS = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'white',
  'light',
  'dark',
] as const;

const COLUMN_SIZES = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  'full',
  'half',
  'one-third',
  'two-thirds',
  'one-quarter',
  'three-quarters',
  'one-fifth',
  'two-fifths',
  'three-fifths',
  'four-fifths',
] as const;

const OFFSETS = COLUMN_SIZES.filter(size => size !== 'full');

/** `tablet-only` → `TabletOnly`: the suffix bestax puts on per-viewport props. */
export function viewportSuffix(viewport: string): string {
  return viewport
    .split('-')
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join('');
}

// ---- Builders ---------------------------------------------------------------

const flag = (prop: string): Modifier => ({ writes: [{ prop }] });
const set = (prop: string, value: string): Modifier => ({
  writes: [{ prop, value }],
});

/** `prefix + value + suffix` → `prop = value`, for each value. */
function tokens(
  prefix: string,
  values: readonly string[],
  prop: string,
  suffix = ''
): Record<string, Modifier> {
  return Object.fromEntries(
    values.map(value => [`${prefix}${value}${suffix}`, set(prop, value)])
  );
}

/** The same, once per viewport: `is-6-mobile` → `sizeMobile="6"`. */
function perViewport(
  prefix: string,
  values: readonly string[],
  prop: string,
  viewports: readonly string[]
): Record<string, Modifier> {
  return Object.assign(
    {},
    ...viewports.map(viewport =>
      tokens(
        prefix,
        values,
        `${prop}${viewportSuffix(viewport)}`,
        `-${viewport}`
      )
    )
  );
}

function flags(map: Record<string, string>): Record<string, Modifier> {
  return Object.fromEntries(
    Object.entries(map).map(([token, prop]) => [token, flag(prop)])
  );
}

const BASE = {
  status: 'mapped',
  textColor: 'textColor',
  bgColor: 'bgColor',
} as const;

// ---- Roots ------------------------------------------------------------------

export const ROOTS: Readonly<Record<string, RootEntry>> = {
  block: {
    ...BASE,
    target: 'Block',
    tag: 'div',
    ownProps: ['textColor', 'color', 'bgColor'],
  },
  box: {
    ...BASE,
    target: 'Box',
    tag: 'div',
    ownProps: ['textColor', 'color', 'bgColor', 'hasShadow'],
  },
  button: {
    ...BASE,
    target: 'Button',
    tag: 'button',
    as: 'any',
    modifiers: {
      ...tokens(
        'is-',
        [
          'primary',
          'link',
          'info',
          'success',
          'warning',
          'danger',
          'white',
          'dark',
          'black',
          'text',
          'ghost',
        ],
        'color'
      ),
      ...tokens('is-', ['small', 'normal', 'medium', 'large'], 'size'),
      // `color="light"` renders no class on a Button; `isLight` renders it.
      ...flags({
        'is-light': 'isLight',
        'is-rounded': 'isRounded',
        'is-loading': 'isLoading',
        'is-static': 'isStatic',
        'is-fullwidth': 'isFullwidth',
        'is-outlined': 'isOutlined',
        'is-inverted': 'isInverted',
        'is-focused': 'isFocused',
        'is-active': 'isActive',
        'is-hovered': 'isHovered',
      }),
    },
    omits: {
      'is-disabled':
        'bestax `Button` renders it through `isDisabled`, which also disables the element (`disabled`, or `aria-disabled` on a link)',
    },
    dropsAttr: {
      // Kept only on the elements `disabled` means something on.
      disabled: {
        except: [
          'button',
          'fieldset',
          'input',
          'optgroup',
          'option',
          'select',
          'textarea',
        ],
      },
      // The link attributes render only on the anchor path, which is every
      // tag but a <button>.
      href: { on: ['button'] },
      target: { on: ['button'] },
      rel: { on: ['button'] },
      // The submit overrides are withheld from an <a>.
      ...Object.fromEntries(
        [
          'formAction',
          'formEncType',
          'formMethod',
          'formNoValidate',
          'formTarget',
        ].map(name => [name, { on: ['a'] }])
      ),
    },
    ownProps: [
      'as',
      'color',
      'size',
      'isLight',
      'isRounded',
      'isLoading',
      'isStatic',
      'isFullwidth',
      'isFullWidth',
      'isOutlined',
      'isInverted',
      'isFocused',
      'isActive',
      'isHovered',
      'isDisabled',
      'textColor',
      'bgColor',
    ],
  },
  buttons: {
    ...BASE,
    target: 'Buttons',
    tag: 'div',
    requiresChildren: true,
    modifiers: {
      ...flags({
        'is-centered': 'isCentered',
        'is-right': 'isRight',
        'has-addons': 'hasAddons',
      }),
      ...tokens('are-', ['small', 'medium', 'large'], 'size'),
    },
    ownProps: [
      'textColor',
      'color',
      'bgColor',
      'isCentered',
      'isRight',
      'hasAddons',
      'size',
    ],
  },
  columns: {
    ...BASE,
    target: 'Columns',
    tag: 'div',
    modifiers: {
      ...flags({
        'is-centered': 'isCentered',
        'is-gapless': 'isGapless',
        'is-multiline': 'isMultiline',
        'is-vcentered': 'isVCentered',
        'is-mobile': 'isMobile',
        'is-desktop': 'isDesktop',
      }),
      ...tokens('is-', ['0', '1', '2', '3', '4', '5', '6', '7', '8'], 'gap'),
      ...perViewport(
        'is-',
        ['0', '1', '2', '3', '4', '5', '6', '7', '8'],
        'gap',
        SIZE_VIEWPORTS
      ),
    },
    ownProps: [
      'textColor',
      'color',
      'bgColor',
      'isCentered',
      'isGapless',
      'isMultiline',
      'isVCentered',
      'isMobile',
      'isDesktop',
      'gap',
      'gapMobile',
      'gapTablet',
      'gapDesktop',
      'gapWidescreen',
      'gapFullhd',
      'gapSize',
      'gapSizeMobile',
      'gapSizeTablet',
      'gapSizeDesktop',
      'gapSizeWidescreen',
      'gapSizeFullhd',
    ],
  },
  column: {
    ...BASE,
    target: 'Column',
    tag: 'div',
    modifiers: {
      ...tokens('is-', COLUMN_SIZES, 'size'),
      ...perViewport('is-', COLUMN_SIZES, 'size', SIZE_VIEWPORTS),
      // No `full`: Bulma has no full-width offset.
      ...tokens('is-offset-', OFFSETS, 'offset'),
      ...perViewport('is-offset-', OFFSETS, 'offset', SIZE_VIEWPORTS),
      'is-narrow': flag('isNarrow'),
      ...Object.fromEntries(
        [...SIZE_VIEWPORTS, 'touch'].map(viewport => [
          `is-narrow-${viewport}`,
          flag(`isNarrow${viewportSuffix(viewport)}`),
        ])
      ),
    },
    ownProps: [
      'textColor',
      'color',
      'bgColor',
      'size',
      'sizeMobile',
      'sizeTablet',
      'sizeDesktop',
      'sizeWidescreen',
      'sizeFullhd',
      'offset',
      'offsetMobile',
      'offsetTablet',
      'offsetDesktop',
      'offsetWidescreen',
      'offsetFullhd',
      'isNarrow',
      'isNarrowMobile',
      'isNarrowTablet',
      'isNarrowTouch',
      'isNarrowDesktop',
      'isNarrowWidescreen',
      'isNarrowFullhd',
    ],
  },
  container: {
    ...BASE,
    target: 'Container',
    tag: 'div',
    modifiers: {
      ...flags({
        'is-fluid': 'fluid',
        'is-widescreen': 'widescreen',
        'is-fullhd': 'fullhd',
      }),
      ...Object.fromEntries(
        ['tablet', 'desktop', 'widescreen'].map(breakpoint => [
          `is-max-${breakpoint}`,
          {
            writes: [
              { prop: 'breakpoint', value: breakpoint },
              { prop: 'isMax' },
            ],
          },
        ])
      ),
    },
    ownProps: [
      'textColor',
      'color',
      'bgColor',
      'fluid',
      'widescreen',
      'fullhd',
      'breakpoint',
      'isMax',
    ],
  },
  content: {
    ...BASE,
    target: 'Content',
    tag: 'div',
    modifiers: tokens('is-', ['small', 'medium', 'large'], 'size'),
    ownProps: ['textColor', 'color', 'bgColor', 'size'],
  },
  delete: {
    ...BASE,
    target: 'Delete',
    tag: 'button',
    modifiers: tokens('is-', ['small', 'medium', 'large'], 'size'),
    defaults: { type: 'button', 'aria-label': 'Close' },
    // DeleteProps takes a <button>'s global attributes, not its form ones.
    untypedAttrs: [
      'type',
      'name',
      'value',
      'form',
      'formAction',
      'formEncType',
      'formMethod',
      'formNoValidate',
      'formTarget',
    ],
    ownProps: [
      'textColor',
      'color',
      'bgColor',
      'size',
      'ariaLabel',
      'disabled',
    ],
    passThrough: ['onClick'],
  },
  footer: {
    ...BASE,
    target: 'Footer',
    tag: 'footer',
    as: ['footer', 'div'],
    ownProps: ['as', 'color', 'bgColor', 'textColor'],
  },
  hero: {
    ...BASE,
    target: 'Hero',
    tag: 'section',
    // Hero's `color` is the component color, and `textColor` reaches the DOM
    // as an attribute rather than a class.
    textColor: null,
    modifiers: {
      ...tokens('is-', COMPONENT_COLORS, 'color'),
      ...tokens(
        'is-',
        ['small', 'medium', 'large', 'fullheight', 'fullheight-with-navbar'],
        'size'
      ),
    },
    ownProps: ['color', 'size', 'bgColor', 'fullheightWithNavbar'],
  },
  'hero-head': {
    ...BASE,
    target: 'Hero.Head',
    tag: 'div',
    ownProps: ['color', 'bgColor', 'textColor'],
  },
  'hero-body': {
    ...BASE,
    target: 'Hero.Body',
    tag: 'div',
    ownProps: ['color', 'bgColor', 'textColor'],
  },
  'hero-foot': {
    ...BASE,
    target: 'Hero.Foot',
    tag: 'div',
    ownProps: ['color', 'bgColor', 'textColor'],
  },
  level: {
    ...BASE,
    target: 'Level',
    tag: 'nav',
    modifiers: flags({ 'is-mobile': 'isMobile' }),
    ownProps: ['isMobile', 'color', 'bgColor', 'textColor'],
  },
  'level-left': {
    ...BASE,
    target: 'Level.Left',
    tag: 'div',
    ownProps: ['color', 'bgColor', 'textColor'],
  },
  'level-right': {
    ...BASE,
    target: 'Level.Right',
    tag: 'div',
    ownProps: ['color', 'bgColor', 'textColor'],
  },
  'level-item': {
    ...BASE,
    target: 'Level.Item',
    tag: 'div',
    as: ['div', 'p', 'a'],
    // The anchor attributes, and `rel`, reach only an <a>
    // (`STRIP_FROM_NON_ANCHOR` in bulma-ui's Level.tsx).
    dropsAttr: Object.fromEntries(
      [
        'href',
        'target',
        'download',
        'hrefLang',
        'ping',
        'referrerPolicy',
        'media',
        'type',
        'rel',
      ].map(name => [name, { except: ['a'] }])
    ),
    ownProps: ['as', 'hasTextCentered', 'color', 'bgColor', 'textColor'],
  },
  media: {
    ...BASE,
    target: 'Media',
    tag: 'article',
    as: ['article', 'div'],
    ownProps: ['as', 'color', 'bgColor', 'textColor'],
  },
  'media-left': {
    ...BASE,
    target: 'Media.Left',
    tag: 'figure',
    as: ['figure', 'div'],
    ownProps: ['as', 'color', 'bgColor', 'textColor'],
  },
  'media-content': {
    ...BASE,
    target: 'Media.Content',
    tag: 'div',
    ownProps: ['color', 'bgColor', 'textColor'],
  },
  'media-right': {
    ...BASE,
    target: 'Media.Right',
    tag: 'div',
    ownProps: ['color', 'bgColor', 'textColor'],
  },
  notification: {
    ...BASE,
    target: 'Notification',
    tag: 'div',
    // `bgColor` reaches the DOM as an attribute, and `backgroundColor`
    // renders but is not in its props type.
    bgColor: null,
    modifiers: {
      ...tokens(
        'is-',
        COMPONENT_COLORS.filter(color => color !== 'light'),
        'color'
      ),
      ...flags({ 'is-light': 'isLight' }),
    },
    ownProps: ['color', 'textColor', 'isLight', 'hasDelete', 'onDelete'],
  },
  progress: {
    ...BASE,
    target: 'Progress',
    tag: 'progress',
    textColor: null,
    bgColor: null,
    numberAttrs: ['value', 'max'],
    modifiers: {
      ...tokens('is-', COMPONENT_COLORS, 'color'),
      ...tokens('is-', ['small', 'medium', 'large'], 'size'),
    },
    ownProps: ['color', 'size'],
    passThrough: ['value', 'max'],
  },
  section: {
    ...BASE,
    target: 'Section',
    tag: 'section',
    modifiers: tokens('is-', ['medium', 'large'], 'size'),
    ownProps: ['color', 'bgColor', 'textColor', 'size'],
  },
  subtitle: {
    ...BASE,
    target: 'SubTitle',
    tag: 'h1',
    as: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'],
    sizeDrivesTag: true,
    modifiers: {
      ...Object.fromEntries(
        ['1', '2', '3', '4', '5', '6'].map(n => [
          `is-${n}`,
          { writes: [{ prop: 'size', value: n }], tagIn: [`h${n}`, 'p'] },
        ])
      ),
      ...flags({ 'has-skeleton': 'hasSkeleton' }),
    },
    ownProps: ['size', 'as', 'hasSkeleton', 'textColor', 'bgColor'],
  },
  table: {
    ...BASE,
    target: 'Table',
    tag: 'table',
    // Table's text color is its `color` prop; `textColor` and `bgColor`
    // reach the DOM as attributes, and `backgroundColor` does not typecheck.
    textColor: 'color',
    bgColor: null,
    modifiers: flags({
      'is-bordered': 'isBordered',
      'is-striped': 'isStriped',
      'is-narrow': 'isNarrow',
      'is-hoverable': 'isHoverable',
      'is-fullwidth': 'isFullwidth',
    }),
    ownProps: [
      'isBordered',
      'isStriped',
      'isNarrow',
      'isHoverable',
      'isFullwidth',
      'isFullWidth',
      'isResponsive',
    ],
  },
  tag: {
    ...BASE,
    target: 'Tag',
    tag: 'span',
    textColor: null,
    bgColor: 'backgroundColor',
    modifiers: {
      ...tokens(
        'is-',
        COMPONENT_COLORS.filter(color => color !== 'light'),
        'color'
      ),
      ...tokens('is-', ['medium', 'large'], 'size'),
      ...flags({
        'is-light': 'isLight',
        'is-rounded': 'isRounded',
        'is-hoverable': 'isHoverable',
      }),
    },
    omits: {
      'is-delete':
        'bestax `Tag` renders it through `isDelete`, which also turns the tag into a <button>',
    },
    ownProps: [
      'color',
      'size',
      'isLight',
      'isRounded',
      'isDelete',
      'isHoverable',
      'onDelete',
    ],
  },
  tags: {
    ...BASE,
    target: 'Tags',
    tag: 'div',
    // Tags types no color prop at all: `textColor` and `bgColor` reach the DOM
    // as attributes, and the raw helper names render but do not typecheck.
    textColor: null,
    bgColor: null,
    modifiers: {
      ...flags({ 'has-addons': 'hasAddons' }),
      ...tokens('are-', ['medium', 'large'], 'size'),
    },
    ownProps: ['hasAddons', 'isMultiline', 'size'],
  },
  title: {
    ...BASE,
    target: 'Title',
    tag: 'h1',
    as: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'],
    sizeDrivesTag: true,
    modifiers: {
      ...Object.fromEntries(
        ['1', '2', '3', '4', '5', '6'].map(n => [
          `is-${n}`,
          { writes: [{ prop: 'size', value: n }], tagIn: [`h${n}`, 'p'] },
        ])
      ),
      ...flags({ 'is-spaced': 'isSpaced', 'has-skeleton': 'hasSkeleton' }),
    },
    ownProps: ['size', 'isSpaced', 'as', 'hasSkeleton', 'textColor', 'bgColor'],
  },

  // ---- Families bestax has but that do not map element by element yet ------
  breadcrumb: todo(
    'bestax `Breadcrumb` renders the `<ul>` itself and adds an `aria-label`'
  ),
  card: todo(
    'bestax `Card` wraps any child that is not one of its parts in `.card-content`, so convert the card and its parts together, by hand'
  ),
  'card-header': part(),
  'card-header-title': part(),
  'card-header-icon': part(),
  'card-image': part(),
  'card-content': part(),
  'card-footer': part(),
  'card-footer-item': part(),
  cell: todo(
    'this source leaves Grid markup as written; convert it to bestax `Grid` and `Cell` by hand (`Grid isFixed` renders the `.fixed-grid` wrapper itself)'
  ),
  grid: todo(
    'this source leaves Grid markup as written; convert it to bestax `Grid` and `Cell` by hand (`Grid isFixed` renders the `.fixed-grid` wrapper itself)'
  ),
  'fixed-grid': todo(
    'this source leaves Grid markup as written; convert it to bestax `Grid` and `Cell` by hand (`Grid isFixed` renders the `.fixed-grid` wrapper itself)'
  ),
  checkbox: todo(
    "bestax `Checkbox` renders its own styled markup, not Bulma's"
  ),
  checkboxes: todo(
    'bestax `Checkboxes` renders its own `.field` and `.control` wrappers'
  ),
  radio: todo("bestax `Radio` renders its own styled markup, not Bulma's"),
  radios: todo(
    'bestax `Radios` renders its own `.field` and `.control` wrappers'
  ),
  field: todo(
    'bestax form controls render their own `.field` and `.control` wrappers; see the unmappables reference'
  ),
  'field-label': part(),
  'field-body': part(),
  control: part(),
  input: todo(
    'bestax `Input` renders its own `.field` and `.control` wrappers'
  ),
  textarea: todo(
    'bestax `TextArea` renders its own `.field` and `.control` wrappers'
  ),
  select: todo(
    'bestax `Select` renders the `.select` wrapper and the `<select>` together'
  ),
  file: todo('bestax `File` renders the whole `.file-label` tree itself'),
  'file-label': part(),
  'file-input': part(),
  'file-cta': part(),
  'file-icon': part(),
  'file-name': part(),
  dropdown: todo(
    'bestax `Dropdown` renders its own trigger and menu from props'
  ),
  'dropdown-menu': part(),
  'dropdown-content': part(),
  'dropdown-item': part(),
  'dropdown-divider': part(),
  icon: todo('bestax `Icon` renders its own `<i>` and adds an `aria-label`'),
  'icon-text': todo(
    'bestax `IconText` pairs with `Icon`, which renders its own `<i>`'
  ),
  image: todo('bestax `Image` renders its own `<img>`'),
  menu: todo('bestax `Menu.Item` renders the `<li>` and the `<a>` together'),
  'menu-label': part(),
  'menu-list': part(),
  'menu-item': part(),
  message: todo(
    'bestax `Message` always wraps its children in `.message-body`'
  ),
  'message-header': part(),
  'message-body': part(),
  modal: todo(
    'bestax `Modal` renders its own background and content parts, and adds dialog attributes'
  ),
  'modal-background': part(),
  'modal-content': part(),
  'modal-card': part(),
  'modal-card-head': part(),
  'modal-card-title': part(),
  'modal-card-body': part(),
  'modal-card-foot': part(),
  'modal-close': part(),
  navbar: todo(
    'bestax `Navbar` adds navigation roles, and its burger renders its own spans'
  ),
  'navbar-brand': part(),
  'navbar-burger': part(),
  'navbar-menu': part(),
  'navbar-start': part(),
  'navbar-end': part(),
  'navbar-item': part(),
  'navbar-link': part(),
  'navbar-dropdown': part(),
  'navbar-divider': part(),
  'navbar-content': part(),
  'navbar-tabs': part(),
  pagination: todo(
    'bestax `Pagination` renders its own list items and adds navigation roles'
  ),
  'pagination-list': part(),
  'pagination-link': part(),
  'pagination-ellipsis': part(),
  'pagination-previous': part(),
  'pagination-next': part(),
  panel: todo(
    'bestax `Panel` parts render their own tags and attributes (`Panel.Block` is an `<a>`, `Panel.Icon` adds an `aria-label`)'
  ),
  'panel-heading': part(),
  'panel-tabs': part(),
  'panel-block': part(),
  'panel-icon': part(),
  'panel-list': part(),
  tabs: todo(
    "bestax `Tabs` renders each tab's `<li>` and `<a>` together, with tab roles"
  ),
  'table-container': todo(
    'bestax renders `.table-container` from `Table isResponsive`'
  ),
  'skeleton-block': todo('bestax `Skeleton` renders its own markup'),
  'skeleton-lines': todo('bestax `Skeleton` renders its own markup'),

  // ---- Valid Bulma, nothing to convert to --------------------------------------
  // The other sources emit these on purpose where bestax has no component.
  help: plain('bestax renders `.help` only inside its form controls'),
  label: plain('bestax renders `.label` only inside its form controls'),
  loader: plain("bestax `Loading` is an overlay, not Bulma's inline spinner"),
  'hero-buttons': plain(
    'a layout class inside `.hero`; bestax has no part for it'
  ),
  'hero-video': plain(
    'a layout class inside `.hero`; bestax has no part for it'
  ),
  'theme-dark': plain('a theme scope; bestax sets themes through `Theme`'),
  'theme-light': plain('a theme scope; bestax sets themes through `Theme`'),
  fa: plain("Font Awesome's own class, styled by Bulma inside `.icon`"),
  marginless: plain('a Bulma helper with no bestax prop'),
  paddingless: plain('a Bulma helper with no bestax prop'),
};

function todo(why: string): RootEntry {
  return { status: 'todo', why };
}

function part(): RootEntry {
  return { status: 'todo', part: true };
}

function plain(why: string): RootEntry {
  return { status: 'plain', why };
}

/**
 * Which root wins when an element carries two (`column box`): layout before
 * surface, so the element keeps the role that decides where it sits. The
 * other root stays in `className`, which renders the same either way.
 */
export const PRECEDENCE: readonly string[] = [
  'columns',
  'column',
  'container',
  'section',
  'hero',
  'hero-head',
  'hero-body',
  'hero-foot',
  'footer',
  'level',
  'level-left',
  'level-right',
  'level-item',
  'media',
  'media-left',
  'media-content',
  'media-right',
  'buttons',
  'tags',
  'button',
  'tag',
  'delete',
  'progress',
  'table',
  'title',
  'subtitle',
  'notification',
  'box',
  'content',
  'block',
];

/** Refs reach the element only through these targets. */
export const FORWARDS_REF: readonly string[] = ['Button', 'Link'];

/**
 * Plain tags bestax wraps, for an element with helper classes and no root
 * (`<p className="has-text-centered">` → `<Paragraph textAlign="centered">`).
 */
export const WRAPPERS: Readonly<Record<string, string>> = {
  p: 'Paragraph',
  span: 'Span',
  strong: 'Strong',
  em: 'Emphasis',
  code: 'Code',
  pre: 'Pre',
  a: 'Link',
  li: 'ListItem',
  ol: 'OrderedList',
  ul: 'UnorderedList',
  figure: 'Figure',
};

/** The wrappers' own props, as `ROOTS` lists them for the components. */
export const WRAPPER_OWN_PROPS: Readonly<Record<string, readonly string[]>> = {
  Paragraph: ['textColor', 'bgColor'],
  Span: ['textColor', 'bgColor'],
  Strong: ['textColor', 'bgColor'],
  Emphasis: ['textColor', 'bgColor'],
  Code: ['textColor', 'bgColor'],
  Pre: ['textColor', 'bgColor'],
  Link: ['as', 'textColor', 'bgColor', 'isActive'],
  ListItem: ['textColor', 'bgColor'],
  OrderedList: ['textColor', 'bgColor'],
  UnorderedList: ['textColor', 'bgColor'],
  Figure: ['textColor', 'bgColor'],
};

/** Bulma 0.9 classes v1 dropped, with what replaced them. */
export const LEGACY_09: Readonly<Record<string, string>> = {
  tile: 'Bulma v1 removed tiles; rebuild the layout with `Grid` and `Cell` (see the Bulma 0.9 to 1 guide)',
};

// ---- Helper classes -----------------------------------------------------------

/**
 * `text-color` and `background` resolve to a per-target prop (`RootEntry`'s
 * `textColor`/`bgColor`); `flex-container` only renders beside a flex
 * `display`; `display` cannot mix a base value with per-viewport ones.
 */
export type HelperGroup =
  | 'text-color'
  | 'background'
  | 'spacing'
  | 'typography'
  | 'display'
  | 'visibility'
  | 'flex-container'
  | 'flex-item'
  | 'other';

export interface HelperToken {
  readonly group: HelperGroup;
  readonly write: PropWrite;
}

function helperTokens(
  group: HelperGroup,
  prefix: string,
  values: readonly string[],
  prop: string,
  suffix = ''
): Array<[string, HelperToken]> {
  return values.map(value => [
    `${prefix}${value}${suffix}`,
    { group, write: { prop, value } },
  ]);
}

function helperPerViewport(
  group: HelperGroup,
  prefix: string,
  values: readonly string[],
  prop: string,
  viewports: readonly string[]
): Array<[string, HelperToken]> {
  return viewports.flatMap(viewport =>
    helperTokens(
      group,
      prefix,
      values,
      `${prop}${viewportSuffix(viewport)}`,
      `-${viewport}`
    )
  );
}

function helperFlag(
  group: HelperGroup,
  token: string,
  prop: string
): [string, HelperToken] {
  return [token, { group, write: { prop } }];
}

/** The color helpers also take the two CSS keywords. */
const HELPER_COLORS = [...COLORS, 'inherit', 'current'];

const SPACING_PROPS = [
  'm',
  'mt',
  'mr',
  'mb',
  'ml',
  'mx',
  'my',
  'p',
  'pt',
  'pr',
  'pb',
  'pl',
  'px',
  'py',
] as const;

export const HELPER_TOKENS: ReadonlyMap<string, HelperToken> = new Map([
  // Colors: the prop is a placeholder the planner swaps for the target's own.
  ...helperTokens('text-color', 'has-text-', HELPER_COLORS, 'textColor'),
  ...helperTokens('background', 'has-background-', HELPER_COLORS, 'bgColor'),
  ...SPACING_PROPS.flatMap(prop =>
    helperTokens('spacing', `${prop}-`, SIZES, prop)
  ),
  ...helperTokens('typography', 'is-size-', TEXT_SIZES, 'textSize'),
  ...helperPerViewport(
    'typography',
    'is-size-',
    TEXT_SIZES,
    'textSize',
    SIZE_VIEWPORTS
  ),
  ...helperTokens('typography', 'has-text-', ALIGNMENTS, 'textAlign'),
  ...helperPerViewport(
    'typography',
    'has-text-',
    ALIGNMENTS,
    'textAlign',
    SIZE_VIEWPORTS
  ),
  ...helperTokens('typography', 'is-', TEXT_TRANSFORMS, 'textTransform'),
  ...helperTokens('typography', 'has-text-weight-', TEXT_WEIGHTS, 'textWeight'),
  ...helperTokens('typography', 'is-family-', FONT_FAMILIES, 'fontFamily'),
  ...helperTokens('display', 'is-', DISPLAYS, 'display'),
  ...helperPerViewport('display', 'is-', DISPLAYS, 'display', VIEWPORTS),
  // `is-hidden` is a visibility, not a display: bestax drops a base
  // `display` whenever a per-viewport one is set, and would lose it.
  ...helperTokens(
    'visibility',
    'is-',
    ['hidden', 'invisible', 'sr-only'],
    'visibility'
  ),
  ...helperPerViewport(
    'visibility',
    'is-',
    ['hidden', 'invisible'],
    'visibility',
    VIEWPORTS
  ),
  ...helperTokens(
    'flex-container',
    'is-flex-direction-',
    FLEX_DIRECTIONS,
    'flexDirection'
  ),
  ...helperTokens('flex-container', 'is-flex-wrap-', FLEX_WRAPS, 'flexWrap'),
  ...helperTokens(
    'flex-container',
    'is-justify-content-',
    JUSTIFY_CONTENTS,
    'justifyContent'
  ),
  ...helperTokens(
    'flex-container',
    'is-align-content-',
    ALIGN_CONTENTS,
    'alignContent'
  ),
  ...helperTokens(
    'flex-container',
    'is-align-items-',
    ALIGN_ITEMS,
    'alignItems'
  ),
  ...helperTokens('flex-item', 'is-align-self-', ALIGN_SELFS, 'alignSelf'),
  ...helperTokens('flex-item', 'is-flex-grow-', FLEX_GROW_SHRINK, 'flexGrow'),
  ...helperTokens(
    'flex-item',
    'is-flex-shrink-',
    FLEX_GROW_SHRINK,
    'flexShrink'
  ),
  ...helperTokens('other', 'is-pulled-', ['left', 'right'], 'float'),
  [
    'is-clipped',
    { group: 'other', write: { prop: 'overflow', value: 'clipped' } },
  ],
  helperFlag('other', 'is-overlay', 'overlay'),
  [
    'is-unselectable',
    { group: 'other', write: { prop: 'interaction', value: 'unselectable' } },
  ],
  [
    'is-clickable',
    { group: 'other', write: { prop: 'interaction', value: 'clickable' } },
  ],
  [
    'is-radiusless',
    { group: 'other', write: { prop: 'radius', value: 'radiusless' } },
  ],
  [
    'is-shadowless',
    { group: 'other', write: { prop: 'shadow', value: 'shadowless' } },
  ],
  ...helperTokens('other', 'is-', ['mobile', 'narrow'], 'responsive'),
  helperFlag('other', 'is-skeleton', 'skeleton'),
  helperFlag('other', 'is-clearfix', 'clearfix'),
  helperFlag('other', 'is-relative', 'relative'),
]);

/** Every helper prop name, for the attribute-collision check. */
export const HELPER_PROPS: ReadonlySet<string> = new Set([
  'color',
  'backgroundColor',
  'textColor',
  'bgColor',
  'colorShade',
  'backgroundColorShade',
  'viewport',
  ...[...HELPER_TOKENS.values()].map(token => token.write.prop),
]);

// ---- Classes that stay classes ----------------------------------------------------

/**
 * Bulma classes this source never turns into a prop, grouped by why. Any
 * class not named above stays in `className` anyway; this list exists so
 * every class in Bulma's stylesheet is accounted for, and a Bulma release
 * that adds one fails a test until someone decides what it is.
 */
export const PASSTHROUGH: ReadonlyArray<{
  readonly why: string;
  readonly match: RegExp;
}> = [
  {
    why: 'a color shade, a scheme color or a palette; shades stay as classes',
    match:
      /^(?:has-(?:text|background)-[a-z]+(?:-[a-z]+)?-(?:\d{2,3}|invert|light|dark|soft|bold|on-scheme)(?:-invert)?|has-(?:text|background)-text|has-background|is-palette-[a-z]+|is-(?:bold|soft))$/,
  },
  {
    why: "a breakpoint bestax's per-viewport props do not cover",
    match: /-(?:touch|tablet-only|desktop-only|widescreen-only)$/,
  },
  {
    why: 'Grid and Cell layout, which this source leaves as markup',
    match:
      /^(?:is-(?:col|row)-.+|has-\d+-cols(?:-.+)?|is-(?:column|row)-gap-\d+|is-gap-\d+|is-auto-fill)$/,
  },
  {
    why: 'an `.image` modifier; `.image` stays as markup',
    match:
      /^(?:is-\d+by\d+|is-\d+x\d+|is-square|is-aspect-ratio-.+|has-ratio)$/,
  },
  {
    why: 'a Bulma helper with no bestax prop',
    match:
      /^(?:is-display-.+|is-visibility-.+|is-overflow-.+|is-position-.+|is-float-.+|is-clear-.+|has-radius-.+|has-text-weight-extrabold|is-align-content-(?:baseline|start|end)|is-align-items-self-(?:start|end)|is-offset-0(?:-[a-z]+)?)$/,
  },
  {
    why: 'a modifier of markup this source leaves alone, or one bestax has no prop for',
    match:
      /^(?:has-addons-.+|has-[a-z]+-separator|has-dropdown(?:-up)?|has-fixed-size|has-icons-(?:left|right)|has-name|has-(?:spaced-)?navbar-fixed-(?:top|bottom)(?:-desktop)?|has-shadow|has-auto-count|is-arrowless|is-boxed|is-center|is-current|is-delete|is-disabled|is-empty|is-expanded|is-fixed-(?:top|bottom)(?:-desktop)?|is-flexible|is-grouped(?:-.+)?|is-halfheight|is-horizontal|is-left|is-(?:lower|upper)-(?:alpha|roman)|is-multiple|is-responsive|is-selected|is-tab|is-toggle(?:-rounded)?|is-transparent|is-underlined|is-up|is-wrapped)$/,
  },
];

/**
 * Why a class stays a class. Consult it only for a class nothing above
 * converts: a modifier converts on its own root and nowhere else, so the same
 * class can be both (`is-narrow-touch` is a Column prop, and a breakpoint
 * bestax has no prop for on anything else).
 */
export function passthroughReason(token: string): string | undefined {
  return PASSTHROUGH.find(group => group.match.test(token))?.why;
}

// ---- Lookups ------------------------------------------------------------------

/*
 * Class tokens and tags come from the app's markup, and the tables above are
 * plain objects: `ROOTS.toString` is `Object.prototype.toString`. Every lookup
 * by an app-supplied key goes through these, which read own properties only.
 */

function own<T>(
  record: Readonly<Record<string, T>>,
  key: string
): T | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

/** The table's entry for a class. */
export function rootFor(token: string): RootEntry | undefined {
  return own(ROOTS, token);
}

/**
 * A class that decides what its element is, for a TODO: a root the table
 * converts or a family's outermost class. Parts and `plain` roots are not.
 */
export function flaggableRoot(token: string): RootEntry | undefined {
  const entry = rootFor(token);
  return entry && entry.status !== 'plain' && !entry.part ? entry : undefined;
}

/** A root's modifier for a class. */
export function modifierFor(
  entry: RootEntry,
  token: string
): Modifier | undefined {
  return entry.modifiers ? own(entry.modifiers, token) : undefined;
}

/** What replaced a Bulma 0.9 class v1 removed. */
export function legacyHint(token: string): string | undefined {
  return own(LEGACY_09, token);
}

/** The bestax wrapper for a plain tag. */
export function wrapperFor(tag: string): string | undefined {
  return own(WRAPPERS, tag);
}
