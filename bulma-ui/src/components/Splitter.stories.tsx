import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Splitter } from './Splitter';
import { Menu } from './Menu';
import { ScrollArea } from './ScrollArea';
import { Button } from '../elements/Button';
import { Content } from '../elements/Content';
import { Paragraph } from '../elements/Paragraph';
import { Title } from '../elements/Title';
import { validColors } from '../helpers/useBulmaClasses';

/** A pane's worth of words, so there's something to see it resize. */
const words = (title: string) => (
  <Content p="4">
    <h4>{title}</h4>
    <p>
      Drag the handle, or tab to it and use the arrow keys. Shift moves ten
      times as far, and Home and End go to the limits.
    </p>
  </Content>
);

const meta: Meta<typeof Splitter> = {
  title: 'Components/Splitter',
  component: Splitter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Panes side by side or one above the other, with a handle between each pair to drag or move by keyboard. Each handle is a focusable separator named by the label of the pane it speaks for. Sizes are percentages, limits take px and rem too, and a collapsible pane shuts when dragged below half its minimum or with Enter on its handle.',
      },
    },
  },
  args: {
    height: 320,
    className: 'box p-0',
    children: [
      <Splitter.Pane key="files" label="Files" defaultSize={25} minSize="10rem">
        {words('Files')}
      </Splitter.Pane>,
      <Splitter.Pane key="editor" label="Editor">
        {words('Editor')}
      </Splitter.Pane>,
    ],
  },
  argTypes: {
    children: {
      control: false,
      description:
        'Splitter.Panes, two or more, with a handle between each pair',
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description:
        'The way the panes run: side by side, or one above the other',
    },
    height: {
      control: 'text',
      description:
        'The splitter’s height: a number in pixels or any CSS length; a vertical one needs one',
    },
    sizes: {
      control: false,
      description: 'Each pane’s size in percent, to hold them yourself',
    },
    onSizesChange: {
      action: 'sizes changed',
      description: 'Called with every pane’s size whenever they change',
    },
    step: {
      control: 'number',
      description:
        'How far an arrow key moves a handle, in percent; Shift moves ten times as far',
    },
    textColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Text color helper',
    },
    bgColor: {
      control: 'select',
      options: [...validColors, 'inherit', 'current'],
      description: 'Background color helper',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Splitter>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('separator', { name: 'Files' });
    await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    await expect(handle).toHaveAttribute('aria-valuenow', '25');
    handle.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(handle).toHaveAttribute('aria-valuenow', '26');
  },
};

export const CompoundUsage: Story = {
  render: function CompoundUsageExample() {
    return (
      <Splitter height={280} className="box p-0">
        <Splitter.Pane label="Folders" defaultSize={20} minSize={10}>
          {words('Folders')}
        </Splitter.Pane>
        <Splitter.Pane label="Messages" defaultSize={30} minSize={20}>
          {words('Messages')}
        </Splitter.Pane>
        <Splitter.Pane label="Message">{words('Message')}</Splitter.Pane>
      </Splitter>
    );
  },
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    height: 400,
    children: [
      <Splitter.Pane key="query" label="Query" defaultSize={40} minSize="5rem">
        {words('Query')}
      </Splitter.Pane>,
      <Splitter.Pane key="results" label="Results">
        {words('Results')}
      </Splitter.Pane>,
    ],
  },
};

export const CollapsibleInspector: Story = {
  render: function CollapsibleInspectorExample() {
    const [hidden, setHidden] = useState(false);
    return (
      <>
        <Button size="small" mb="3" onClick={() => setHidden(h => !h)}>
          {hidden ? 'Show inspector' : 'Hide inspector'}
        </Button>
        <Splitter height={300} className="box p-0">
          <Splitter.Pane label="Canvas">{words('Canvas')}</Splitter.Pane>
          <Splitter.Pane
            label="Inspector"
            defaultSize={30}
            minSize="14rem"
            collapsible
            collapsed={hidden}
            onCollapsedChange={setHidden}
          >
            {words('Inspector')}
          </Splitter.Pane>
        </Splitter>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('separator', { name: 'Inspector' });
    handle.focus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('button')).toHaveTextContent(
      'Show inspector'
    );
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('button')).toHaveTextContent(
      'Hide inspector'
    );
  },
};

export const Nested: Story = {
  render: function NestedExample() {
    return (
      <Splitter height={360} className="box p-0">
        <Splitter.Pane label="Sidebar" defaultSize={25} minSize="10rem">
          <Menu p="3">
            <Menu.Label>Project</Menu.Label>
            <Menu.List>
              <Menu.Item href="#readme">README.md</Menu.Item>
              <Menu.Item href="#app">App.tsx</Menu.Item>
            </Menu.List>
          </Menu>
        </Splitter.Pane>
        <Splitter.Pane label="Main">
          <Splitter orientation="vertical" height="100%">
            <Splitter.Pane label="Code" defaultSize={65}>
              {words('Code')}
            </Splitter.Pane>
            <Splitter.Pane label="Terminal">{words('Terminal')}</Splitter.Pane>
          </Splitter>
        </Splitter.Pane>
      </Splitter>
    );
  },
};

export const ScrollingPanes: Story = {
  render: function ScrollingPanesExample() {
    const lines = Array.from({ length: 30 }, (_, i) => (
      <p key={i}>Line {i + 1} of a long list that scrolls in its pane.</p>
    ));
    return (
      <Splitter height={260} className="box p-0">
        <Splitter.Pane label="List" defaultSize={40}>
          <ScrollArea height="100%" aria-label="List">
            <Content p="4">{lines}</Content>
          </ScrollArea>
        </Splitter.Pane>
        <Splitter.Pane label="Detail">
          <ScrollArea height="100%" aria-label="Detail">
            <Content p="4">{lines}</Content>
          </ScrollArea>
        </Splitter.Pane>
      </Splitter>
    );
  },
};

export const SavedSizes: Story = {
  render: function SavedSizesExample() {
    const [sizes, setSizes] = useState([35, 65]);
    return (
      <>
        <Paragraph mb="3">
          Sizes: {sizes.map(size => `${Math.round(size)}%`).join(' and ')}
        </Paragraph>
        <Splitter
          height={240}
          className="box p-0"
          sizes={sizes}
          onSizesChange={setSizes}
        >
          <Splitter.Pane label="Filters" minSize={20}>
            {words('Filters')}
          </Splitter.Pane>
          <Splitter.Pane label="Results">{words('Results')}</Splitter.Pane>
        </Splitter>
      </>
    );
  },
};

export const RightToLeft: Story = {
  render: function RightToLeftExample() {
    return (
      <div dir="rtl">
        <Title as="h2" textSize="6">
          الملفات أولاً، على اليمين
        </Title>
        <Splitter height={240} className="box p-0">
          <Splitter.Pane label="الملفات" defaultSize={30}>
            {words('الملفات')}
          </Splitter.Pane>
          <Splitter.Pane label="المحرر">{words('المحرر')}</Splitter.Pane>
        </Splitter>
      </div>
    );
  },
};
