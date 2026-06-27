# Reference: form patterns

## A complete multi-field form (controlled + manual validation)

No form library — state is plain React, validation is a function, errors surface through
`color` + `message` + `messageColor`.

```tsx
import { useState } from 'react';
import {
  Input,
  Select,
  TextArea,
  Checkbox,
  Button,
  Field,
} from '@allxsmith/bestax-bulma';

interface Values {
  name: string;
  email: string;
  country: string;
  bio: string;
  agree: boolean;
}

function validate(v: Values) {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (!v.name.trim()) errors.name = 'Name is required.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email))
    errors.email = 'Enter a valid email.';
  if (!v.country) errors.country = 'Pick a country.';
  if (!v.agree) errors.agree = 'You must accept the terms.';
  return errors;
}

export function ProfileForm() {
  const [values, setValues] = useState<Values>({
    name: '',
    email: '',
    country: '',
    bio: '',
    agree: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(values);
  const show = (k: keyof Values) => (submitted ? errors[k] : undefined);
  const set = (k: keyof Values, val: Values[keyof Values]) =>
    setValues(prev => ({ ...prev, [k]: val }));

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        setSubmitted(true);
        if (Object.keys(errors).length === 0) {
          // submit values…
        }
      }}
    >
      <Input
        label="Name"
        value={values.name}
        onChange={e => set('name', e.target.value)}
        color={show('name') ? 'danger' : undefined}
        message={show('name')}
        messageColor="danger"
      />

      <Input
        label="Email"
        type="email"
        value={values.email}
        onChange={e => set('email', e.target.value)}
        color={show('email') ? 'danger' : undefined}
        message={show('email')}
        messageColor="danger"
        iconLeftName="envelope"
      />

      <Select
        label="Country"
        value={values.country}
        onChange={e => set('country', e.target.value)}
        color={show('country') ? 'danger' : undefined}
        message={show('country')}
        messageColor="danger"
      >
        <option value="">Select…</option>
        <option value="us">United States</option>
        <option value="ca">Canada</option>
      </Select>

      <TextArea
        label="Bio"
        value={values.bio}
        onChange={e => set('bio', e.target.value)}
        rows={3}
      />

      <Field>
        <Checkbox
          checked={values.agree}
          onChange={e => set('agree', e.target.checked)}
        >
          {' '}
          I accept the terms
        </Checkbox>
        {show('agree') && <p className="help is-danger">{show('agree')}</p>}
      </Field>

      <Button color="primary" type="submit" mt="4">
        Save
      </Button>
    </form>
  );
}
```

Notes:

- Validation runs every render as a pure function; `submitted` gates when errors are shown so the
  form isn't red before the user interacts. You could gate per-field on blur instead.
- For the checkbox the convenience `message` prop isn't used; the help text is rendered manually
  inside the `Field` — a good illustration of dropping to composition when needed.

## Grouped controls and addons

```tsx
// Search box: input + button attached.
<Field hasAddons>
  <Control isExpanded>
    <InputBase placeholder="Search" />
  </Control>
  <Control>
    <Button color="primary">Search</Button>
  </Control>
</Field>

// Two controls on one row.
<Field grouped>
  <Control>
    <InputBase placeholder="First" />
  </Control>
  <Control>
    <InputBase placeholder="Last" />
  </Control>
</Field>
```

## Horizontal field with explicit label/body

```tsx
<Field horizontal>
  <Field.Label size="normal">Email</Field.Label>
  <Field.Body>
    <Control iconLeftName="envelope" hasIconsLeft>
      <InputBase type="email" placeholder="you@example.com" />
    </Control>
  </Field.Body>
</Field>
```

## Advanced inputs

These are controlled the same way — own the value, pass `value`/`onChange`.

```tsx
// Autocomplete — onInput fires on typing, onSelect when a suggestion is chosen.
const [city, setCity] = useState('');
<Autocomplete
  value={city}
  onInput={setCity}
  onSelect={item =>
    setCity(typeof item === 'string' ? item : (item?.value ?? ''))
  }
  data={['Austin', 'Boston', 'Chicago']}
  openOnFocus
/>;

// Slider (single and dual thumb)
const [volume, setVolume] = useState(50);
<Slider value={volume} onChange={setVolume} min={0} max={100} tooltip="auto" />;

const [range, setRange] = useState<[number, number]>([20, 80]);
<Slider value={range} onChange={setRange} min={0} max={100} />;

// Numberinput
const [qty, setQty] = useState(1);
<Numberinput value={qty} onChange={setQty} min={1} max={10} step={1} />;

// Rate
const [stars, setStars] = useState(3);
<Rate value={stars} onChange={setStars} max={5} />;

// Taginput
const [tags, setTags] = useState<string[]>(['react']);
<Taginput value={tags} onChange={setTags} data={['react', 'bulma', 'ts']} />;
```

Each renders inside Bulma's field/control structure already, so wrap them in a `Field` only when
you need a label or grouped layout. Reflect validation on them with the same `color` /
`message` / `messageColor` approach used for text inputs.
