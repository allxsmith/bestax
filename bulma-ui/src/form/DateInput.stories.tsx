import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { DateInput } from './DateInput';
import { DateInputBase } from './DateInputBase';
import { Field } from './Field';
import { Control } from './Control';
import { Block } from '../elements/Block';
import { Paragraph } from '../elements/Paragraph';

const meta: Meta<typeof DateInput> = {
  title: 'Form/DateInput',
  component: DateInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A date picker with a popover calendar and segmented keyboard entry, native HTML date input fallback on touch devices, full keyboard navigation, and locale-aware day/month names via `Intl`.',
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
    inline: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    editable: { control: 'boolean' },
    popover: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isRounded: { control: 'boolean' },
    openOnFocus: { control: 'boolean' },
    closeOnSelect: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof DateInput>;

export const Default: Story = {
  args: {
    label: 'Pick a date',
    placeholder: 'YYYY-MM-DD',
  },
};

export const Controlled: Story = {
  render: function Render() {
    const [value, setValue] = useState<Date | null>(new Date());
    return (
      <Block>
        <DateInput label="Controlled date" value={value} onChange={setValue} />
        <Paragraph>Selected: {value ? value.toDateString() : '—'}</Paragraph>
      </Block>
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <Block>
      <DateInput label="Small" controlSize="small" size="small" />
      <DateInput label="Default" />
      <DateInput label="Medium" controlSize="medium" size="medium" />
      <DateInput label="Large" controlSize="large" size="large" />
    </Block>
  ),
};

export const Colors: Story = {
  render: () => (
    <Block>
      <DateInput label="Primary" color="primary" />
      <DateInput label="Info" color="info" />
      <DateInput label="Success" color="success" />
      <DateInput label="Warning" color="warning" />
      <DateInput label="Danger" color="danger" />
    </Block>
  ),
};

export const States: Story = {
  render: () => (
    <Block>
      <DateInput label="Disabled" disabled />
      <DateInput label="Read only" readOnly defaultValue={new Date()} />
      <DateInput label="Loading" isLoading />
    </Block>
  ),
};

export const Inline: Story = {
  args: {
    label: 'Inline calendar',
    inline: true,
    defaultValue: new Date(),
  },
};

export const MinMax: Story = {
  render: function Render() {
    const today = new Date();
    const min = new Date(today.getFullYear(), today.getMonth(), 1);
    const max = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return (
      <DateInput
        label={`Limited to ${min.toDateString()} – ${max.toDateString()}`}
        min={min}
        max={max}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '_iOS native picker UI does not enforce `min`/`max` — the user can pick any date. The constraint still fires at form-submission validation, and Android Chrome honors it in the picker UI. Pass `mobileNative={false}` for iOS-side enforcement. ([WebKit bug #225639](https://bugs.webkit.org/show_bug.cgi?id=225639), still open as of 2026.)_',
      },
    },
  },
};

export const DisabledDates: Story = {
  args: {
    label: 'Weekends are disabled',
    shouldDisableDate: (d: Date) => {
      const day = d.getDay();
      return day === 0 || day === 6;
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "_HTML has no equivalent to `shouldDisableDate` or `unselectableDates`, so neither iOS Safari nor Android Chrome's native calendar will block any dates. Pass `mobileNative={false}` for native enforcement, or validate in `onChange`._",
      },
    },
  },
};

export const FirstDayOfWeek: Story = {
  args: {
    label: 'Week starts on Monday',
    firstDayOfWeek: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          "_Both iOS Safari and Android Chrome's native calendars use the device's system locale to determine the week start; `firstDayOfWeek` (and `dayNames`/`monthNames`/`nearbyMonthDays`) are ignored on either platform. Pass `mobileNative={false}` for per-input control._",
      },
    },
  },
};

export const Locale: Story = {
  render: () => (
    <Block>
      <DateInput label="ja-JP" locale="ja-JP" defaultValue={new Date()} />
      <DateInput label="fr-FR" locale="fr-FR" defaultValue={new Date()} />
      <DateInput label="de-DE" locale="de-DE" defaultValue={new Date()} />
    </Block>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "_Both iOS Safari and Android Chrome's native calendars always use the device's system locale; the `locale` prop has no effect. Pass `mobileNative={false}` for per-input locale control._",
      },
    },
  },
};

export const CustomFormat: Story = {
  args: {
    label: 'DD/MM/YYYY',
    format: 'DD/MM/YYYY',
    placeholder: 'DD/MM/YYYY',
  },
  parameters: {
    docs: {
      description: {
        story:
          "_Both iOS Safari and Android Chrome's native pickers use the device's system locale format and neither renders `placeholder` text on date inputs. Pass `mobileNative={false}` to control display per-input._",
      },
    },
  },
};

export const Formats: Story = {
  name: 'Formats (compare)',
  render: () => {
    const d = new Date(2026, 4, 30);
    return (
      <Block display="flex" flexDirection="column" gap="4">
        <DateInput
          label="YYYY-MM-DD (default)"
          defaultValue={d}
          openOnFocus={false}
        />
        <DateInput
          label="DD/MM/YYYY"
          format="DD/MM/YYYY"
          defaultValue={d}
          openOnFocus={false}
        />
        <DateInput
          label="MM-DD-YYYY"
          format="MM-DD-YYYY"
          defaultValue={d}
          openOnFocus={false}
        />
        <DateInput
          label="DD.MM.YY"
          format="DD.MM.YY"
          defaultValue={d}
          openOnFocus={false}
        />
        <DateInput
          label="Intl long — display only"
          format={{ year: 'numeric', month: 'long', day: 'numeric' }}
          defaultValue={d}
          editable={false}
          openOnFocus={false}
        />
      </Block>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The same date rendered through several `format` strings, plus an `Intl.DateTimeFormatOptions` object. Padded token formats (`YYYY`/`MM`/`DD`) support segmented typing; `Intl` formats are display-only unless you supply a custom `parse`.',
      },
    },
  },
};

export const CustomParse: Story = {
  name: 'Custom parse (Intl format)',
  render: () => {
    const fmt = { year: 'numeric', month: 'long', day: 'numeric' } as const;
    const parse = (s: string): Date | null => {
      const t = Date.parse(s);
      return Number.isNaN(t) ? null : new Date(t);
    };
    return (
      <DateInput
        label="Intl long + custom parse"
        format={fmt}
        parse={parse}
        defaultValue={new Date(2026, 4, 30)}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Token formats parse automatically. For an `Intl.DateTimeFormatOptions` format, pass a `parse` callback so typed text still round-trips to a `Date`.',
      },
    },
  },
};

export const MobileNative: Story = {
  args: {
    label: 'Native mobile picker',
    mobileNative: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Native picker support varies — iOS lags Android.** The OS-native fallback inherits each platform\'s `<input type="date">` behavior. The custom calendar popover (`mobileNative={false}`) honors every prop on every device.\n\n**Honored on Android Chrome but NOT on iOS Safari:** `min`/`max` (Android dims out-of-range dates; iOS lets the user pick anything — only validates on submit, [WebKit bug #225639](https://bugs.webkit.org/show_bug.cgi?id=225639) still open).\n\n**Ignored on BOTH iOS and Android (HTML-spec gaps):** `shouldDisableDate`/`unselectableDates` (no predicate or array equivalent), `firstDayOfWeek`/`dayNames`/`monthNames`/`nearbyMonthDays` (both use device locale), `format`/`locale`/`parse` (both use device locale), `placeholder` (neither renders it).\n\nFor anything in either group, pass `mobileNative={false}` to use the custom calendar popover, or validate in `onChange` / server-side.',
      },
    },
  },
};

export const HorizontalField: Story = {
  args: {
    label: 'Date of birth',
    horizontal: true,
    placeholder: 'YYYY-MM-DD',
  },
};

export const CustomLauncherIcon: Story = {
  name: 'Launcher — custom glyph',
  args: {
    label: 'Custom launcher glyph',
    triggerIconName: 'calendar-day',
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
      <DateInput label="Default left icon + right launcher" />
      <DateInput label="Custom left glyph" iconLeftName="calendar-alt" />
      <DateInput label="Left icon hidden" iconLeftName="" />
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
    label: 'Type the date — year / month / day segments',
    defaultValue: new Date(2024, 5, 7),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click into the field and the **year** segment highlights. Use ↑/↓ to change it, →/← to move between year, month, and day, or just type digits — the caret auto-advances across the `-` separators (which you can also type to jump). Segment mode activates whenever `format` is a token string with padded tokens (`YYYY`, `MM`, `DD`); `Intl` formats and single-char tokens fall back to free-form text. `openOnFocus={false}` here so the popover does not cover the field.',
      },
    },
  },
};

export const ManualEntryCustomFormat: Story = {
  args: {
    label: 'DD/MM/YYYY with slash separators',
    format: 'DD/MM/YYYY',
    defaultValue: new Date(2024, 5, 7),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Day-first order with `/` separators. Type `25/12/2026` straight through — typing `/` jumps to the next segment, and the day auto-advances after a digit ≥ 4 while the month waits for a possible second digit.',
      },
    },
  },
};

export const ManualEntryControlled: Story = {
  render: function Render() {
    const [value, setValue] = useState<Date | null>(new Date(2024, 5, 7));
    return (
      <Block>
        <DateInput
          label="Arrow or type — value updates live"
          value={value}
          onChange={setValue}
          openOnFocus={false}
        />
        <Paragraph>Selected: {value ? value.toDateString() : '—'}</Paragraph>
      </Block>
    );
  },
};

export const ManualEntryFreeForm: Story = {
  args: {
    label: 'Free-form (Intl format)',
    format: { year: 'numeric', month: 'long', day: 'numeric' },
    defaultValue: new Date(2024, 5, 7),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `format` is an `Intl.DateTimeFormatOptions` object (or uses single-char tokens like `D`/`M`), segment mode disables — focusing does not highlight a segment and the input parses on blur instead.',
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
          'With `editable={false}` the field is not typeable — segment keys and digits are inert — but the calendar popover still opens on click or focus.',
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
          'With `popover={false}` there is no calendar — the field accepts segmented keyboard entry only. Useful in dense forms where a popover would be overkill.',
      },
    },
  },
};

export const Composed: Story = {
  render: () => (
    <Field label="Manually composed">
      <Control iconLeftName="calendar">
        <DateInputBase placeholder="YYYY-MM-DD" />
      </Control>
    </Field>
  ),
};

export const InForm: Story = {
  render: function Render() {
    const [submitted, setSubmitted] = useState<string | null>(null);
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setSubmitted(String(fd.get('booking') ?? ''));
        }}
      >
        <DateInput
          label="Booking date"
          name="booking"
          required
          defaultValue={new Date()}
        />
        <Block>
          <button type="submit" className="button is-primary">
            Submit
          </button>
        </Block>
        {submitted !== null && (
          <Paragraph>Submitted booking={submitted}</Paragraph>
        )}
      </form>
    );
  },
};
