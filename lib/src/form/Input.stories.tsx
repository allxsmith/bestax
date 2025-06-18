import { Meta, StoryObj } from '@storybook/react';
import Input from './Input';
import Field from './Field';
import Control from './Control';

// Storybook metadata
const meta: Meta<typeof Input> = {
  title: 'Form/Input',
  component: Input,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Input>;

// Default Input
export const Default: Story = {
  render: () => (
    <Field label="Default">
      <Control>
        <Input placeholder="Default input" />
      </Control>
    </Field>
  ),
};

// Color Inputs
export const ColorPrimary: Story = {
  render: () => (
    <Field label="Primary">
      <Control>
        <Input color="primary" placeholder="Primary input" />
      </Control>
    </Field>
  ),
};

export const ColorLink: Story = {
  render: () => (
    <Field label="Link">
      <Control>
        <Input color="link" placeholder="Link input" />
      </Control>
    </Field>
  ),
};

export const ColorInfo: Story = {
  render: () => (
    <Field label="Info">
      <Control>
        <Input color="info" placeholder="Info input" />
      </Control>
    </Field>
  ),
};

export const ColorSuccess: Story = {
  render: () => (
    <Field label="Success">
      <Control>
        <Input color="success" placeholder="Success input" />
      </Control>
    </Field>
  ),
};

export const ColorWarning: Story = {
  render: () => (
    <Field label="Warning">
      <Control>
        <Input color="warning" placeholder="Warning input" />
      </Control>
    </Field>
  ),
};

export const ColorDanger: Story = {
  render: () => (
    <Field label="Danger">
      <Control>
        <Input color="danger" placeholder="Danger input" />
      </Control>
    </Field>
  ),
};

// Sizes
export const SizeSmall: Story = {
  render: () => (
    <Field label="Small">
      <Control>
        <Input size="small" placeholder="Small input" />
      </Control>
    </Field>
  ),
};

export const SizeNormal: Story = {
  render: () => (
    <Field label="Normal">
      <Control>
        <Input placeholder="Normal input" />
      </Control>
    </Field>
  ),
};

export const SizeMedium: Story = {
  render: () => (
    <Field label="Medium">
      <Control>
        <Input size="medium" placeholder="Medium input" />
      </Control>
    </Field>
  ),
};

export const SizeLarge: Story = {
  render: () => (
    <Field label="Large">
      <Control>
        <Input size="large" placeholder="Large input" />
      </Control>
    </Field>
  ),
};

// Style: Rounded
export const StylesRounded: Story = {
  render: () => (
    <Field label="Rounded">
      <Control>
        <Input isRounded placeholder="Rounded input" />
      </Control>
    </Field>
  ),
};

// States
export const StatesNormal: Story = {
  render: () => (
    <Field label="Normal">
      <Control>
        <Input placeholder="Normal state" />
      </Control>
    </Field>
  ),
};

export const StatesHover: Story = {
  render: () => (
    <Field label="Hover">
      <Control>
        <Input isHovered placeholder="Hovered state" />
      </Control>
    </Field>
  ),
};

export const StatesFocus: Story = {
  render: () => (
    <Field label="Focus">
      <Control>
        <Input isFocused placeholder="Focused state" />
      </Control>
    </Field>
  ),
};

export const StatesLoading: Story = {
  render: () => (
    <Field label="Loading">
      <Control isLoading>
        <Input placeholder="Loading state" />
      </Control>
    </Field>
  ),
};

// Loading by size
export const LoadingSmall: Story = {
  render: () => (
    <Field label="Loading Small">
      <Control isLoading size="small">
        <Input size="small" placeholder="Loading small" />
      </Control>
    </Field>
  ),
};

export const LoadingNormal: Story = {
  render: () => (
    <Field label="Loading Normal">
      <Control isLoading>
        <Input placeholder="Loading normal" />
      </Control>
    </Field>
  ),
};

export const LoadingMedium: Story = {
  render: () => (
    <Field label="Loading Medium">
      <Control isLoading size="medium">
        <Input size="medium" placeholder="Loading medium" />
      </Control>
    </Field>
  ),
};

export const LoadingLarge: Story = {
  render: () => (
    <Field label="Loading Large">
      <Control isLoading size="large">
        <Input size="large" placeholder="Loading large" />
      </Control>
    </Field>
  ),
};

// Disabled & Read Only
export const StatesDisabled: Story = {
  render: () => (
    <Field label="Disabled">
      <Control>
        <Input disabled placeholder="Disabled input" />
      </Control>
    </Field>
  ),
};

export const StatesReadOnly: Story = {
  render: () => (
    <Field label="Read Only">
      <Control>
        <Input readOnly value="Read only value" />
      </Control>
    </Field>
  ),
};

// Static state (with comparison)
export const StatesStatic: Story = {
  render: () => (
    <>
      <Field horizontal label="Username">
        <Control>
          <Input isStatic value="Static value" />
        </Control>
      </Field>
      <Field horizontal label="Password">
        <Control>
          <Input placeholder="Editable value" />
        </Control>
      </Field>
    </>
  ),
};

// With Icons (left and right)
export const WithIcons: Story = {
  render: () => (
    <>
      <Field>
        <Control
          hasIconsLeft
          hasIconsRight
          iconLeft={{ name: 'user' }}
          iconRight={{ name: 'check' }}
        >
          <Input placeholder="With icons" />
        </Control>
      </Field>
      <Field>
        <Control
          hasIconsLeft
          hasIconsRight
          iconLeft={{ name: 'envelope' }}
          iconRight={{ name: 'exclamation-triangle' }}
        >
          <Input placeholder="Another input" />
        </Control>
      </Field>
    </>
  ),
};

// With Icons and Size Small
export const WithIconsAndSizeSmall: Story = {
  render: () => (
    <>
      <Field>
        <Control
          hasIconsLeft
          hasIconsRight
          size="small"
          iconLeft={{ name: 'user', size: 'small' }}
          iconRight={{ name: 'check', size: 'small' }}
        >
          <Input size="small" placeholder="Icons left/right small" />
        </Control>
      </Field>
      <Field>
        <Control
          hasIconsLeft
          hasIconsRight
          size="small"
          iconLeft={{ name: 'envelope', size: 'small' }}
          iconRight={{ name: 'exclamation-triangle', size: 'small' }}
        >
          <Input size="small" placeholder="Another input small" />
        </Control>
      </Field>
    </>
  ),
};

// With Icons and Size Normal
export const WithIconsAndSizeNormal: Story = {
  render: () => (
    <>
      <Field>
        <Control
          hasIconsLeft
          hasIconsRight
          iconLeft={{ name: 'user' }}
          iconRight={{ name: 'check' }}
        >
          <Input placeholder="Icons left/right normal" />
        </Control>
      </Field>
      <Field>
        <Control
          hasIconsLeft
          hasIconsRight
          iconLeft={{ name: 'envelope' }}
          iconRight={{ name: 'exclamation-triangle' }}
        >
          <Input placeholder="Another input normal" />
        </Control>
      </Field>
    </>
  ),
};

// With Icons and Size Medium
export const WithIconsAndSizeMedium: Story = {
  render: () => (
    <>
      <Field>
        <Control
          hasIconsLeft
          hasIconsRight
          size="medium"
          iconLeft={{ name: 'user', size: 'medium' }}
          iconRight={{ name: 'check', size: 'medium' }}
        >
          <Input size="medium" placeholder="Icons left/right medium" />
        </Control>
      </Field>
      <Field>
        <Control
          hasIconsLeft
          hasIconsRight
          size="medium"
          iconLeft={{ name: 'envelope', size: 'medium' }}
          iconRight={{ name: 'exclamation-triangle', size: 'medium' }}
        >
          <Input size="medium" placeholder="Another input medium" />
        </Control>
      </Field>
    </>
  ),
};

// With Icons and Size Large
export const WithIconsAndSizeLarge: Story = {
  render: () => (
    <>
      <Field>
        <Control
          hasIconsLeft
          hasIconsRight
          size="large"
          iconLeft={{ name: 'user', size: 'large' }}
          iconRight={{ name: 'check', size: 'large' }}
        >
          <Input size="large" placeholder="Icons left/right large" />
        </Control>
      </Field>
      <Field>
        <Control
          hasIconsLeft
          hasIconsRight
          size="large"
          iconLeft={{ name: 'envelope', size: 'large' }}
          iconRight={{ name: 'exclamation-triangle', size: 'large' }}
        >
          <Input size="large" placeholder="Another input large" />
        </Control>
      </Field>
    </>
  ),
};
