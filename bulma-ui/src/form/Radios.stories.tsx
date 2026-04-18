import { Meta, StoryObj } from '@storybook/react-vite';
import Radio from './Radio';
import Radios from './Radios';
import { Field } from './Field';
import { Control } from './Control';

const meta: Meta<typeof Radios> = {
  title: 'Form/Radios',
  component: Radios,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A wrapper component that groups multiple Radio buttons together with proper spacing.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Radios>;

export const Default: Story = {
  render: () => (
    <Radios>
      <Radio name="event">Attend</Radio>
      <Radio name="event">Decline</Radio>
      <Radio name="event">Tentative</Radio>
    </Radios>
  ),
};

export const WithColors: Story = {
  render: () => (
    <Radios>
      <Radio name="color-group" color="primary">
        Primary
      </Radio>
      <Radio name="color-group" color="info">
        Info
      </Radio>
      <Radio name="color-group" color="success">
        Success
      </Radio>
    </Radios>
  ),
};

export const DisabledGroup: Story = {
  render: () => (
    <Radios>
      <Radio name="disabled-group" disabled>
        Attend
      </Radio>
      <Radio name="disabled-group" disabled>
        Decline
      </Radio>
      <Radio name="disabled-group" disabled>
        Tentative
      </Radio>
    </Radios>
  ),
};

// ============================================================
// Context-aware Field/Control stories
// ============================================================

/**
 * Standalone with label — Radios renders its own Field+Control wrapper automatically.
 */
export const WithLabel: Story = {
  render: () => (
    <Radios label="Color">
      <Radio name="color" value="red">Red</Radio>
      <Radio name="color" value="blue">Blue</Radio>
    </Radios>
  ),
};

/**
 * Inside Field — the outer Field turns off Radios' auto Field rendering via context.
 * Demonstrates horizontal layout composition.
 */
export const WithFieldWrapper: Story = {
  render: () => (
    <Field horizontal label="Color">
      <Field.Body>
        <Radios>
          <Radio name="color" value="red">Red</Radio>
          <Radio name="color" value="blue">Blue</Radio>
        </Radios>
      </Field.Body>
    </Field>
  ),
};

/**
 * Full manual composition — Field+Control provided externally,
 * Radios renders just its raw element.
 */
export const WithFieldControlWrapper: Story = {
  render: () => (
    <Field horizontal label="Color">
      <Field.Body>
        <Field>
          <Control>
            <Radios>
              <Radio name="color" value="red">Red</Radio>
              <Radio name="color" value="blue">Blue</Radio>
            </Radios>
          </Control>
        </Field>
      </Field.Body>
    </Field>
  ),
};
