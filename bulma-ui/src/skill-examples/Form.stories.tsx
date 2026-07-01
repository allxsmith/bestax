// Skills → Examples → Form: several realistic forms produced by following the
// bestax-form skill. Together they exercise every form component group.
import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExampleMeta } from './ExampleMeta';
import {
  Box,
  Title,
  Input,
  Select,
  TextArea,
  Button,
  Field,
  Checkbox,
  Checkboxes,
  Radio,
  Radios,
  Switch,
  Autocomplete,
  Slider,
  Numberinput,
  Rate,
  Taginput,
  File,
  DateInput,
  TimeInput,
  DateTimeInput,
} from '../index';

const SKILL_HREF =
  'https://github.com/allxsmith/bestax/tree/main/skills/bestax-form/SKILL.md';

const meta: Meta = {
  title: 'Skills/Form',
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj;

function Meta_({ prompt }: { prompt: string }) {
  return (
    <ExampleMeta
      skill="bestax-form"
      skillHref={SKILL_HREF}
      model="Claude Opus 4.8"
      date="2026-06-27"
      prompt={prompt}
    />
  );
}

/* ----------------------------- Signup ----------------------------- */
export const Signup: Story = {
  name: 'Signup & validation',
  render: function SignupExample() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const errors = {
      name: !name.trim() ? 'Name is required.' : undefined,
      email: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
        ? 'Enter a valid email.'
        : undefined,
      country: !country ? 'Pick a country.' : undefined,
    };
    const show = (k: keyof typeof errors) =>
      submitted ? errors[k] : undefined;

    return (
      <Box>
        <Meta_ prompt="Build a signup form (name, email, country) that validates on submit and shows inline errors — no form library." />
        <Title size="5">Signup &amp; validation</Title>
        <form
          onSubmit={e => {
            e.preventDefault();
            setSubmitted(true);
          }}
          style={{ maxWidth: '28rem' }}
        >
          <Input
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            color={show('name') ? 'danger' : undefined}
            message={show('name')}
            messageColor="danger"
            iconLeftName="user"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            color={show('email') ? 'danger' : undefined}
            message={show('email')}
            messageColor="danger"
            iconLeftName="envelope"
          />
          <Select
            label="Country"
            value={country}
            onChange={e => setCountry(e.target.value)}
            color={show('country') ? 'danger' : undefined}
            message={show('country')}
            messageColor="danger"
          >
            <option value="">Select…</option>
            <option value="us">United States</option>
            <option value="ca">Canada</option>
            <option value="uk">United Kingdom</option>
          </Select>
          <Button color="primary" type="submit">
            Create account
          </Button>
        </form>
      </Box>
    );
  },
};

/* ------------------------ Account settings ------------------------ */
export const AccountSettings: Story = {
  name: 'Account settings',
  render: function AccountSettingsExample() {
    const [bio, setBio] = useState('');
    const [timezone, setTimezone] = useState('utc');
    const [digest, setDigest] = useState('weekly');
    const [interests, setInterests] = useState<string[]>(['react']);
    const [darkMode, setDarkMode] = useState(true);
    const [twoFactor, setTwoFactor] = useState(false);

    return (
      <Box>
        <Meta_ prompt="Build an account settings form with a bio, a timezone select, an email-digest radio group, interest checkboxes, and toggle switches." />
        <Title size="5">Account settings</Title>
        <form style={{ maxWidth: '32rem' }}>
          <TextArea
            label="Bio"
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            placeholder="Tell us about yourself"
          />
          <Select
            label="Timezone"
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
          >
            <option value="utc">UTC</option>
            <option value="est">Eastern</option>
            <option value="pst">Pacific</option>
          </Select>
          <Field label="Email digest">
            <Radios name="digest" value={digest} onChange={setDigest}>
              <Radio value="daily">Daily</Radio>
              <Radio value="weekly">Weekly</Radio>
              <Radio value="never">Never</Radio>
            </Radios>
          </Field>
          <Field label="Interests">
            <Checkboxes
              name="interests"
              value={interests}
              onChange={setInterests}
            >
              <Checkbox value="react">React</Checkbox>
              <Checkbox value="bulma">Bulma</Checkbox>
              <Checkbox value="design">Design</Checkbox>
            </Checkboxes>
          </Field>
          <Field>
            <Switch
              checked={darkMode}
              onChange={e => setDarkMode(e.target.checked)}
              color="primary"
            >
              Dark mode
            </Switch>
          </Field>
          <Field>
            <Switch
              checked={twoFactor}
              onChange={e => setTwoFactor(e.target.checked)}
              color="success"
            >
              Two-factor authentication
            </Switch>
          </Field>
          <Button color="primary">Save settings</Button>
        </form>
      </Box>
    );
  },
};

/* ------------------------- Advanced inputs ------------------------ */
export const AdvancedInputs: Story = {
  name: 'Advanced inputs',
  render: function AdvancedInputsExample() {
    const [skill, setSkill] = useState('');
    const [experience, setExperience] = useState(5);
    const [rateUsd, setRateUsd] = useState(75);
    const [quality, setQuality] = useState(4);
    const [tags, setTags] = useState<string[]>(['typescript']);

    return (
      <Box>
        <Meta_ prompt="Build a freelancer profile form using the advanced inputs: autocomplete, slider, number input, star rating, and tag input." />
        <Title size="5">Advanced inputs</Title>
        <div style={{ maxWidth: '32rem' }}>
          <Autocomplete
            label="Primary skill"
            value={skill}
            onInput={setSkill}
            onSelect={item =>
              setSkill(typeof item === 'string' ? item : (item?.value ?? ''))
            }
            data={['React', 'Vue', 'Svelte', 'Angular']}
            openOnFocus
          />
          <Slider
            label="Years of experience"
            value={experience}
            onChange={setExperience}
            min={0}
            max={20}
            tooltip="auto"
          />
          <Numberinput
            label="Hourly rate (USD)"
            value={rateUsd}
            onChange={setRateUsd}
            min={10}
            max={500}
            step={5}
          />
          <Rate
            label="Self-rated quality"
            value={quality}
            onChange={setQuality}
            max={5}
          />
          <Taginput
            label="Tech stack"
            value={tags}
            onChange={next =>
              setTags(next.map(t => (typeof t === 'string' ? t : t.value)))
            }
            data={['typescript', 'node', 'graphql', 'css']}
          />
        </div>
      </Box>
    );
  },
};

/* ------------------------ Files & scheduling ---------------------- */
export const FilesScheduling: Story = {
  name: 'Files & scheduling',
  render: function FilesSchedulingExample() {
    const [date, setDate] = useState<Date | null>(null);
    const [time, setTime] = useState<Date | null>(null);
    const [appt, setAppt] = useState<Date | null>(null);

    return (
      <Box>
        <Meta_ prompt="Build an onboarding form with a file upload plus date, time, and date-time pickers." />
        <Title size="5">Files &amp; scheduling</Title>
        <div style={{ maxWidth: '28rem' }}>
          <Field label="Profile photo">
            <File hasName buttonLabel="Choose a file…" />
          </Field>
          <DateInput label="Date of birth" value={date} onChange={setDate} />
          <TimeInput
            label="Preferred contact time"
            value={time}
            onChange={setTime}
          />
          <DateTimeInput label="Appointment" value={appt} onChange={setAppt} />
        </div>
      </Box>
    );
  },
};
