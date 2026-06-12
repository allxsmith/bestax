import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { TimeInput } from './TimeInput';
import { Block } from '../elements/Block';
import { Paragraph } from '../elements/Paragraph';

const meta: Meta<typeof TimeInput> = {
  title: 'Form/TimeInput',
  component: TimeInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A time picker rendered as an HH:MM(:SS) spinner inside a popover. Supports 12h/24h format, optional seconds, increments, min/max bounds, unselectable predicate, and a native `<input type="time">` fallback for touch devices.',
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
    incrementMinutes: { control: 'number' },
    inline: { control: 'boolean' },
    disabled: { control: 'boolean' },
    editable: { control: 'boolean' },
    popover: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof TimeInput>;

const today = (h: number, m: number, s = 0) => {
  const d = new Date();
  d.setHours(h, m, s, 0);
  return d;
};

export const Default: Story = {
  args: { label: 'Time', placeholder: 'HH:MM' },
};

export const Controlled: Story = {
  render: function Render() {
    const [value, setValue] = useState<Date | null>(today(13, 45));
    return (
      <Block>
        <TimeInput label="Departure" value={value} onChange={setValue} />
        <Paragraph>
          Selected: {value ? value.toLocaleTimeString() : '—'}
        </Paragraph>
      </Block>
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <Block>
      <TimeInput label="Small" controlSize="small" size="small" />
      <TimeInput label="Default" />
      <TimeInput label="Medium" controlSize="medium" size="medium" />
      <TimeInput label="Large" controlSize="large" size="large" />
    </Block>
  ),
};

export const Format12h: Story = {
  args: {
    label: '12-hour format',
    hourFormat: '12',
    defaultValue: today(13, 45),
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
    defaultValue: today(10, 20, 30),
  },
  parameters: {
    docs: {
      description: {
        story:
          "**iOS Safari has no seconds wheel — Android Chrome does.** Android Chrome renders a seconds spinner in its native time picker when `step < 60` (which our component sets when `enableSeconds` is true). iOS Safari has no seconds wheel under any circumstances — Apple's picker UI is hard-locked to hour/minute spinners regardless of `step`. If you need a seconds wheel on iOS, pass `mobileNative={false}` to force the custom wheel popover.",
      },
    },
  },
};

export const IncrementSteps: Story = {
  args: {
    label: 'Minute step = 5',
    incrementMinutes: 5,
    defaultValue: today(9, 30),
  },
  parameters: {
    docs: {
      description: {
        story:
          '_iOS native picker shows every minute regardless of `step` — `incrementMinutes`/`incrementHours`/`incrementSeconds` do not constrain the wheels. The custom popover and Android Chrome both honor it. Pass `mobileNative={false}` if step enforcement matters on iOS._',
      },
    },
  },
};

export const MinMax: Story = {
  args: {
    label: 'Office hours: 09:00 — 17:00',
    min: today(9, 0),
    max: today(17, 0),
    defaultValue: today(12, 0),
  },
  parameters: {
    docs: {
      description: {
        story:
          '_iOS native picker UI does not enforce `min`/`max` — the user can spin to any time. The constraint still fires at form-submission validation, and Android Chrome honors it in the picker UI. Pass `mobileNative={false}` for iOS-side enforcement. ([WebKit bug #225639](https://bugs.webkit.org/show_bug.cgi?id=225639), still open as of 2026.)_',
      },
    },
  },
};

export const UnselectableTimes: Story = {
  args: {
    label: 'Lunch hour blocked (12:00 — 12:59)',
    unselectableTimes: (d: Date) => d.getHours() === 12,
    defaultValue: today(11, 30),
  },
  parameters: {
    docs: {
      description: {
        story:
          "_HTML has no equivalent to `unselectableTimes`, so neither iOS Safari nor Android Chrome's native picker will block any times. Pass `mobileNative={false}` for native enforcement, or validate in `onChange`._",
      },
    },
  },
};

export const Inline: Story = {
  args: { label: 'Inline spinner', inline: true, defaultValue: today(8, 30) },
};

export const AudioTick: Story = {
  args: {
    label: 'Audio thunk + band pulse',
    audioTick: true,
    mobileNative: false,
    defaultValue: today(9, 30),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Three layers of "haptic feel" feedback on each wheel-item crossing:\n\n1. **Real haptic** via `navigator.vibrate(5)` — Android Chrome / Firefox Android / Samsung Internet only. iOS Safari does not expose `navigator.vibrate` and Apple patched the `<input type="checkbox" switch>` workaround in iOS 26.5; there is no longer any web-only path to the Taptic Engine.\n2. **Audio thunk** (opt-in via `audioTick`, shown here) — a 160 Hz triangle-wave tone sweeping down to 110 Hz over ~30 ms. The low fundamental and downward pitch sweep are tuned to read as a body-felt thump rather than a beep, matching the proprioceptive signature of native Taptic UI pops.\n3. **Visual band pulse** (always-on, no prop) — the selection band briefly scales (1 → 1.04 → 1) and brightens (×1.15) over 110 ms via the Web Animations API. Respects `prefers-reduced-motion: reduce`.\n\nThe iPhone silent switch (and Android system volume) suppress the tick audio — matching native UX expectations. The first wheel touch unlocks the AudioContext (Web Audio\'s gesture requirement).',
      },
    },
  },
};

export const ManualEntry: Story = {
  args: {
    label: 'Manual segmented entry',
    defaultValue: today(13, 45),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Segmented keyboard entry on the input — focus the field (Tab or click) and the **hours** segment highlights automatically. From there:\n\n- **Up/Down** increment / decrement the active segment (wraps at boundaries).\n- **Left/Right** move between hour, minute, second, AM/PM segments.\n- **Digit keys** overwrite the active segment and auto-advance when no further digit could form a valid value (typing `5` for 24-hour hours advances immediately; typing `2` waits since `20`–`23` are still valid).\n- **a / A / p / P** toggle the AM/PM segment in 12-hour mode.\n- **Backspace** clears the typed-digit buffer; if already empty, moves to the previous segment.\n- **Tab** clears segment selection so focus moves out naturally.\n\nSegment mode activates only when `format` is a token string with padded tokens (`HH`, `hh`, `mm`, `ss`, `A`, `a`). `Intl.DateTimeFormatOptions` formats fall back to free-form text entry. This story sets `openOnFocus={false}` so the popover doesn't cover the input — leave it at its default `true` and both UIs coexist.",
      },
    },
  },
};

export const ManualEntry12h: Story = {
  args: {
    label: 'Segmented entry · 12-hour',
    hourFormat: '12',
    defaultValue: today(13, 45),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `hourFormat="12"` the editable segments are hours / minutes / AM-PM. Move to the meridiem with `→` (or click it) and press `a` or `p` to set AM / PM — the segment auto-advances afterward.',
      },
    },
  },
};

export const ManualEntryWithSeconds: Story = {
  args: {
    label: 'Segmented entry · with seconds',
    enableSeconds: true,
    defaultValue: today(10, 20, 30),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `enableSeconds`, there are three editable segments. `→` cycles through hours → minutes → seconds (and AM/PM if the format includes it).',
      },
    },
  },
};

export const ManualEntryControlled: Story = {
  render: function Render() {
    const [value, setValue] = useState<Date | null>(today(13, 45));
    return (
      <Block>
        <TimeInput
          label="Arrow or type — value updates live"
          value={value}
          onChange={setValue}
          openOnFocus={false}
        />
        <Paragraph>
          Selected: {value ? value.toLocaleTimeString() : '—'}
        </Paragraph>
      </Block>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The value updates on every increment, digit, or AM/PM toggle — same `onChange` pipeline as the wheel popover. Bind to `useState` to observe it; here the displayed `Paragraph` re-renders on each segment edit.',
      },
    },
  },
};

export const ManualEntryFreeForm: Story = {
  args: {
    label: 'Free-form (Intl format)',
    format: { hour: '2-digit', minute: '2-digit' },
    defaultValue: today(13, 45),
    openOnFocus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `format` is an `Intl.DateTimeFormatOptions` object (or uses unpadded tokens like `H:m`), segment mode silently disables. Focusing the input does not highlight a segment, arrow keys fall through to default behavior, and the input parses on blur instead — the pre-segmented free-form behavior.',
      },
    },
  },
};

export const Haptics: Story = {
  args: {
    label: 'Auto-routed haptics',
    haptics: true,
    mobileNative: false,
    defaultValue: today(9, 30),
  },
  parameters: {
    docs: {
      description: {
        story:
          '`haptics={true}` is a single switch that picks the right feedback per platform — no UA sniffing or platform detection needed on the consumer side:\n\n- **On Android** (where `navigator.vibrate` is implemented), the existing unconditional vibrate fires and **no audio is added** — Android users get real haptics without being subjected to extra sound.\n- **On iOS** (where `navigator.vibrate` is absent), the audio thunk is enabled automatically — same as `audioTick={true}`, since that\'s the closest pure-web substitute.\n- **The visual band pulse fires on every platform**, gated only by `prefers-reduced-motion`.\n\nIf you set `audioTick={true}` explicitly, the audio fires regardless of detection (manual opt-in wins). Detection is functional (`typeof navigator.vibrate === "function"`) rather than UA-based, so it correctly handles edge cases like desktop browsers with vibrate APIs and Android tablets without haptic motors.',
      },
    },
  },
};

export const MobileNative: Story = {
  args: { label: 'Native time picker', mobileNative: true },
  parameters: {
    docs: {
      description: {
        story:
          '**Native picker support varies — iOS lags Android.** The OS-native fallback inherits each platform\'s `<input type="time">` behavior. The custom wheel popover (`mobileNative={false}`) honors every prop on every device.\n\n**Honored on Android Chrome but NOT on iOS Safari:** `min`/`max` (Android dims out-of-range values; iOS lets the user spin to anything — only validates on submit, [WebKit bug #225639](https://bugs.webkit.org/show_bug.cgi?id=225639) still open), `incrementMinutes`/`incrementHours`/`incrementSeconds` (Android respects `step`; iOS ignores it), `enableSeconds` (Android shows a seconds spinner when `step < 60`; iOS has no seconds wheel under any circumstances).\n\n**Ignored on BOTH iOS and Android (HTML-spec gaps):** `unselectableTimes` (no predicate equivalent), `hourFormat` (both use device clock setting), `format`/`locale` (both use device locale), `placeholder` (neither renders it).\n\nFor anything in either group, pass `mobileNative={false}` to use the custom wheel popover, or validate in `onChange` / server-side.',
      },
    },
  },
};

export const ForceCustomWheel: Story = {
  args: { label: 'Always custom wheel', mobileNative: false },
  parameters: {
    docs: {
      description: {
        story:
          'Forces the custom wheel popover even on touch devices with small viewports, where `mobileNative=\'auto\'` would otherwise swap to a native `<input type="time">`.',
      },
    },
  },
};

export const Format24h: Story = {
  args: {
    label: '24-hour format',
    hourFormat: '24',
    defaultValue: today(13, 45),
  },
};

export const Formats: Story = {
  name: 'Formats (compare)',
  render: () => {
    const v = today(13, 45, 30);
    return (
      <Block display="flex" flexDirection="column" gap="4">
        <TimeInput label="HH:mm (24h, default)" defaultValue={v} />
        <TimeInput label="hh:mm A (12h)" format="hh:mm A" defaultValue={v} />
        <TimeInput
          label="hh:mm a (lowercase)"
          format="hh:mm a"
          defaultValue={v}
        />
        <TimeInput
          label="HH:mm:ss (with seconds)"
          format="HH:mm:ss"
          defaultValue={v}
        />
        <TimeInput label="hh:mm:ss A" format="hh:mm:ss A" defaultValue={v} />
      </Block>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The same time rendered through several token `format` strings. All padded formats support segmented typing; the meridiem (`A`/`a`) and seconds (`ss`) segments appear when the format includes them.',
      },
    },
  },
};

export const Locale: Story = {
  render: () => (
    <Block display="flex" flexDirection="column" gap="4">
      <TimeInput
        label="en-US (hh:mm A)"
        format="hh:mm A"
        locale="en-US"
        defaultValue={today(13, 45)}
      />
      <TimeInput
        label="Intl, fr-FR"
        format={{ hour: '2-digit', minute: '2-digit' }}
        locale="fr-FR"
        editable={false}
        defaultValue={today(13, 45)}
      />
    </Block>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Token formats render the same regardless of `locale`; pass an `Intl.DateTimeFormatOptions` format to get locale-aware output. _Native mobile pickers always use the device locale._',
      },
    },
  },
};

export const Colors: Story = {
  render: () => (
    <Block>
      <TimeInput label="Primary" color="primary" />
      <TimeInput label="Info" color="info" />
      <TimeInput label="Success" color="success" />
      <TimeInput label="Warning" color="warning" />
      <TimeInput label="Danger" color="danger" />
    </Block>
  ),
};

export const States: Story = {
  render: () => (
    <Block>
      <TimeInput label="Disabled" disabled />
      <TimeInput label="Read only" readOnly defaultValue={today(13, 45)} />
      <TimeInput label="Loading" isLoading />
    </Block>
  ),
};

export const CustomLauncherIcon: Story = {
  name: 'Launcher — custom glyph',
  args: {
    label: 'Custom launcher glyph',
    triggerIconName: 'hourglass',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The right-side launcher opens the spinner on click. Override its glyph with `triggerIconName`.',
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
      <TimeInput label="Default left icon + right launcher" />
      <TimeInput label="Custom left glyph" iconLeftName="history" />
      <TimeInput label="Left icon hidden" iconLeftName="" />
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

export const PickerOnly: Story = {
  args: {
    label: 'Picker only (no typing)',
    editable: false,
    defaultValue: today(13, 45),
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `editable={false}` the field is not typeable — arrow keys and digits are inert — but the spinner popover still opens on click or focus.',
      },
    },
  },
};

export const InputOnly: Story = {
  args: {
    label: 'Input only (no popover)',
    popover: false,
    defaultValue: today(13, 45),
  },
  parameters: {
    docs: {
      description: {
        story:
          'With `popover={false}` there is no spinner — the field accepts segmented keyboard entry only.',
      },
    },
  },
};
