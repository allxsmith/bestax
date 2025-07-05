import { Meta, StoryObj } from '@storybook/react';
import Select from './Select';
import Field from './Field';
import Control from './Control';

const meta: Meta<typeof Select> = {
  title: 'Form/Select',
  component: Select,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Select>;

const defaultOptions = [
  <option key="default" value="">
    Please select
  </option>,
  <option key="1" value="option1">
    Option 1
  </option>,
  <option key="2" value="option2">
    Option 2
  </option>,
];

const markTwainCharacters = [
  <option key="huck" value="huck">
    Huckleberry Finn
  </option>,
  <option key="tom" value="tom">
    Tom Sawyer
  </option>,
  <option key="becky" value="becky">
    Becky Thatcher
  </option>,
  <option key="jim" value="jim">
    Jim
  </option>,
  <option key="pap" value="pap">
    Pap Finn
  </option>,
  <option key="duke" value="duke">
    The Duke
  </option>,
  <option key="king" value="king">
    The King
  </option>,
  <option key="widow" value="widow">
    Widow Douglas
  </option>,
  <option key="judge" value="judge">
    Judge Thatcher
  </option>,
  <option key="sid" value="sid">
    Sid Sawyer
  </option>,
];

// Default
export const Default: Story = {
  render: () => (
    <Field label="Default">
      <Control>
        <Select>{defaultOptions}</Select>
      </Control>
    </Field>
  ),
};

// Multi Select
export const MultiSelect: Story = {
  render: () => (
    <Field label="Multi Select">
      <Control>
        <Select multiple multipleSize={10}>
          {markTwainCharacters}
        </Select>
      </Control>
    </Field>
  ),
};

// Color primary
export const ColorPrimary: Story = {
  render: () => (
    <Field label="Primary">
      <Control>
        <Select color="primary">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      </Control>
    </Field>
  ),
};

// Color link
export const ColorLink: Story = {
  render: () => (
    <Field label="Link">
      <Control>
        <Select color="link">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      </Control>
    </Field>
  ),
};

// Color info
export const ColorInfo: Story = {
  render: () => (
    <Field label="Info">
      <Control>
        <Select color="info">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      </Control>
    </Field>
  ),
};

// Color success
export const ColorSuccess: Story = {
  render: () => (
    <Field label="Success">
      <Control>
        <Select color="success">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      </Control>
    </Field>
  ),
};

// Color warning
export const ColorWarning: Story = {
  render: () => (
    <Field label="Warning">
      <Control>
        <Select color="warning">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      </Control>
    </Field>
  ),
};

// Color danger
export const ColorDanger: Story = {
  render: () => (
    <Field label="Danger">
      <Control>
        <Select color="danger">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      </Control>
    </Field>
  ),
};

// Styles Rounded
export const StylesRounded: Story = {
  render: () => (
    <Field label="Rounded">
      <Control>
        <Select isRounded>{defaultOptions}</Select>
      </Control>
    </Field>
  ),
};

// Sizes
export const SizeSmall: Story = {
  render: () => (
    <Field label="Small">
      <Control>
        <Select size="small">{defaultOptions}</Select>
      </Control>
    </Field>
  ),
};

export const SizeNormal: Story = {
  render: () => (
    <Field label="Normal">
      <Control>
        <Select>{defaultOptions}</Select>
      </Control>
    </Field>
  ),
};

export const SizeMedium: Story = {
  render: () => (
    <Field label="Medium">
      <Control>
        <Select size="medium">{defaultOptions}</Select>
      </Control>
    </Field>
  ),
};

export const SizeLarge: Story = {
  render: () => (
    <Field label="Large">
      <Control>
        <Select size="large">{defaultOptions}</Select>
      </Control>
    </Field>
  ),
};

// State Normal
export const StateNormal: Story = {
  render: () => (
    <Field label="Normal">
      <Control>
        <Select>{defaultOptions}</Select>
      </Control>
    </Field>
  ),
};

// State Hover
export const StateHover: Story = {
  render: () => (
    <Field label="Hover">
      <Control>
        <Select className="is-hovered">{defaultOptions}</Select>
      </Control>
    </Field>
  ),
};

// State Focus
export const StateFocus: Story = {
  render: () => (
    <Field label="Focus">
      <Control>
        <Select className="is-focused">{defaultOptions}</Select>
      </Control>
    </Field>
  ),
};

// State Loading
export const StateLoading: Story = {
  render: () => (
    <Field label="Loading">
      <Control isLoading>
        <Select isLoading>{defaultOptions}</Select>
      </Control>
    </Field>
  ),
};

// With Icons
export const WithIcons: Story = {
  render: () => (
    <Field label="With Icons">
      <Control hasIconsLeft iconLeft={{ name: 'person' }}>
        <Select>{markTwainCharacters}</Select>
      </Control>
    </Field>
  ),
};

// With Icons Size Small
export const WithIconsSizeSmall: Story = {
  render: () => (
    <Field label="With Icons Small">
      <Control
        hasIconsLeft
        iconLeft={{ name: 'person', size: 'small' }}
        size="small"
      >
        <Select size="small">{markTwainCharacters}</Select>
      </Control>
    </Field>
  ),
};

// With Icons Size Normal
export const WithIconsSizeNormal: Story = {
  render: () => (
    <Field label="With Icons Normal">
      <Control hasIconsLeft iconLeft={{ name: 'person' }}>
        <Select>{markTwainCharacters}</Select>
      </Control>
    </Field>
  ),
};

// With Icons Size Medium
export const WithIconsSizeMedium: Story = {
  render: () => (
    <Field label="With Icons Medium">
      <Control
        hasIconsLeft
        iconLeft={{ name: 'person', size: 'medium' }}
        size="medium"
      >
        <Select size="medium">{markTwainCharacters}</Select>
      </Control>
    </Field>
  ),
};

// With Icons Size Large
export const WithIconsSizeLarge: Story = {
  render: () => (
    <Field label="With Icons Large">
      <Control
        hasIconsLeft
        iconLeft={{ name: 'person', size: 'large' }}
        size="large"
      >
        <Select size="large">{markTwainCharacters}</Select>
      </Control>
    </Field>
  ),
};
