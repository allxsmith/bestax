import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Steps } from './Steps';
import { Block } from '../elements/Block';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Column } from '../columns/Column';
import { Columns } from '../columns/Columns';
import { Icon } from '../elements/Icon';
import { Title } from '../elements/Title';
import { Paragraph } from '../elements/Paragraph';

const meta: Meta<typeof Steps> = {
  title: 'Components/Steps',
  component: Steps,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A multi-step progress indicator for wizard flows, checkout processes, or any multi-step workflow. Supports step numbers, icons, navigation buttons, and multiple layouts.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: 'Current active step (0-indexed)',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the steps',
    },
    color: {
      control: 'select',
      options: ['primary', 'link', 'info', 'success', 'warning', 'danger'],
      description: 'Color variant',
    },
    hasMarker: {
      control: 'boolean',
      description: 'Show step markers',
    },
    animated: {
      control: 'boolean',
      description: 'Enable animations',
    },
    rounded: {
      control: 'boolean',
      description: 'Use rounded markers',
    },
    vertical: {
      control: 'boolean',
      description: 'Vertical layout',
    },
    labelPosition: {
      control: 'select',
      options: ['bottom', 'right', 'left'],
      description: 'Label position',
    },
    showStepNumbers: {
      control: 'boolean',
      description: 'Show step numbers in markers',
    },
    hasNavigation: {
      control: 'boolean',
      description: 'Show built-in prev/next navigation buttons',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Steps>;

const defaultItems = [
  { label: 'Account', clickable: true },
  { label: 'Profile', clickable: true },
  { label: 'Settings', clickable: true },
  { label: 'Complete', clickable: true },
];

const defaultContent = [
  'Set up your account credentials and choose a username.',
  'Add your personal details and upload a photo.',
  'Configure your notification and privacy preferences.',
  'Review everything and finish the setup process.',
];

/**
 * Basic 3-step with navigation, showing step numbers in markers.
 */
export const Default: Story = {
  render: function DefaultStory() {
    const [step, setStep] = useState(0);
    const items = [
      { label: 'Account', clickable: true },
      { label: 'Profile', clickable: true },
      { label: 'Complete', clickable: true },
    ];
    const content = [
      'Create your account with an email and password.',
      'Tell us about yourself and set your preferences.',
      'Review your details and get started.',
    ];

    return (
      <div>
        <Steps value={step} onStepClick={setStep} hasNavigation items={items} />
        <Box>
          <Title size="5">{items[step].label}</Title>
          <Paragraph>{content[step]}</Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * Interactive steps: click through each position with prev/next buttons.
 */
export const Positions: Story = {
  render: function PositionsStory() {
    const [step, setStep] = useState(0);

    return (
      <div>
        <Steps value={step} onStepClick={setStep} items={defaultItems} />
        <Box>
          <Title size="5">
            Step {step + 1}: {defaultItems[step].label}
          </Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
        </Box>
        <Buttons>
          <Button disabled={step === 0} onClick={() => setStep(s => s - 1)}>
            Previous
          </Button>
          <Button
            color="primary"
            disabled={step === defaultItems.length - 1}
            onClick={() => setStep(s => s + 1)}
          >
            Next
          </Button>
        </Buttons>
      </div>
    );
  },
};

/**
 * Steps without numbers in markers — empty markers only.
 */
export const NoNumbers: Story = {
  render: function NoNumbersStory() {
    const [step, setStep] = useState(0);

    return (
      <div>
        <Steps
          value={step}
          onStepClick={setStep}
          showStepNumbers={false}
          color="primary"
          hasNavigation
          items={defaultItems}
        />
        <Box>
          <Title size="5">{defaultItems[step].label}</Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * Steps with no labels — only markers are visible.
 */
export const NoLabels: Story = {
  render: function NoLabelsStory() {
    const [step, setStep] = useState(1);
    const labels = ['Account', 'Profile', 'Settings', 'Complete'];
    const items = labels.map(() => ({ clickable: true }));

    return (
      <div>
        <Steps
          value={step}
          onStepClick={setStep}
          color="info"
          rounded
          hasNavigation
          items={items}
        />
        <Box>
          <Title size="5">
            Step {step + 1}: {labels[step]}
          </Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * Completed steps are highlighted (colored background) but do not show a checkmark.
 * Uses `completedIcon: null` so completed markers show the step number instead.
 */
export const HighlightedCompleted: Story = {
  render: function HighlightedCompletedStory() {
    const [step, setStep] = useState(2);
    const items = defaultItems.map(item => ({
      ...item,
      completedIcon: null as React.ReactNode,
    }));

    return (
      <div>
        <Steps
          value={step}
          onStepClick={setStep}
          color="success"
          hasNavigation
          items={items}
        />
        <Box>
          <Title size="5">{defaultItems[step].label}</Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
          <Paragraph textColor="grey" textSize="7" mt="2">
            Completed steps show their number with a colored background instead
            of a checkmark.
          </Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * Non-rounded markers — the default shape uses a standard border-radius.
 * Compare with the Rounded story to see the difference.
 */
export const NotRounded: Story = {
  render: function NotRoundedStory() {
    const [step, setStep] = useState(1);

    return (
      <div>
        <Steps
          value={step}
          onStepClick={setStep}
          rounded={false}
          color="primary"
          hasNavigation
          items={defaultItems}
        />
        <Box>
          <Title size="5">{defaultItems[step].label}</Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * Non-clickable steps — markers cannot be clicked to navigate.
 * Only the navigation buttons control the active step.
 */
export const NonClickable: Story = {
  render: function NonClickableStory() {
    const [step, setStep] = useState(0);
    const items = [
      { label: 'Account' },
      { label: 'Profile' },
      { label: 'Settings' },
      { label: 'Complete' },
    ];

    return (
      <div>
        <Steps
          value={step}
          onStepClick={setStep}
          color="warning"
          hasNavigation
          items={items}
        />
        <Box>
          <Title size="5">{items[step].label}</Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
          <Paragraph textColor="grey" textSize="7" mt="2">
            Step markers are not clickable. Use the Previous/Next buttons to
            navigate.
          </Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * Labels positioned below the markers (default).
 */
export const LabelsBottom: Story = {
  render: function LabelsBottomStory() {
    const [step, setStep] = useState(1);

    return (
      <div>
        <Steps
          value={step}
          onStepClick={setStep}
          labelPosition="bottom"
          color="primary"
          hasNavigation
          items={defaultItems}
        />
        <Box>
          <Title size="5">{defaultItems[step].label}</Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * Labels positioned to the right of the markers.
 */
export const LabelsRight: Story = {
  render: function LabelsRightStory() {
    const [step, setStep] = useState(1);

    return (
      <div>
        <Steps
          value={step}
          onStepClick={setStep}
          labelPosition="right"
          color="info"
          hasNavigation
          items={defaultItems}
        />
        <Box>
          <Title size="5">{defaultItems[step].label}</Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * Labels positioned to the left of the markers.
 */
export const LabelsLeft: Story = {
  render: function LabelsLeftStory() {
    const [step, setStep] = useState(1);

    return (
      <div>
        <Steps
          value={step}
          onStepClick={setStep}
          labelPosition="left"
          color="success"
          hasNavigation
          items={defaultItems}
        />
        <Box>
          <Title size="5">{defaultItems[step].label}</Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * All 6 color variants, each with navigation.
 */
export const Colors: Story = {
  render: function ColorsStory() {
    const colors = [
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
    ] as const;
    const [steps, setSteps] = useState<Record<string, number>>(
      Object.fromEntries(colors.map(c => [c, 1]))
    );

    return (
      <div>
        {colors.map(color => (
          <Block key={color}>
            <Title size="6" textTransform="capitalized">
              {color}
            </Title>
            <Steps
              value={steps[color]}
              color={color}
              onStepClick={s => setSteps(prev => ({ ...prev, [color]: s }))}
              hasNavigation
              items={[
                { label: 'Step 1', clickable: true },
                { label: 'Step 2', clickable: true },
                { label: 'Step 3', clickable: true },
              ]}
            />
          </Block>
        ))}
      </div>
    );
  },
};

/**
 * All 4 sizes (small/default/medium/large), each with navigation.
 */
export const Sizes: Story = {
  render: function SizesStory() {
    const sizes = [
      { label: 'Small', size: 'small' as const },
      { label: 'Default', size: undefined },
      { label: 'Medium', size: 'medium' as const },
      { label: 'Large', size: 'large' as const },
    ];
    const [steps, setSteps] = useState<Record<string, number>>(
      Object.fromEntries(sizes.map(s => [s.label, 1]))
    );

    return (
      <div>
        {sizes.map(({ label, size }) => (
          <Block key={label}>
            <Title size="6">{label}</Title>
            <Steps
              value={steps[label]}
              size={size}
              onStepClick={s => setSteps(prev => ({ ...prev, [label]: s }))}
              hasNavigation
              items={[
                { label: 'Step 1', clickable: true },
                { label: 'Step 2', clickable: true },
                { label: 'Step 3', clickable: true },
              ]}
            />
          </Block>
        ))}
      </div>
    );
  },
};

/**
 * Toggle animation on/off with navigation to move through steps.
 */
export const Animation: Story = {
  render: function AnimationStory() {
    const [step, setStep] = useState(0);
    const [animated, setAnimated] = useState(true);

    return (
      <div>
        <div className="field mb-4">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={animated}
              onChange={e => setAnimated(e.target.checked)}
            />{' '}
            Enable animation
          </label>
        </div>
        <Steps
          value={step}
          onStepClick={setStep}
          animated={animated}
          color="primary"
          hasNavigation
          items={defaultItems}
        />
      </div>
    );
  },
};

/**
 * Rounded markers with navigation.
 */
export const Rounded: Story = {
  render: function RoundedStory() {
    const [step, setStep] = useState(1);

    return (
      <Steps
        value={step}
        onStepClick={setStep}
        rounded
        color="info"
        hasNavigation
        items={defaultItems}
      />
    );
  },
};

/**
 * Steps with icons in markers, with navigation.
 */
export const WithIcons: Story = {
  render: function WithIconsStory() {
    const [step, setStep] = useState(1);
    const items = [
      { label: 'Account', icon: <Icon name="user" />, clickable: true },
      { label: 'Profile', icon: <Icon name="id-card" />, clickable: true },
      { label: 'Settings', icon: <Icon name="cog" />, clickable: true },
      { label: 'Complete', icon: <Icon name="check" />, clickable: true },
    ];

    return (
      <div>
        <Steps
          value={step}
          onStepClick={setStep}
          color="info"
          hasNavigation
          items={items}
        />
        <Box>
          <Title size="5">{items[step].label}</Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * Show bottom, right, and left label positions.
 */
export const LabelPositions: Story = {
  render: function LabelPositionsStory() {
    const positions = ['bottom', 'right', 'left'] as const;
    const [steps, setSteps] = useState<Record<string, number>>(
      Object.fromEntries(positions.map(p => [p, 1]))
    );

    return (
      <div>
        {positions.map(pos => (
          <Block key={pos}>
            <Title size="6" textTransform="capitalized">
              Label: {pos}
            </Title>
            <Steps
              value={steps[pos]}
              onStepClick={s => setSteps(prev => ({ ...prev, [pos]: s }))}
              labelPosition={pos}
              color="primary"
              hasNavigation
              items={[
                { label: 'Step 1', clickable: true },
                { label: 'Step 2', clickable: true },
                { label: 'Step 3', clickable: true },
              ]}
            />
          </Block>
        ))}
      </div>
    );
  },
};

/**
 * Click on any step to jump to it, plus navigation buttons.
 */
export const Clickable: Story = {
  render: function ClickableStory() {
    const [step, setStep] = useState(0);

    return (
      <div>
        <Steps
          value={step}
          color="primary"
          onStepClick={setStep}
          hasNavigation
          items={defaultItems}
        />
        <Box>
          <Title size="5">{defaultItems[step].label}</Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
          <Paragraph textColor="grey" textSize="7" mt="2">
            Click any step marker or use the buttons to navigate.
          </Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * Vertical layout with navigation and step content.
 */
export const Vertical: Story = {
  render: function VerticalStory() {
    const [step, setStep] = useState(1);
    const items = [
      { label: 'Create Account', clickable: true },
      { label: 'Verify Email', clickable: true },
      { label: 'Complete Profile', clickable: true },
      { label: 'Start Using App', clickable: true },
    ];
    const content = [
      'Create your account with an email and password.',
      'Check your inbox and verify your email address.',
      'Fill in your profile details and preferences.',
      "You're all set! Start exploring the app.",
    ];

    return (
      <Columns>
        <Column isNarrow>
          <Steps
            value={step}
            vertical
            color="success"
            onStepClick={setStep}
            items={items}
          />
        </Column>
        <Column>
          <Title size="4">{items[step].label}</Title>
          <Paragraph mb="4">{content[step]}</Paragraph>
          <Buttons>
            <Button disabled={step === 0} onClick={() => setStep(s => s - 1)}>
              Previous
            </Button>
            <Button
              color="success"
              disabled={step === items.length - 1}
              onClick={() => setStep(s => s + 1)}
            >
              Next
            </Button>
          </Buttons>
        </Column>
      </Columns>
    );
  },
};

/**
 * Vertical layout with labels to the right of markers (default vertical behavior).
 */
export const VerticalLabelsRight: Story = {
  render: function VerticalLabelsRightStory() {
    const [step, setStep] = useState(1);
    const items = [
      { label: 'Create Account', clickable: true },
      { label: 'Verify Email', clickable: true },
      { label: 'Complete Profile', clickable: true },
      { label: 'Start Using App', clickable: true },
    ];
    const content = [
      'Create your account with an email and password.',
      'Check your inbox and verify your email address.',
      'Fill in your profile details and preferences.',
      "You're all set! Start exploring the app.",
    ];

    return (
      <Columns>
        <Column isNarrow>
          <Steps
            value={step}
            vertical
            labelPosition="right"
            color="primary"
            onStepClick={setStep}
            items={items}
          />
        </Column>
        <Column>
          <Title size="4">{items[step].label}</Title>
          <Paragraph mb="4">{content[step]}</Paragraph>
          <Buttons>
            <Button disabled={step === 0} onClick={() => setStep(s => s - 1)}>
              Previous
            </Button>
            <Button
              color="primary"
              disabled={step === items.length - 1}
              onClick={() => setStep(s => s + 1)}
            >
              Next
            </Button>
          </Buttons>
        </Column>
      </Columns>
    );
  },
};

/**
 * Vertical layout with labels to the left of markers.
 */
export const VerticalLabelsLeft: Story = {
  render: function VerticalLabelsLeftStory() {
    const [step, setStep] = useState(1);
    const items = [
      { label: 'Create Account', clickable: true },
      { label: 'Verify Email', clickable: true },
      { label: 'Complete Profile', clickable: true },
      { label: 'Start Using App', clickable: true },
    ];
    const content = [
      'Create your account with an email and password.',
      'Check your inbox and verify your email address.',
      'Fill in your profile details and preferences.',
      "You're all set! Start exploring the app.",
    ];

    return (
      <Columns>
        <Column isNarrow>
          <Steps
            value={step}
            vertical
            labelPosition="left"
            color="info"
            onStepClick={setStep}
            items={items}
          />
        </Column>
        <Column>
          <Title size="4">{items[step].label}</Title>
          <Paragraph mb="4">{content[step]}</Paragraph>
          <Buttons>
            <Button disabled={step === 0} onClick={() => setStep(s => s - 1)}>
              Previous
            </Button>
            <Button
              color="info"
              disabled={step === items.length - 1}
              onClick={() => setStep(s => s + 1)}
            >
              Next
            </Button>
          </Buttons>
        </Column>
      </Columns>
    );
  },
};

/**
 * Vertical layout with labels below the markers.
 */
export const VerticalLabelsBottom: Story = {
  render: function VerticalLabelsBottomStory() {
    const [step, setStep] = useState(1);
    const items = [
      { label: 'Create Account', clickable: true },
      { label: 'Verify Email', clickable: true },
      { label: 'Complete Profile', clickable: true },
      { label: 'Start Using App', clickable: true },
    ];
    const content = [
      'Create your account with an email and password.',
      'Check your inbox and verify your email address.',
      'Fill in your profile details and preferences.',
      "You're all set! Start exploring the app.",
    ];

    return (
      <Columns>
        <Column isNarrow>
          <Steps
            value={step}
            vertical
            labelPosition="bottom"
            color="warning"
            onStepClick={setStep}
            items={items}
          />
        </Column>
        <Column>
          <Title size="4">{items[step].label}</Title>
          <Paragraph mb="4">{content[step]}</Paragraph>
          <Buttons>
            <Button disabled={step === 0} onClick={() => setStep(s => s - 1)}>
              Previous
            </Button>
            <Button
              color="warning"
              disabled={step === items.length - 1}
              onClick={() => setStep(s => s + 1)}
            >
              Next
            </Button>
          </Buttons>
        </Column>
      </Columns>
    );
  },
};

/**
 * Minimal and compact mobile modes (resize browser to see effect).
 */
export const MobileMode: Story = {
  render: function MobileModeStory() {
    const [step1, setStep1] = useState(1);
    const [step2, setStep2] = useState(1);
    const items = [
      { label: 'Step 1', clickable: true },
      { label: 'Step 2', clickable: true },
      { label: 'Step 3', clickable: true },
      { label: 'Step 4', clickable: true },
    ];

    return (
      <div>
        <Block>
          <Title size="6">Minimal (labels hidden on mobile)</Title>
          <Steps
            value={step1}
            onStepClick={setStep1}
            mobileMode="minimal"
            color="primary"
            hasNavigation
            items={items}
          />
        </Block>
        <Block>
          <Title size="6">Compact (smaller labels on mobile)</Title>
          <Steps
            value={step2}
            onStepClick={setStep2}
            mobileMode="compact"
            color="info"
            hasNavigation
            items={items}
          />
        </Block>
      </div>
    );
  },
};

/**
 * Showcase built-in `hasNavigation` prop with custom labels.
 */
export const HasNavigation: Story = {
  render: function HasNavigationStory() {
    const [step, setStep] = useState(0);

    return (
      <div>
        <Title size="6">Default labels</Title>
        <Steps
          value={step}
          onStepClick={setStep}
          color="primary"
          hasNavigation
          items={defaultItems}
        />
        <Box mb="5">
          <Title size="5">{defaultItems[step].label}</Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
        </Box>
        <hr />
        <Title size="6">Custom labels</Title>
        <Steps
          value={step}
          onStepClick={setStep}
          color="success"
          hasNavigation
          prevLabel="Back"
          nextLabel="Continue"
          items={defaultItems}
        />
        <Box>
          <Title size="5">{defaultItems[step].label}</Title>
          <Paragraph>{defaultContent[step]}</Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * Using `<Steps.Step>` compound component API with navigation.
 */
export const CompoundComponents: Story = {
  render: function CompoundStory() {
    const [step, setStep] = useState(1);
    const labels = ['Account', 'Profile', 'Complete'];
    const content = [
      'Create your account with an email and password.',
      'Tell us about yourself and set your preferences.',
      'Review your details and get started.',
    ];

    return (
      <div>
        <Steps value={step} color="primary" onStepClick={setStep} hasNavigation>
          <Steps.Step label="Account" clickable />
          <Steps.Step label="Profile" clickable />
          <Steps.Step label="Complete" clickable />
        </Steps>
        <Box>
          <Title size="5">{labels[step]}</Title>
          <Paragraph>{content[step]}</Paragraph>
        </Box>
      </div>
    );
  },
};

/**
 * Full practical checkout wizard with step content panels.
 */
export const CheckoutWizard: Story = {
  render: function CheckoutStory() {
    const [step, setStep] = useState(0);
    const steps = ['Cart', 'Shipping', 'Payment', 'Confirm'];
    const content = [
      'Review the items in your cart before proceeding.',
      'Enter your shipping address and select a delivery method.',
      'Choose a payment method and enter your details.',
      'Review your order and confirm the purchase.',
    ];

    return (
      <Block mx="auto" style={{ maxWidth: '600px' }}>
        <Steps
          value={step}
          color="success"
          onStepClick={setStep}
          items={steps.map(label => ({ label, clickable: true }))}
        />
        <Box>
          <Title size="5">{steps[step]}</Title>
          <Paragraph mb="4">{content[step]}</Paragraph>
          <Buttons>
            <Button disabled={step === 0} onClick={() => setStep(s => s - 1)}>
              Back
            </Button>
            <Button
              color="success"
              onClick={() => setStep(s => Math.min(s + 1, steps.length - 1))}
              disabled={step === steps.length - 1}
            >
              {step === steps.length - 2 ? 'Place Order' : 'Continue'}
            </Button>
          </Buttons>
        </Box>
      </Block>
    );
  },
};

/**
 * 7 steps with navigation.
 */
export const ManySteps: Story = {
  render: function ManyStepsStory() {
    const [step, setStep] = useState(3);
    const items = Array.from({ length: 7 }, (_, i) => ({
      label: `Step ${i + 1}`,
      clickable: true,
    }));
    const descriptions = [
      'Initialize the project and set up your workspace.',
      'Configure your environment variables and dependencies.',
      'Define the data models and schema structure.',
      'Implement the core business logic.',
      'Add authentication and authorization layers.',
      'Write tests and validate all workflows.',
      'Deploy to production and monitor performance.',
    ];

    return (
      <div>
        <Steps
          value={step}
          size="small"
          color="primary"
          onStepClick={setStep}
          hasNavigation
          items={items}
        />
        <Box>
          <Title size="5">{items[step].label}</Title>
          <Paragraph>{descriptions[step]}</Paragraph>
        </Box>
      </div>
    );
  },
};
