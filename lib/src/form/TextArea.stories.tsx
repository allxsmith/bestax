import { Meta, StoryObj } from '@storybook/react';
import TextArea from './TextArea';
import Field from './Field';
import Control from './Control';

const meta: Meta<typeof TextArea> = {
  title: 'Form/TextArea',
  component: TextArea,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof TextArea>;

// Default
export const Default: Story = {
  render: () => (
    <Field label="Default">
      <Control>
        <TextArea placeholder="Carpe Diem" />
      </Control>
    </Field>
  ),
};

// Rows
export const Rows: Story = {
  render: () => (
    <Field label="Rows">
      <Control>
        <TextArea rows={8} placeholder="8 rows" />
      </Control>
    </Field>
  ),
};

// Color primary
export const ColorPrimary: Story = {
  render: () => (
    <Field label="Primary">
      <Control>
        <TextArea color="primary" placeholder="Primary (color='primary')" />
      </Control>
    </Field>
  ),
};

// Color link
export const ColorLink: Story = {
  render: () => (
    <Field label="Link">
      <Control>
        <TextArea color="link" placeholder="Link (color='link')" />
      </Control>
    </Field>
  ),
};

// Color info
export const ColorInfo: Story = {
  render: () => (
    <Field label="Info">
      <Control>
        <TextArea color="info" placeholder="Info (color='info')" />
      </Control>
    </Field>
  ),
};

// Color success
export const ColorSuccess: Story = {
  render: () => (
    <Field label="Success">
      <Control>
        <TextArea color="success" placeholder="Success (color='success')" />
      </Control>
    </Field>
  ),
};

// Color warning
export const ColorWarning: Story = {
  render: () => (
    <Field label="Warning">
      <Control>
        <TextArea color="warning" placeholder="Warning (color='warning')" />
      </Control>
    </Field>
  ),
};

// Color danger
export const ColorDanger: Story = {
  render: () => (
    <Field label="Danger">
      <Control>
        <TextArea color="danger" placeholder="Danger (color='danger')" />
      </Control>
    </Field>
  ),
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div>
      <Field label="Small">
        <Control>
          <TextArea size="small" placeholder="Small" />
        </Control>
      </Field>
      <Field label="Normal">
        <Control>
          <TextArea placeholder="Normal" />
        </Control>
      </Field>
      <Field label="Medium">
        <Control>
          <TextArea size="medium" placeholder="Medium" />
        </Control>
      </Field>
      <Field label="Large">
        <Control>
          <TextArea size="large" placeholder="Large" />
        </Control>
      </Field>
    </div>
  ),
};

// State Normal
export const StateNormal: Story = {
  render: () => (
    <Field label="Normal">
      <Control>
        <TextArea placeholder="Normal state" />
      </Control>
    </Field>
  ),
};

// State Hover
export const StateHover: Story = {
  render: () => (
    <Field label="Hover">
      <Control>
        <TextArea isHovered placeholder="Hovered state" />
      </Control>
    </Field>
  ),
};

// State Focus
export const StateFocus: Story = {
  render: () => (
    <Field label="Focus">
      <Control>
        <TextArea isFocused placeholder="Focused state" />
      </Control>
    </Field>
  ),
};

// State Loading
export const StateLoading: Story = {
  render: () => (
    <Field label="Loading">
      <Control isLoading>
        <TextArea placeholder="Loading state" />
      </Control>
    </Field>
  ),
};

// State Loading Sizes
export const StateLoadingSizes: Story = {
  render: () => (
    <div>
      <Field label="Loading Small">
        <Control isLoading size="small">
          <TextArea size="small" placeholder="Loading small" />
        </Control>
      </Field>
      <Field label="Loading Normal">
        <Control isLoading>
          <TextArea placeholder="Loading normal" />
        </Control>
      </Field>
      <Field label="Loading Medium">
        <Control isLoading size="medium">
          <TextArea size="medium" placeholder="Loading medium" />
        </Control>
      </Field>
      <Field label="Loading Large">
        <Control isLoading size="large">
          <TextArea size="large" placeholder="Loading large" />
        </Control>
      </Field>
    </div>
  ),
};

// State Disabled
export const StateDisabled: Story = {
  render: () => (
    <Field label="Disabled">
      <Control>
        <TextArea disabled placeholder="Disabled textarea" />
      </Control>
    </Field>
  ),
};

// State ReadOnly
export const StateReadOnly: Story = {
  render: () => (
    <Field label="Read Only">
      <Control>
        <TextArea readOnly value="Read only value" />
      </Control>
    </Field>
  ),
};

// Fixed Size
export const FixedSize: Story = {
  render: () => (
    <Field label="Fixed Size">
      <Control>
        <TextArea hasFixedSize placeholder="Fixed size textarea" rows={3} />
      </Control>
    </Field>
  ),
};
