// "Skills" section for Storybook: an Overview (what the skills are + how to
// install/use them) and live Examples of each skill's output (prompt + model +
// generated result). Mirrors the docs site's /docs/skills section.
import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Ribbon } from './Ribbon';
import { ExampleMeta } from './ExampleMeta';
import {
  Box,
  Title,
  SubTitle,
  Input,
  Select,
  Button,
  Field,
  Buttons,
} from '../index';

const SKILLS_REPO = 'https://github.com/allxsmith/bestax/tree/main/skills';
const CUSTOM_SKILL_HREF = `${SKILLS_REPO}/bestax-custom-component/SKILL.md`;
const FORM_SKILL_HREF = `${SKILLS_REPO}/bestax-form/SKILL.md`;

const meta: Meta = {
  title: 'Skills/Overview',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Bestax Agent Skills

Drop-in [Agent Skills](https://skills.sh/) that teach coding agents (Claude Code, Cursor, and
other skills.sh-compatible tools) how to build with **@allxsmith/bestax-bulma** the right way.

## The skills

- **[bestax-custom-component](${CUSTOM_SKILL_HREF})** — build a new custom Bulma "extra" component
  the bestax way: \`forwardRef\` + helper hooks, the Bulma v1 SCSS register-vars/getVar pattern,
  stories, tests, docs, and wiring. *Use when adding a component beyond stock Bulma.*
- **[bestax-form](${FORM_SKILL_HREF})** — build forms with the bestax form components: Field/Control
  composition, the full input inventory, and the validate-it-yourself error pattern (there is no
  form library). *Use when building or wiring up a form.*

## Quick start

Install a skill into your agent with the [skills](https://skills.sh/) CLI:

\`\`\`sh
npx skills add https://github.com/allxsmith/bestax --skill bestax-custom-component
npx skills add https://github.com/allxsmith/bestax --skill bestax-form
\`\`\`

Once added, your agent loads the skill's \`SKILL.md\` automatically when the task matches (building a
component, wiring a form) and pulls in the deeper \`references/\` material on demand.

## See it in action

The **Skills → Examples** stories show each skill actually used — the prompt given to the agent,
the model that produced the result, and the live, generated output.
        `,
      },
    },
  },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

const COLORS = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
] as const;

/* ------------------------------------------------------------------ */
/* Example 1 — bestax-custom-component                                 */
/* ------------------------------------------------------------------ */
export const CustomComponentExample: Story = {
  name: 'Examples / Custom Component',
  render: () => (
    <Box>
      <ExampleMeta
        skill="bestax-custom-component"
        skillHref={CUSTOM_SKILL_HREF}
        model="Claude Opus 4.8"
        date="2026-06-27"
        prompt="Build a new custom Ribbon label component with the six Bulma colors and small/medium/large sizes, following the bestax custom-component skill."
      />

      <Title size="5">Result — the generated &lt;Ribbon /&gt; component</Title>
      <SubTitle size="6" textColor="grey">
        forwardRef + useBulmaClasses + usePrefixedClassNames, styled with the
        Bulma v1 register-vars / getVar SCSS pattern.
      </SubTitle>

      <p className="mb-2 has-text-weight-semibold">Colors</p>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        {COLORS.map(c => (
          <Ribbon key={c} color={c}>
            {c}
          </Ribbon>
        ))}
      </div>

      <p className="mt-5 mb-2 has-text-weight-semibold">Sizes</p>
      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Ribbon color="primary" size="small">
          small
        </Ribbon>
        <Ribbon color="primary">normal</Ribbon>
        <Ribbon color="primary" size="medium">
          medium
        </Ribbon>
        <Ribbon color="primary" size="large">
          large
        </Ribbon>
      </div>

      <p className="mt-5 mb-2 has-text-weight-semibold">
        Helper props work for free (m, p, text*, …)
      </p>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <Ribbon color="success" m="2">
          m=2
        </Ribbon>
        <Ribbon color="info" p="4">
          p=4
        </Ribbon>
      </div>
    </Box>
  ),
};

/* ------------------------------------------------------------------ */
/* Example 2 — bestax-form                                             */
/* ------------------------------------------------------------------ */
export const FormExample: Story = {
  name: 'Examples / Form',
  render: function FormExampleStory() {
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
        <ExampleMeta
          skill="bestax-form"
          skillHref={FORM_SKILL_HREF}
          model="Claude Opus 4.8"
          date="2026-06-27"
          prompt="Build a signup form with name, email and country fields that validates on submit and shows inline errors — no form library — following the bestax form skill."
        />

        <Title size="5">Result — a validated form (no form library)</Title>
        <SubTitle size="6" textColor="grey">
          State is plain React; errors surface via color=&quot;danger&quot; +
          message + messageColor. Click Save to validate.
        </SubTitle>

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
          <Field>
            <Buttons>
              <Button color="primary" type="submit">
                Save
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setName('');
                  setEmail('');
                  setCountry('');
                  setSubmitted(false);
                }}
              >
                Reset
              </Button>
            </Buttons>
          </Field>
        </form>
      </Box>
    );
  },
};
