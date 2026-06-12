import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { DateTimeInput } from './DateTimeInput';
import { Block } from '../elements/Block';
import { Paragraph } from '../elements/Paragraph';

const meta: Meta<typeof DateTimeInput> = {
  title: 'Form/DateTimeInput',
  component: DateTimeInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Combined date + time picker with an iOS-style popover: the calendar opens with a footer showing the selected time, a Reset button, and a ✓ confirm button. Clicking the time floats the wheel spinner over the calendar.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: [
        undefined,
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
      ],
    },
    size: {
      control: 'select',
      options: [undefined, 'small', 'medium', 'large'],
    },
    hourFormat: { control: 'inline-radio', options: ['24', '12'] },
    enableSeconds: { control: 'boolean' },
    inline: { control: 'boolean' },
    disabled: { control: 'boolean' },
    editable: { control: 'boolean' },
    popover: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof DateTimeInput>;

export const Default: Story = {
  args: {
    label: 'Appointment',
    placeholder: 'YYYY-MM-DD HH:MM',
  },
};

export const Controlled: Story = {
  render: function Render() {
    const [value, setValue] = useState<Date | null>(new Date());
    return (
      <Block>
        <DateTimeInput label="Meeting" value={value} onChange={setValue} />
        <Paragraph>Selected: {value ? value.toString() : '—'}</Paragraph>
      </Block>
    );
  },
};

export const Format12h: Story = {
  args: {
    label: '12-hour clock',
    hourFormat: '12',
    defaultValue: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story:
          "_Native mobile pickers (iOS Safari and Android Chrome) ignore `hourFormat` — both use the device's system clock setting. Pass `mobileNative={false}` to force a specific format._",
      },
    },
  },
};

export const WithSeconds: Story = {
  args: {
    label: 'With seconds',
    enableSeconds: true,
    defaultValue: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story:
          '**iOS Safari has no seconds wheel — Android Chrome does (with caveats).** Android Chrome generally renders a seconds component in its native datetime-local picker when `step < 60`, with [some long-standing quirks](https://bugs.chromium.org/p/chromium/issues/detail?id=461718) — exact seconds-spinner behavior varies by Android version. iOS Safari has no seconds wheel under any circumstances. If you need a guaranteed seconds wheel, pass `mobileNative={false}` to force the custom wheel popover.',
      },
    },
  },
};

export const Format12hWithSeconds: Story = {
  name: '12-hour with seconds',
  args: {
    label: '12-hour with seconds',
    hourFormat: '12',
    enableSeconds: true,
    defaultValue: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Combines `hourFormat="12"` with `enableSeconds` — the wheel gains hours / minutes / seconds / AM-PM columns and the field formats as `hh:mm:ss A`. Native mobile pickers honor neither (`hourFormat` follows the device clock; iOS Safari has no seconds wheel) — pass `mobileNative={false}` if you need this combination on touch devices.',
      },
    },
  },
};

export const Formats: Story = {
  name: 'Formats (compare)',
  render: () => {
    const v = new Date(2026, 4, 30, 13, 45);
    return (
      <Block display="flex" flexDirection="column" gap="4">
        <DateTimeInput label="YYYY-MM-DD HH:mm (default)" defaultValue={v} />
        <DateTimeInput
          label="MM/DD/YYYY hh:mm A"
          format="MM/DD/YYYY hh:mm A"
          defaultValue={v}
        />
        <DateTimeInput
          label="DD.MM.YYYY HH:mm"
          format="DD.MM.YYYY HH:mm"
          defaultValue={v}
        />
        <DateTimeInput
          label="Intl — display only"
          format={{ dateStyle: 'medium', timeStyle: 'short' }}
          editable={false}
          defaultValue={v}
        />
      </Block>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The same date-time rendered through several `format` strings, plus an `Intl.DateTimeFormatOptions` object. Padded token formats support segmented typing across the whole field; `Intl` formats are display-only unless you supply a custom `parse`.',
      },
    },
  },
};

export const MinMax: Story = {
  render: function Render() {
    const today = new Date();
    const min = new Date(today);
    min.setHours(9, 0, 0, 0);
    const max = new Date(today);
    max.setHours(17, 0, 0, 0);
    return (
      <DateTimeInput label="Office hours today only" min={min} max={max} />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '_iOS native picker UI does not enforce `min`/`max` — the user can pick any value. The constraint still fires at form-submission validation, and Android Chrome honors it in the picker UI. Pass `mobileNative={false}` for iOS-side enforcement. ([WebKit bug #225639](https://bugs.webkit.org/show_bug.cgi?id=225639), still open as of 2026.)_',
      },
    },
  },
};

export const DisabledDates: Story = {
  args: {
    label: 'No weekend appointments',
    shouldDisableDate: (d: Date) => d.getDay() === 0 || d.getDay() === 6,
  },
  parameters: {
    docs: {
      description: {
        story:
          "_HTML has no equivalent to `shouldDisableDate` or `unselectableDates`/`unselectableTimes`, so neither iOS Safari nor Android Chrome's native picker will block any values. Pass `mobileNative={false}` for native enforcement, or validate in `onChange`._",
      },
    },
  },
};

export const Inline: Story = {
  args: {
    label: 'Inline',
    inline: true,
    defaultValue: new Date(),
  },
};

export const MobileNative: Story = {
  args: {
    label: 'Native datetime-local',
    mobileNative: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Native picker support varies — iOS lags Android.** The OS-native fallback inherits each platform\'s `<input type="datetime-local">` behavior. The custom popover (`mobileNative={false}`) honors every prop on every device.\n\n**Honored on Android Chrome but NOT on iOS Safari:** `min`/`max` (Android dims out-of-range values; iOS lets the user pick anything — only validates on submit, [WebKit bug #225639](https://bugs.webkit.org/show_bug.cgi?id=225639) still open), `incrementMinutes`/`incrementHours` (Android respects `step`; iOS ignores it), `enableSeconds` (Android shows a seconds component when `step < 60` — with [some long-standing quirks for `datetime-local`](https://bugs.chromium.org/p/chromium/issues/detail?id=461718); iOS has no seconds wheel under any circumstances).\n\n**Ignored on BOTH iOS and Android (HTML-spec gaps):** `shouldDisableDate`/`unselectableDates`/`unselectableTimes` (no predicate equivalent), `firstDayOfWeek`/`dayNames`/`monthNames`/`nearbyMonthDays` (both use device locale), `hourFormat` (both use device clock setting), `format`/`locale` (both use device locale), `placeholder` (neither renders it).\n\nFor anything in either group, pass `mobileNative={false}` to use the custom popover, or validate in `onChange` / server-side.',
      },
    },
  },
};

export const Locale: Story = {
  render: () => (
    <Block>
      <DateTimeInput label="ja-JP" locale="ja-JP" defaultValue={new Date()} />
      <DateTimeInput label="fr-FR" locale="fr-FR" defaultValue={new Date()} />
    </Block>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "_Both iOS Safari and Android Chrome's native pickers always use the device's system locale; the `locale` prop has no effect. Pass `mobileNative={false}` for per-input locale control._",
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <Block>
      <DateTimeInput label="Small" controlSize="small" size="small" />
      <DateTimeInput label="Default" />
      <DateTimeInput label="Medium" controlSize="medium" size="medium" />
      <DateTimeInput label="Large" controlSize="large" size="large" />
    </Block>
  ),
};

export const Colors: Story = {
  render: () => (
    <Block>
      <DateTimeInput label="Primary" color="primary" />
      <DateTimeInput label="Info" color="info" />
      <DateTimeInput label="Success" color="success" />
      <DateTimeInput label="Warning" color="warning" />
      <DateTimeInput label="Danger" color="danger" />
    </Block>
  ),
};

export const States: Story = {
  render: () => (
    <Block>
      <DateTimeInput label="Disabled" disabled />
      <DateTimeInput label="Read only" readOnly defaultValue={new Date()} />
      <DateTimeInput label="Loading" isLoading />
    </Block>
  ),
};

export const UnselectableTimes: Story = {
  args: {
    label: 'Lunch hour blocked',
    unselectableTimes: (d: Date) => d.getHours() === 12,
    defaultValue: new Date(),
  },
};

export const FirstDayOfWeek: Story = {
  args: {
    label: 'Monday-first',
    firstDayOfWeek: 1,
    defaultValue: new Date(),
  },
};

export const CustomLauncherIcon: Story = {
  name: 'Launcher — custom glyph',
  args: {
    label: 'Custom launcher glyph',
    triggerIconName: 'calendar-check',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The right-side launcher opens the popover on click. Override its glyph with `triggerIconName`.',
      },
    },
  },
};

export const WithoutLauncher: Story = {
  name: 'Launcher — hidden',
  args: {
    label: 'No launcher (click the field to open)',
    triggerIcon: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Set `triggerIcon={false}` to hide the launcher; the popover still opens on focus / click.',
      },
    },
  },
};

export const WithIcon: Story = {
  name: 'Left icon (custom glyph / hide)',
  render: () => (
    <Block display="flex" flexDirection="column" gap="4">
      <DateTimeInput label="Default left icon + right launcher" />
      <DateTimeInput label="Custom left glyph" iconLeftName="calendar-day" />
      <DateTimeInput label="Left icon hidden" iconLeftName="" />
    </Block>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The decorative left icon shows by default; override its glyph with `iconLeftName`, or hide it with `iconLeftName=""`. It is independent of the right launcher.',
      },
    },
  },
};

export const ManualEntry: Story = {
  args: {
    label: 'Type the date-time across all segments',
    defaultValue: new Date(2024, 5, 7, 13, 45),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A single field spanning year → month → day → hours → minutes. Focus highlights the year; →/← walk the segments, ↑/↓ adjust, digits overwrite with auto-advance, and typing a `-`, space, or `:` jumps to the next segment. `openOnFocus={false}` keeps the popover out of the way while typing.',
      },
    },
  },
};

export const ManualEntry12h: Story = {
  args: {
    label: '12-hour with an AM/PM segment',
    hourFormat: '12',
    defaultValue: new Date(2024, 5, 7, 13, 45),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'In 12-hour mode the format gains a trailing meridiem segment. Move to it and press `a` / `p` to toggle AM/PM.',
      },
    },
  },
};

export const ManualEntryControlled: Story = {
  render: function Render() {
    const [value, setValue] = useState<Date | null>(
      new Date(2024, 5, 7, 13, 45)
    );
    return (
      <Block>
        <DateTimeInput
          label="Arrow or type — value updates live"
          value={value}
          onChange={setValue}
          openOnFocus={false}
        />
        <Paragraph>Selected: {value ? value.toString() : '—'}</Paragraph>
      </Block>
    );
  },
};

export const ManualEntryCustomFormat: Story = {
  args: {
    label: 'DD.MM.YYYY HH:mm with dot separators',
    format: 'DD.MM.YYYY HH:mm',
    defaultValue: new Date(2024, 5, 7, 13, 45),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Segments follow the format order — day first here. Typing `.`, space, or `:` jumps to the next segment, so `25.12.2026 09:30` flows straight through.',
      },
    },
  },
};

export const ManualEntryWithSeconds: Story = {
  args: {
    label: 'With a seconds segment',
    enableSeconds: true,
    defaultValue: new Date(2024, 5, 7, 13, 45, 30),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `enableSeconds` the walk gains a seconds segment: year → month → day → hours → minutes → seconds.',
      },
    },
  },
};

export const ManualEntry12hWithSeconds: Story = {
  args: {
    label: '12-hour with seconds and AM/PM',
    hourFormat: '12',
    enableSeconds: true,
    defaultValue: new Date(2024, 5, 7, 13, 45, 30),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The full segment set — date, hh, mm, ss, and a trailing meridiem. Move to the AM/PM segment and press `a` / `p` to toggle it.',
      },
    },
  },
};

export const ManualEntryFreeForm: Story = {
  args: {
    label: 'Free-form (Intl format)',
    format: { dateStyle: 'medium', timeStyle: 'short' },
    defaultValue: new Date(2024, 5, 7, 13, 45),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'An `Intl.DateTimeFormatOptions` format has no segment map, so entry is free-form — focusing does not highlight a segment and the text parses on Enter or blur instead.',
      },
    },
  },
};

export const ManualEntryMinMax: Story = {
  render: function Render() {
    const now = new Date();
    const min = new Date(now);
    min.setHours(9, 0, 0, 0);
    const max = new Date(now);
    max.setHours(17, 0, 0, 0);
    const noon = new Date(now);
    noon.setHours(12, 0, 0, 0);
    return (
      <DateTimeInput
        label="Office hours today only — typed entry too"
        min={min}
        max={max}
        defaultValue={noon}
        openOnFocus={false}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Typed values outside the `min`/`max` range are rejected — keystrokes and ↑/↓ arrows never produce a value before 09:00 or after 17:00 today.',
      },
    },
  },
};

export const ManualEntryDisabledDates: Story = {
  args: {
    label: 'Weekends rejected while typing',
    shouldDisableDate: (d: Date) => d.getDay() === 0 || d.getDay() === 6,
    defaultValue: new Date(2024, 5, 7, 13, 45),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Blocked days can't be typed in either — a keystroke or arrow that lands on a weekend is rejected, matching the disabled cells in the calendar.",
      },
    },
  },
};

export const ManualEntryUnselectableTimes: Story = {
  args: {
    label: 'Lunch hour rejected while typing',
    unselectableTimes: (d: Date) => d.getHours() === 12,
    defaultValue: new Date(2024, 5, 7, 11, 30),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Blocked times are rejected when typed — setting the hour segment to 12 is vetoed by the `unselectableTimes` predicate, just as the wheels skip it.',
      },
    },
  },
};

export const PickerOnly: Story = {
  args: {
    label: 'Picker only (no typing)',
    editable: false,
    defaultValue: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `editable={false}` typing is inert, but the calendar + time popover still opens on click or focus.',
      },
    },
  },
};

export const InputOnly: Story = {
  args: {
    label: 'Input only (no popover)',
    popover: false,
    defaultValue: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `popover={false}` there is no calendar or time panel — the field accepts segmented keyboard entry only.',
      },
    },
  },
};
