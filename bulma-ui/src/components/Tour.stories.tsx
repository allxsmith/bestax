import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { Tour } from './Tour';
import { Box } from '../elements/Box';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Paragraph } from '../elements/Paragraph';
import { Input } from '../form/Input';

const meta: Meta<typeof Tour> = {
  title: 'Components/Tour',
  component: Tour,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A walk through an interface, one element at a time. Each step is a dialog pointing at its target, modal over a dimmed page with a spotlight on the target by default, or non-modal with the page left usable.',
      },
    },
  },
  tags: ['autodocs'],
  subcomponents: { Step: Tour.Step },
  argTypes: {
    children: {
      control: false,
      description: 'Tour.Step parts, in the order the tour visits them',
    },
    // The stories open the tour from a button of their own, so its open
    // state and step have no controls here.
    open: {
      control: false,
      description: 'Controlled open state',
    },
    defaultOpen: {
      control: false,
      description: 'Initial open state when uncontrolled',
    },
    onOpenChange: {
      control: false,
      description:
        'Called with false when the tour ends: Skip, the close button, Escape, a click outside, or Done',
    },
    value: {
      control: false,
      description: 'Controlled index of the current step',
    },
    defaultValue: {
      control: 'number',
      description:
        'The step an uncontrolled tour starts on, each time it opens',
    },
    onChange: {
      control: false,
      description: 'Called with the new index when the step changes',
    },
    onFinish: {
      control: false,
      description:
        'Called when Done on the last step finishes the tour, before onOpenChange',
    },
    overlay: {
      control: 'boolean',
      description:
        'Dim the page and make each step modal; without it a step is a non-modal dialog',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'End the tour on Escape',
    },
    closeOnClickOutside: {
      control: 'boolean',
      description: 'End the tour on a press outside the step',
    },
    portal: {
      control: false,
      description:
        'Where the tour renders: true for the portal container, a selector or element, or false for in place',
    },
    titleAs: {
      control: 'select',
      options: ['h2', 'h3', 'h4', 'h5', 'h6', 'p'],
      description: 'What each step’s title renders as',
    },
    labels: {
      control: 'object',
      description: 'The words the tour writes, and the progress line',
    },
  },
  args: {
    overlay: true,
    closeOnEscape: true,
    closeOnClickOutside: false,
    titleAs: 'h2',
  },
};

export default meta;
type Story = StoryObj<typeof Tour>;

/**
 * A first-visit tour of a small toolbar, opened from a button. Use the
 * controls to try the overlay and the dismissal options.
 */
export const Default: Story = {
  render: function DefaultTour(args) {
    const [open, setOpen] = useState(false);
    const filtersRef = useRef<HTMLButtonElement>(null);
    const exportRef = useRef<HTMLButtonElement>(null);
    return (
      <>
        <Box display="flex" justifyContent="space-between">
          <Button ref={filtersRef}>Filters</Button>
          <Button ref={exportRef}>Export</Button>
        </Box>
        <Button color="primary" onClick={() => setOpen(true)}>
          Take the tour
        </Button>
        <Tour {...args} open={open} onOpenChange={setOpen}>
          <Tour.Step title="Welcome">
            A quick look around the list and its tools.
          </Tour.Step>
          <Tour.Step target={filtersRef} title="Filters">
            The Filters button narrows the list by status and owner.
          </Tour.Step>
          <Tour.Step target={exportRef} title="Export" position="left">
            The Export button downloads the rows you see as a CSV file.
          </Tour.Step>
        </Tour>
      </>
    );
  },
};

/**
 * The parts as statics: each `Tour.Step` takes a `target`, a `title` and its
 * body as children, and renders nothing where it's written.
 */
export const CompoundUsage: Story = {
  render: function CompoundTour() {
    const [open, setOpen] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    return (
      <>
        <Input ref={searchRef} aria-label="Search" placeholder="Search" />
        <Button mt="3" onClick={() => setOpen(true)}>
          Show me
        </Button>
        <Tour open={open} onOpenChange={setOpen}>
          <Tour.Step target={searchRef} title="Search">
            The search box finds any row by its name or its owner.
          </Tour.Step>
        </Tour>
      </>
    );
  },
};

/**
 * Without the overlay, each step is a non-modal dialog: the page stays usable,
 * so the user can try the control a step explains.
 */
export const WithoutOverlay: Story = {
  render: function NonModalTour() {
    const [open, setOpen] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);
    return (
      <>
        <Input ref={nameRef} aria-label="Project name" placeholder="Name" />
        <Button mt="3" onClick={() => setOpen(true)}>
          Try it
        </Button>
        <Tour open={open} onOpenChange={setOpen} overlay={false}>
          <Tour.Step
            target={nameRef}
            title="Name your project"
            position="right"
          >
            Type a name in the field. The page stays usable while this step
            shows.
          </Tour.Step>
        </Tour>
      </>
    );
  },
};

/**
 * A step sits on any side of its target, flips to the other side when it
 * doesn't fit, and reads `left` and `right` as the start and the end of the
 * line.
 */
export const Positions: Story = {
  render: function PositionedTour() {
    const [open, setOpen] = useState(false);
    const targetRef = useRef<HTMLButtonElement>(null);
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p="6">
        <Button ref={targetRef} mb="4">
          Target
        </Button>
        <Button onClick={() => setOpen(true)}>Walk the sides</Button>
        <Tour open={open} onOpenChange={setOpen}>
          {(['bottom', 'right', 'top', 'left'] as const).map(position => (
            <Tour.Step
              key={position}
              target={targetRef}
              title={`On the ${position}`}
              position={position}
            >
              This step sits on the {position} of its target.
            </Tour.Step>
          ))}
        </Tour>
      </Box>
    );
  },
};

/**
 * A controlled tour: the app holds the step and whether it's open, and
 * records a finished tour apart from a skipped one.
 */
export const Controlled: Story = {
  render: function ControlledTour() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [result, setResult] = useState('not taken');
    const saveRef = useRef<HTMLButtonElement>(null);
    return (
      <>
        <Buttons>
          <Button
            onClick={() => {
              setStep(0);
              setResult('in progress');
              setOpen(true);
            }}
          >
            Start
          </Button>
          <Button ref={saveRef}>Save</Button>
        </Buttons>
        <Paragraph>
          Step {step + 1}, tour {result}
        </Paragraph>
        <Tour
          open={open}
          onOpenChange={next => {
            setOpen(next);
            // Done calls onFinish first, so a finished tour stays finished.
            if (!next) setResult(now => (now === 'finished' ? now : 'skipped'));
          }}
          value={step}
          onChange={setStep}
          onFinish={() => setResult('finished')}
        >
          <Tour.Step title="Your draft">
            Everything you write is kept.
          </Tour.Step>
          <Tour.Step target={saveRef} title="Save">
            The Save button publishes your draft.
          </Tour.Step>
        </Tour>
      </>
    );
  },
};

/**
 * The words in another language, through `labels`, with the progress line
 * written by a function of its own.
 */
export const CustomLabels: Story = {
  render: function TranslatedTour() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Empezar</Button>
        <Tour
          open={open}
          onOpenChange={setOpen}
          labels={{
            skip: 'Omitir',
            back: 'Atrás',
            next: 'Siguiente',
            done: 'Listo',
            close: 'Cerrar',
            progress: (step, total) => `Paso ${step} de ${total}`,
          }}
        >
          <Tour.Step title="Bienvenida">Un recorrido breve.</Tour.Step>
          <Tour.Step title="Listo">Eso es todo.</Tour.Step>
        </Tour>
      </>
    );
  },
};
