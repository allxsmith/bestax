/**
 * The axe check on every story (#2182), and the register of its exemptions.
 *
 * `.storybook/main.ts` registers Storybook's a11y addon and
 * `.storybook/preview.ts` sets the check for every story: axe's WCAG A and
 * AA rules, failing the story in the Storybook browser pass. The first test
 * pins both, so turning the check off or weakening it for every story fails
 * here.
 *
 * A story that has to relax the check turns rules off in its own
 * `parameters.a11y.config.rules`, and the register says why: the open issue
 * that will remove the exemption, or, for an axe false positive, the reason
 * it is one. Any other way of weakening a story's check (another `a11y`
 * option, the `a11y` global, leaving the test pass, or a relaxation on a
 * file's meta, which would reach every story in it) counts as a relaxation
 * the register can't hold, so it fails.
 *
 * The test compares the stories with the register in both directions: a
 * relaxation with no entry fails, and so does an entry whose story no longer
 * relaxes that rule. It can't see whether a cited issue is still open, so
 * the PR that fixes one deletes the story's exemption and its entry here.
 */
import { relative } from 'path';
import { storyFiles } from './sourceFiles';

const SRC = `${__dirname}/..`;

/** An open issue's number, or the reason axe is wrong about the story. */
type Why = number | string;

/** Each of `stories` in `file`, keyed the way the register is, with `rules`. */
const each = (file: string, stories: string[], rules: Record<string, Why>) =>
  Object.fromEntries(stories.map(story => [`${file}#${story}`, rules]));

/** The story file, `#`, and the story's export name. */
const A11Y_EXEMPT: Record<string, Record<string, Why>> = {
  // Carousel's indicators are under the 24px target size.
  ...each(
    'components/Carousel.stories.tsx',
    [
      'ArrowOnHover',
      'Autoplay',
      'Controlled',
      'Default',
      'FontAwesomeIcons',
      'IconSizes',
      'IconVariants',
      'IndicatorInsidePlain',
      'IndicatorStyles',
      'IndicatorTop',
      'Labels',
      'MaterialDesignIcons',
      'NoArrows',
      'NoDrag',
      'NoRepeat',
      'OverlayArrows',
      'RightToLeft',
      'RotationControl',
      'SeveralInView',
      'Testimonials',
      'TransparentArrows',
      'TransparentArrowsLight',
      'WithImages',
    ],
    { 'target-size': 1926 }
  ),
  'components/Carousel.stories.tsx#MaterialSymbols': {
    'target-size': 1926,
    'label-content-name-mismatch':
      "axe can tell an icon font's ligature from text only once the font has loaded, so the arrows' Material Symbols names (arrow_back) can read as text the button shows, though the icon is aria-hidden.",
  },
  ...each(
    'components/TreeView.stories.tsx',
    [
      'BesideBulmaMenu',
      'Categories',
      'CompoundUsage',
      'DeepTree',
      'Default',
      'FileBrowser',
      'InAMenu',
      'LazyFolders',
      'Outline',
      'Permissions',
      'RightToLeft',
      'Sizes',
    ],
    {
      'label-content-name-mismatch':
        "An expanded tree item contains its group of child items, as the ARIA tree pattern has it, so axe counts the children's text as text the item shows. The item's name is its own label.",
    }
  ),
  ...each(
    'components/Command.stories.tsx',
    ['CompoundUsage', 'CustomFilter', 'Default', 'RightToLeft'],
    {
      'label-content-name-mismatch':
        "An option's name is its label, and its description and shortcut hint describe it (aria-describedby), so axe counts text the option shows that its name leaves out on purpose.",
    }
  ),
  'components/Avatar.stories.tsx#Clickable': {
    'label-content-name-mismatch': 2211,
  },
  // A Link in running text differs from the text around it only by color.
  'components/Timeline.stories.tsx#CompoundUsage': {
    'link-in-text-block': 1858,
  },
  'elements/IconText.stories.tsx#IconTextWithFlex': {
    'link-in-text-block': 1858,
  },
  'elements/Link.stories.tsx#InlineWithText': { 'link-in-text-block': 1858 },
  'form/Checkbox.stories.tsx#CheckboxWithLink': { 'link-in-text-block': 1858 },
  'layout/Footer.stories.tsx#Default': { 'link-in-text-block': 1858 },
  'skill-examples/Overview.stories.tsx#Overview': {
    'link-in-text-block': 1858,
  },
  // A calendar's month cells show a short name (#2209).
  'form/Calendar.stories.tsx#MonthAndYear': {
    'label-content-name-mismatch': 2209,
  },
  'form/DateInput.stories.tsx#InlineMonthPicker': {
    'label-content-name-mismatch': 2209,
  },
  ...each(
    'form/Combobox.stories.tsx',
    [
      'AppendToBodyInModal',
      'FlipsAbove',
      'MultipleWithTags',
      'SearchableSelect',
    ],
    {
      'scrollable-region-focusable':
        "The menu's panel scrolls, with the listbox inside it, and its options are reached from the combobox's input through aria-activedescendant, which the arrow keys move and scroll into view. axe skips the rule only when the box that scrolls is itself the combobox's popup, as the listbox is in Combobox's inline mode. A group's heading can stay scrolled out of view, which is #2268, not this rule's finding.",
    }
  ),
  // A range Slider's thumbs are 20px targets that can sit side by side.
  ...each(
    'form/Slider.stories.tsx',
    [
      'RangeDefault',
      'RangeInHandWiredField',
      'RangeInLabeledField',
      'RangeMinDistance',
      'RangePriceFilter',
      'RangeWithLabel',
      'RangeWithNames',
      'RangeWithOutput',
    ],
    { 'target-size': 2195 }
  ),
};

/** What a story or a story file's meta sets that can change its axe check. */
interface StoryLike {
  parameters?: { a11y?: Record<string, unknown> };
  globals?: { a11y?: unknown };
  tags?: string[];
}

/**
 * What a story relaxes. A rule its `a11y.config.rules` turns off, in the
 * `{ id, enabled: false }` shape, is named by its id, which the register can
 * hold. Anything else that weakens or skips the check is named for what it
 * is, which no register entry can match.
 */
function relaxations(story: StoryLike | undefined): string[] {
  const out: string[] = [];
  const a11y = story?.parameters?.a11y;
  if (a11y) {
    for (const [key, value] of Object.entries(a11y)) {
      if (key !== 'config') {
        out.push(`parameters.a11y.${key}`);
        continue;
      }
      const config = value as Record<string, unknown>;
      for (const configKey of Object.keys(config)) {
        if (configKey !== 'rules')
          out.push(`parameters.a11y.config.${configKey}`);
      }
      for (const rule of (config.rules ?? []) as Record<string, unknown>[]) {
        const plain =
          Object.keys(rule).sort().join() === 'enabled,id' &&
          rule.enabled === false &&
          typeof rule.id === 'string';
        out.push(plain ? String(rule.id) : `rule ${JSON.stringify(rule)}`);
      }
    }
  }
  if (story?.globals?.a11y !== undefined) out.push('globals.a11y');
  if (story?.tags?.includes('!test')) out.push("tags: '!test'");
  return out.sort();
}

describe('the axe check on the stories', () => {
  it('runs the WCAG A and AA rules on every story and fails it on a violation', async () => {
    // The preview reads the color scheme as it loads, and jsdom has no
    // matchMedia. It's loaded by a path the type check doesn't follow, since
    // the stylesheets it imports aren't modules to TypeScript.
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const previewPath = '../../.storybook/preview';
    const { default: preview } = (await import(
      /* @vite-ignore */ previewPath
    )) as {
      default: Record<string, unknown> & { parameters?: { a11y?: unknown } };
    };
    vi.unstubAllGlobals();
    // Changing this weakens the check for every story. color-contrast comes
    // back on with #2188.
    expect(preview.parameters?.a11y).toEqual({
      test: 'error',
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        },
        rules: { 'color-contrast': { enabled: false } },
      },
    });
    expect(preview.globals).toBeUndefined();
    expect(preview.initialGlobals).toBeUndefined();
    expect(preview.tags).toBeUndefined();
    // Without the addon registered, nothing runs axe at all.
    const mainPath = '../../.storybook/main';
    const { default: main } = (await import(/* @vite-ignore */ mainPath)) as {
      default: { addons?: unknown[] };
    };
    expect(
      main.addons?.some(addon =>
        String(addon).split('\\').join('/').endsWith('@storybook/addon-a11y')
      )
    ).toBe(true);
  });

  it('is relaxed only where the register says why', async () => {
    const found: Record<string, string[]> = {};
    for (const file of storyFiles(SRC)) {
      const rel = relative(SRC, file).split('\\').join('/');
      const mod: Record<string, unknown> = await import(file);
      for (const [name, value] of Object.entries(mod)) {
        // A meta's relaxation would reach every story in the file, new ones
        // too, so it gets a key no entry can have.
        const key =
          name === 'default' ? `${rel} (every story)` : `${rel}#${name}`;
        const relaxed = relaxations(value as StoryLike | undefined);
        if (relaxed.length) found[key] = relaxed;
      }
    }
    const registered = Object.fromEntries(
      Object.entries(A11Y_EXEMPT).map(([key, rules]) => [
        key,
        Object.keys(rules).sort(),
      ])
    );
    // A story that relaxes axe needs an entry above, naming its issue or why
    // axe is wrong about it. An entry whose story no longer relaxes the rule
    // comes out with the fix that made it pass.
    expect(found).toEqual(registered);
  });

  it('gives every exemption one story, axe rules and an issue or a reason', () => {
    for (const [key, rules] of Object.entries(A11Y_EXEMPT)) {
      // One story, never a file's meta, and only rules by their axe ids, so
      // no entry can match the names the relaxations above give to anything
      // else that weakens the check.
      expect(key).toMatch(/^[\w/-]+\.stories\.(js|jsx|mjs|ts|tsx)#\w+$/);
      for (const [rule, why] of Object.entries(rules)) {
        expect(rule).toMatch(/^[a-z][a-z0-9-]*$/);
        const ok =
          typeof why === 'number'
            ? Number.isInteger(why) && why > 0
            : why.trim().length > 0;
        expect({ key, rule, ok }).toEqual({ key, rule, ok: true });
      }
    }
  });
});
