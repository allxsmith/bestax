---
slug: forms-without-a-form-library
title: Form Library Agnostic
description: 'Forms in bestax-bulma are plain React. Field and Control composition, auto-wrapping inputs, escape hatches, and validation your way, with useState or the validation library of your choice.'
authors: [asmith]
tags: [forms, react, bulma]
canonical_url: https://bestax.io/blog/forms-without-a-form-library
publish_to_devto: true
image: /img/forms-without-a-form-library.png
cover_image: /img/forms-without-a-form-library.png
---

![Form Library Agnostic, drawn as a pixel art RPG character creation screen: a name field with a blinking cursor, a class picker with the cursor on Mage, stat sliders for STR, DEX, and INT, and a green status row reading form libs loaded: 0, ready.](/img/forms-without-a-form-library.svg)

A form in bestax-bulma is plain React: state goes in, props come out, and nothing new sits in between. There's no bundled form library and none is coming; the library's job ends at rendering Bulma correctly, so your form state stays yours. By the end of this post you'll have a validated signup form built with nothing but `useState`, you'll see where the validation library of your choice plugs in, and you'll know where every escape hatch is.

<!-- truncate -->

This one's part of the [catch-up series](https://github.com/allxsmith/bestax/issues/384), but it's a design post, not a release recap. The components here shipped across v2 and the [v3 forms release](/blog/v3-forms-release); what follows is how they're meant to be used together.

## Field, Control, and Auto-Wrap

Bulma builds every form the same way: a `field` div handles layout and the label, a `control` div wraps exactly one input and owns its icons and loading spinner, and an optional `help` paragraph carries the message. Our [Field](/docs/api/form/field) and [Control](/docs/api/form/control) components render exactly that structure.

Writing three wrappers for every input gets old fast, so the convenience inputs handle it. [Input](/docs/api/form/input), [Select](/docs/api/form/select), and [TextArea](/docs/api/form/textarea) wrap themselves in a `Field` and `Control` automatically, which is what lets props like `label`, `iconLeftName`, and `message` exist on a single tag:

```tsx live
function AutoWrapDemo() {
  const [email, setEmail] = useState('');

  return (
    <Input
      label="Email"
      type="email"
      placeholder="you@example.com"
      value={email}
      onChange={e => setEmail(e.target.value)}
      iconLeftName="envelope"
      message="One tag, and you get the label, the icon, and this help text."
      id="autowrap-email"
      labelProps={{ htmlFor: 'autowrap-email' }}
    />
  );
}
```

To be precise about the mechanics: the wrapping isn't triggered by those props. A convenience input always wraps itself unless it detects it's already inside a `Field` or `Control`, and `label` and friends just forward into the generated wrapper. The field-level props are shared across inputs (`label`, `labelSize`, `labelProps`, `horizontal`, `message`, `messageColor`, and `fieldClassName`), with `messageColor` tinting the help text.

One accessibility note: `label` renders the `<label>` element but won't invent an `id` to point it at, so pass `id` on the input plus `labelProps={{ htmlFor: sameId }}`, the way the demos on this page do.

## Skip-If-Wrapped

Write the wrappers yourself and the inputs get out of the way. Here's the entire detection mechanism, from `FormContext.tsx`:

```tsx
const FieldContext = createContext(false);
const ControlContext = createContext(false);

export const useInsideField = () => useContext(FieldContext);
export const useInsideControl = () => useContext(ControlContext);
```

That's it. `Field` and `Control` each set their context to `true`, and an input checks both hooks before wrapping. Presence detection, not state: no values flow through this context, it only answers "am I already wrapped?" So composed layouts and convenience inputs mix freely. This is the same `Input` from the demo above, dropped into an addons layout:

```tsx live
function SearchDemo() {
  const [query, setQuery] = useState('');

  return (
    <Field hasAddons>
      <Control isExpanded>
        <Input
          placeholder="Search the docs"
          aria-label="Search the docs"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </Control>
      <Control>
        <Button color="primary">Search</Button>
      </Control>
    </Field>
  );
}
```

If `Input` had wrapped itself again, that button wouldn't sit attached to the field. And because `useInsideField` and `useInsideControl` are public exports rather than private internals, a custom input of your own can join the same protocol; the group components (`Radios`, `Checkboxes`) already ride on it.

## The Base Escape Hatch

Sometimes you want zero magic. Six components ship as raw versions with a `Base` suffix: `InputBase`, `SelectBase`, `TextAreaBase`, `DateInputBase`, `TimeInputBase`, and `DateTimeInputBase`. They render the bare Bulma element and never wrap themselves in anything:

```jsx
// Convenience: one tag, wrappers included
<Input label="Email" message="We only email for receipts." />

// Composed: you own every element
<Field label="Email" labelProps={{ htmlFor: 'composed-email' }}>
  <Control>
    <InputBase id="composed-email" type="email" />
  </Control>
  <p className="help">We only email for receipts.</p>
</Field>
```

Reach for composition when one field holds several controls, when you're building addons or grouped layouts, or when your markup needs to be exact for a snapshot test or a CSS framework migration. The [form guide](/docs/guides/library/form) shows both styles side by side.

## Validate It Yourself

Validation is the part the library deliberately leaves to you, and the pattern is short: own the value with `useState` (or `useReducer`, or whatever you prefer), compute the error yourself, and reflect it through the input's `color`, `message`, and `messageColor` props.

```tsx live
function SignupDemo() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const error =
    touched && !valid ? 'Please enter a valid email address.' : undefined;

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        setTouched(true);
        setSent(valid);
      }}
    >
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={e => {
          setEmail(e.target.value);
          setSent(false);
        }}
        onBlur={() => setTouched(true)}
        color={error ? 'danger' : undefined}
        message={error}
        messageColor={error ? 'danger' : undefined}
        iconLeftName="envelope"
        id="signup-email"
        labelProps={{ htmlFor: 'signup-email' }}
      />
      <Button color="primary" type="submit" mt="3">
        Sign up
      </Button>
      {sent && (
        <Notification color="success" isLight mt="4">
          Signed up. Your state, your rules, no library required.
        </Notification>
      )}
    </form>
  );
}
```

Type something that isn't an email and tab away: the border goes `danger` and the message appears, because the component reflects exactly the state you computed. One gotcha worth knowing: validation state belongs on the input, not the `Field`. `Field` has no `message` prop, and although its types accept a `color`, it renders no class for it, so setting it looks right and does nothing.

The demo's validation is one regex and one ternary. A form used to be an input and an if statement, and it turns out it still can be.

And if you'd rather keep using react-hook-form, or validate with zod or yup? Bring them. The pattern above isn't a lock-in, it's a socket: the text-style inputs are controlled components with a `value`, an `onChange`, and a string-friendly `message`, which is exactly the surface a validation library produces. Prop shapes vary at the edges (the boolean controls take `checked`, and `Autocomplete` speaks `value`, `onInput`, and `onSelect`), so wire into each component's documented props and everything here still applies. Here's the same field with its error coming from a zod schema instead of a regex:

```jsx
const schema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

function ZodSignup() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const result = schema.safeParse({ email });
  const error =
    touched && !result.success ? result.error.issues[0].message : undefined;

  return (
    <Input
      label="Email"
      type="email"
      value={email}
      onChange={e => setEmail(e.target.value)}
      onBlur={() => setTouched(true)}
      color={error ? 'danger' : undefined}
      message={error}
      messageColor={error ? 'danger' : undefined}
    />
  );
}
```

react-hook-form works the same way: hand its field state to `value` and `onChange`, or spread `register` onto the input, and pass `formState.errors.email?.message` to `message`. Same three props, whatever validation library you choose. bestax-bulma doesn't prescribe one, and it doesn't make you carry one either.

## The Full Input Set

None of this would matter if the inputs stopped at `<input type="text">`. The core set covers stock Bulma, and the extended set goes well past it:

| Component                                                                                                                                                                                | What you get                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [**Input**](/docs/api/form/input), [**TextArea**](/docs/api/form/textarea), [**Select**](/docs/api/form/select), [**File**](/docs/api/form/file)                                         | The core text, select, and file controls            |
| [**Checkbox**](/docs/api/form/checkbox) and [**Radio**](/docs/api/form/radio), plus [**Checkboxes**](/docs/api/form/checkboxes) and [**Radios**](/docs/api/form/radios) group containers | Boolean and single-choice controls, themed variants |
| [**Switch**](/docs/api/form/switch)                                                                                                                                                      | A checkbox styled as a toggle                       |
| [**Slider**](/docs/api/form/slider)                                                                                                                                                      | Range slider, single or dual thumb                  |
| [**Numberinput**](/docs/api/form/numberinput)                                                                                                                                            | Number input with stepper buttons                   |
| [**Rate**](/docs/api/form/rate)                                                                                                                                                          | Star ratings without hand-rolled stars              |
| [**Autocomplete**](/docs/api/form/autocomplete)                                                                                                                                          | Filterable suggestion input                         |
| [**Taginput**](/docs/api/form/taginput)                                                                                                                                                  | Multi-tag input with suggestions                    |
| [**DateInput**](/docs/api/form/datetime/dateinput), [**TimeInput**](/docs/api/form/datetime/timeinput), [**DateTimeInput**](/docs/api/form/datetime/datetimeinput)                       | Date and time pickers on native `Date` and `Intl`   |

The wrap behavior stays consistent across the table: most of the set generates a full `Field` and `Control`, the inputs that manage richer inner markup (`Autocomplete`, `Taginput`, `File`, and `Numberinput`) generate just the `Field`, and the small controls (`Checkbox`, `Radio`, `Switch`) plus every `Base` component never wrap at all. Every input that wraps itself also takes the `label` and `message` treatment from the top of this post, and state stays plain React throughout: a value in, a change handler out, whether that value is a string, a number, a tag list, or a `Date`.

The date and time pickers got their own deep dive in the [v3 forms release](/blog/v3-forms-release), so I won't rerun it here. The short version: popover calendar, wheel spinner, segmented keyboard entry, and zero date libraries in your bundle.

## Documentation

- [Form components guide](/docs/guides/library/form): descriptions and live examples for every input
- API references: [Field](/docs/api/form/field), [Control](/docs/api/form/control), and [Input](/docs/api/form/input) are the best starting points
- The [bestax-form skill](/docs/skills/form) teaches AI agents this exact composition and validation pattern
- The [blog revival tracker](https://github.com/allxsmith/bestax/issues/384) has the rest of the catch-up plan
