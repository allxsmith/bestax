import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Collapses } from './Collapses';
import { Collapse } from './Collapse';
import { Block } from '../elements/Block';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Icon } from '../elements/Icon';
import { Paragraph } from '../elements/Paragraph';
import { Strong } from '../elements/Strong';

const sections = [
  {
    title: 'Shipping',
    body: 'Orders leave the warehouse within two business days.',
  },
  {
    title: 'Returns',
    body: 'Send anything back within 30 days for a full refund.',
  },
  {
    title: 'Warranty',
    body: 'Every product carries a one-year warranty against defects.',
  },
];

const meta: Meta<typeof Collapses> = {
  title: 'Components/Collapses',
  component: Collapses,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Groups `Collapse` items into an accordion: one item open at a time, or any number with `multiple`. Items are addressed by index.',
      },
    },
  },
  argTypes: {
    multiple: {
      control: 'boolean',
      description:
        'Lets items open independently. Without it, opening one item closes the others. Default `false`.',
    },
    seamless: {
      control: 'boolean',
      description:
        'Joins the items into one block, with no gap between them and only the outer corners rounded. The joins show on `bordered` items.',
    },
    value: {
      control: false,
      description:
        'Controlled open items: an index or `null` in single mode, an array of indexes with `multiple`.',
    },
    defaultValue: {
      control: false,
      description:
        'Open items for uncontrolled use: an index or `null` (the default) in single mode, an array of indexes with `multiple`.',
    },
    onChange: {
      control: false,
      description:
        'Called with the new open items each time a trigger asks for a change, controlled or not.',
    },
  },
};
export default meta;
type Story = StoryObj<typeof Collapses>;

/** A trigger row whose chevron turns as its item opens (`.collapse-trigger-icon`). */
function ItemTrigger({ title }: { title: string }) {
  return (
    <Block display="flex" alignItems="center" p="4">
      <Icon
        name="chevron-right"
        variant="solid"
        className="collapse-trigger-icon"
        aria-hidden="true"
      />
      <Strong>{title}</Strong>
    </Block>
  );
}

/**
 * The accordion: opening one item closes the others. `defaultValue` picks the
 * item that starts open.
 */
export const Default: Story = {
  render: function DefaultExample() {
    return (
      <Collapses defaultValue={0}>
        {sections.map(s => (
          <Collapse
            key={s.title}
            bordered
            trigger={<ItemTrigger title={s.title} />}
          >
            <Paragraph p="4">{s.body}</Paragraph>
          </Collapse>
        ))}
      </Collapses>
    );
  },
};

/**
 * With `multiple`, items open and close independently and the open items are
 * an array of indexes.
 */
export const Multiple: Story = {
  render: function MultipleExample() {
    return (
      <Collapses multiple defaultValue={[0, 2]}>
        {sections.map(s => (
          <Collapse
            key={s.title}
            bordered
            trigger={<ItemTrigger title={s.title} />}
          >
            <Paragraph p="4">{s.body}</Paragraph>
          </Collapse>
        ))}
      </Collapses>
    );
  },
};

/**
 * `seamless` joins bordered items into one block.
 */
export const Seamless: Story = {
  render: function SeamlessExample() {
    return (
      <Collapses seamless defaultValue={1}>
        {sections.map(s => (
          <Collapse
            key={s.title}
            bordered
            trigger={<ItemTrigger title={s.title} />}
          >
            <Paragraph p="4">{s.body}</Paragraph>
          </Collapse>
        ))}
      </Collapses>
    );
  },
};

/**
 * Controlled with `value` and `onChange`, the way `Tabs` is. The buttons and the
 * triggers change the same state.
 */
export const Controlled: Story = {
  render: function ControlledExample() {
    const [open, setOpen] = useState<number[]>([]);
    return (
      <Block>
        <Buttons>
          <Button onClick={() => setOpen(sections.map((_, i) => i))}>
            Open all
          </Button>
          <Button onClick={() => setOpen([])}>Close all</Button>
        </Buttons>
        <Paragraph mb="4">
          Open: {open.length ? open.join(', ') : 'none'}
        </Paragraph>
        <Collapses multiple value={open} onChange={setOpen}>
          {sections.map(s => (
            <Collapse
              key={s.title}
              bordered
              trigger={<ItemTrigger title={s.title} />}
            >
              <Paragraph p="4">{s.body}</Paragraph>
            </Collapse>
          ))}
        </Collapses>
      </Block>
    );
  },
};

/**
 * A child that sets its own `open` stays under its own control: the group
 * neither opens nor closes it.
 */
export const ItemWithItsOwnState: Story = {
  render: function ItemWithItsOwnStateExample() {
    const [pinned, setPinned] = useState(true);
    return (
      <Collapses defaultValue={0}>
        <Collapse bordered trigger={<ItemTrigger title="Shipping" />}>
          <Paragraph p="4">{sections[0].body}</Paragraph>
        </Collapse>
        <Collapse
          bordered
          open={pinned}
          onOpenChange={setPinned}
          trigger={<ItemTrigger title="Pinned notes (its own state)" />}
        >
          <Paragraph p="4">
            Opening another item does not close this one.
          </Paragraph>
        </Collapse>
        <Collapse bordered trigger={<ItemTrigger title="Returns" />}>
          <Paragraph p="4">{sections[1].body}</Paragraph>
        </Collapse>
      </Collapses>
    );
  },
};

/**
 * `Collapses.Collapse` is the same component as `Collapse`, handy when you
 * import only the group.
 */
export const CompoundUsage: Story = {
  render: function CompoundUsageExample() {
    return (
      <Collapses defaultValue={0}>
        {sections.map(s => (
          <Collapses.Collapse
            key={s.title}
            bordered
            trigger={<ItemTrigger title={s.title} />}
          >
            <Paragraph p="4">{s.body}</Paragraph>
          </Collapses.Collapse>
        ))}
      </Collapses>
    );
  },
};
