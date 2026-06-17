import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Collapse } from './Collapse';
import { Card } from './Card';
import { Panel } from './Panel';
import { Icon } from '../elements/Icon';
import { Box } from '../elements/Box';
import { Notification } from '../elements/Notification';
import { Block } from '../elements/Block';
import { Button } from '../elements/Button';
import { LinkButton } from '../elements/LinkButton';
import { Title } from '../elements/Title';
import { Paragraph } from '../elements/Paragraph';
import { Span } from '../elements/Span';
import { UnorderedList } from '../elements/UnorderedList';
import { ListItem } from '../elements/ListItem';
import { Content } from '../elements/Content';

const meta: Meta<typeof Collapse> = {
  title: 'Components/Collapse',
  component: Collapse,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An expandable/collapsible content panel. Commonly used for accordions, FAQs, and content that should be hidden by default.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controlled open state',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Initial open state for uncontrolled usage',
    },
    animation: {
      control: 'select',
      options: ['fade', 'slide', false],
      description:
        "Animation type: 'fade' for opacity transition, 'slide' for height transition, false to disable",
    },
    position: {
      control: 'select',
      options: ['top', 'bottom'],
      description: 'Position of trigger relative to content',
    },
    bordered: {
      control: 'boolean',
      description: 'Whether to show a border around the collapse',
    },
    trigger: {
      description: 'The clickable trigger element',
    },
    children: {
      description: 'The collapsible content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Collapse>;

// Simple trigger component
const SimpleTrigger = ({
  text,
  isOpen,
}: {
  text: string;
  isOpen?: boolean;
}) => (
  <LinkButton display="flex" alignItems="center">
    <Span
      className="collapse-trigger-icon"
      style={{
        display: 'inline-flex',
        marginRight: '0.5rem',
        transition: 'transform 0.3s',
        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
      }}
    >
      <Icon name="chevron-right" variant="solid" />
    </Span>
    {text}
  </LinkButton>
);

/**
 * Basic collapse with default settings.
 */
export const Default: Story = {
  render: function DefaultCollapse() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Collapse
        trigger={<SimpleTrigger text="Click to expand" isOpen={isOpen} />}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
      >
        <Block>
          <Paragraph>
            This is the collapsible content. It can contain any React elements.
          </Paragraph>
          <Paragraph>Click the header again to collapse.</Paragraph>
        </Block>
      </Collapse>
    );
  },
};

/**
 * Collapse that starts open by default.
 */
export const DefaultOpen: Story = {
  render: function DefaultOpenCollapse() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <Collapse
        defaultOpen
        trigger={<SimpleTrigger text="This starts open" isOpen={isOpen} />}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
      >
        <Block>
          <Paragraph>
            This content is visible by default because defaultOpen is true.
          </Paragraph>
        </Block>
      </Collapse>
    );
  },
};

/**
 * Collapse with slide animation (height transition).
 */
export const SlideAnimation: Story = {
  render: function SlideAnimationCollapse() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Collapse
        animation="slide"
        trigger={<SimpleTrigger text="Slide animation" isOpen={isOpen} />}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
      >
        <Block>
          <Paragraph>
            This collapse uses a slide animation (height transition) to reveal
            content.
          </Paragraph>
        </Block>
      </Collapse>
    );
  },
};

/**
 * Collapse without animation.
 */
export const NoAnimation: Story = {
  render: function NoAnimationCollapse() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Collapse
        animation={false}
        trigger={<SimpleTrigger text="No animation" isOpen={isOpen} />}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
      >
        <Block>
          <Paragraph>
            This collapse has animation disabled. It will toggle instantly.
          </Paragraph>
        </Block>
      </Collapse>
    );
  },
};

/**
 * Collapse with trigger at the bottom.
 */
export const TriggerBottom: Story = {
  render: function TriggerBottomCollapse() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Collapse
        position="bottom"
        trigger={<SimpleTrigger text="Trigger at bottom" isOpen={isOpen} />}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
      >
        <Block>
          <Paragraph>
            The trigger is positioned below the content using
            position=&quot;bottom&quot;.
          </Paragraph>
        </Block>
      </Collapse>
    );
  },
};

/**
 * Controlled collapse with external state management.
 */
export const Controlled: Story = {
  render: function ControlledCollapse() {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <Block display="flex" alignItems="center">
          <Button color="primary" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? 'Close' : 'Open'} Collapse
          </Button>
          <Span ml="4">State: {isOpen ? 'Open' : 'Closed'}</Span>
        </Block>
        <Collapse
          open={isOpen}
          trigger={
            <Notification mb="4">
              Controlled collapse (click button above)
            </Notification>
          }
        >
          <Notification mb="4">
            <Paragraph>
              This collapse is controlled by external state.
            </Paragraph>
            <Paragraph>
              The trigger click doesn&apos;t toggle it — only the button above
              does.
            </Paragraph>
          </Notification>
        </Collapse>
      </div>
    );
  },
};

/**
 * Multiple collapses as an accordion.
 */
export const Accordion: Story = {
  render: function AccordionExample() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const items = [
      {
        title: 'Section 1',
        content: 'Content for section 1. This is some sample text.',
      },
      {
        title: 'Section 2',
        content: 'Content for section 2. You can put any content here.',
      },
      {
        title: 'Section 3',
        content: 'Content for section 3. Including images, forms, etc.',
      },
    ];

    return (
      <div>
        {items.map((item, index) => (
          <Collapse
            key={index}
            className="card"
            open={openIndex === index}
            trigger={
              <Card.Header
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <Card.Header.Title>{item.title}</Card.Header.Title>
                <Card.Header.Icon aria-label="toggle">
                  <Icon
                    name={openIndex === index ? 'minus' : 'plus'}
                    variant="solid"
                  />
                </Card.Header.Icon>
              </Card.Header>
            }
          >
            <Card.Content>
              <Paragraph>{item.content}</Paragraph>
            </Card.Content>
          </Collapse>
        ))}
      </div>
    );
  },
};

/**
 * Card-styled collapse.
 */
export const CardStyle: Story = {
  render: function CardStyleCollapse() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <Collapse
        className="card"
        defaultOpen
        trigger={
          <Card.Header>
            <Card.Header.Title>Card Collapse</Card.Header.Title>
            <Card.Header.Icon aria-label="toggle">
              <Icon name={isOpen ? 'angle-up' : 'angle-down'} variant="solid" />
            </Card.Header.Icon>
          </Card.Header>
        }
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
      >
        <Card.Content>
          <Paragraph>
            This collapse is styled like a card with shadow and padding.
          </Paragraph>
          <Paragraph>Perfect for FAQ sections or settings panels.</Paragraph>
        </Card.Content>
      </Collapse>
    );
  },
};

/**
 * Collapse with rich content.
 */
export const RichContent: Story = {
  render: function RichContentCollapse() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Collapse
        trigger={
          <SimpleTrigger text="Click to see rich content" isOpen={isOpen} />
        }
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
      >
        <Block mt="4">
          <Box>
            <Content>
              <Title size="5">Rich Content Example</Title>
              <Paragraph>
                The collapse content can contain any React elements:
              </Paragraph>
              <UnorderedList>
                <ListItem>Text and paragraphs</ListItem>
                <ListItem>Images and media</ListItem>
                <ListItem>Forms and inputs</ListItem>
                <ListItem>Other components</ListItem>
              </UnorderedList>
              <Block>
                <Button color="info">Action Button</Button>
              </Block>
            </Content>
          </Box>
        </Block>
      </Collapse>
    );
  },
};

/**
 * Collapse with a ghost-styled trigger.
 */
export const GhostTrigger: Story = {
  render: function GhostTriggerCollapse() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Collapse
        trigger={
          <LinkButton
            variant="ghost"
            display="flex"
            alignItems="center"
            textWeight="semibold"
          >
            <Span
              className="collapse-trigger-icon"
              style={{
                display: 'inline-flex',
                marginRight: '0.5rem',
                transition: 'transform 0.3s',
                transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              <Icon name="chevron-right" variant="solid" />
            </Span>
            Ghost trigger style
          </LinkButton>
        }
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
      >
        <Block mt="4">
          <Paragraph>
            This collapse uses a ghost-styled LinkButton as the trigger, which
            shows a subtle hover background instead of appearing as plain text.
          </Paragraph>
        </Block>
      </Collapse>
    );
  },
};

/**
 * FAQ example with multiple collapses.
 */
export const FAQExample: Story = {
  render: function FAQCollapse() {
    const faqs = [
      {
        question: 'What is Bestax?',
        answer:
          'Bestax is a React component library built on top of Bulma CSS framework.',
      },
      {
        question: 'How do I install it?',
        answer:
          'You can install Bestax via npm: npm install @allxsmith/bestax-bulma',
      },
      {
        question: 'Is it free to use?',
        answer: 'Yes, Bestax is open source and free to use in your projects.',
      },
    ];

    const [openStates, setOpenStates] = useState<boolean[]>(
      faqs.map(() => false)
    );

    const toggle = (index: number) => {
      setOpenStates(prev =>
        prev.map((state, i) => (i === index ? !state : state))
      );
    };

    return (
      <div>
        <Title size="4">Frequently Asked Questions</Title>

        {faqs.map((faq, index) => (
          <Collapse
            key={index}
            className="card"
            open={openStates[index]}
            trigger={
              <Card.Header onClick={() => toggle(index)}>
                <Card.Header.Title>{faq.question}</Card.Header.Title>
                <Card.Header.Icon aria-label="toggle">
                  <Icon
                    name={openStates[index] ? 'chevron-up' : 'chevron-down'}
                    variant="solid"
                  />
                </Card.Header.Icon>
              </Card.Header>
            }
          >
            <Card.Content>
              <Paragraph textColor="grey">{faq.answer}</Paragraph>
            </Card.Content>
          </Collapse>
        ))}
      </div>
    );
  },
};

/**
 * Nested collapses using card styling.
 */
export const Nested: Story = {
  render: function NestedCollapse() {
    const [outerOpen, setOuterOpen] = useState(true);
    const [innerOpen, setInnerOpen] = useState(false);

    return (
      <Collapse
        className="card"
        defaultOpen
        trigger={
          <Card.Header onClick={() => setOuterOpen(!outerOpen)}>
            <Card.Header.Title>Outer Collapse</Card.Header.Title>
            <Card.Header.Icon aria-label="toggle">
              <Icon
                name={outerOpen ? 'angle-up' : 'angle-down'}
                variant="solid"
              />
            </Card.Header.Icon>
          </Card.Header>
        }
        onOpen={() => setOuterOpen(true)}
        onClose={() => setOuterOpen(false)}
      >
        <Card.Content>
          <Block>
            <Paragraph>This is the outer collapse content.</Paragraph>
          </Block>
          <Collapse
            className="card"
            trigger={
              <Card.Header onClick={() => setInnerOpen(!innerOpen)}>
                <Card.Header.Title>Inner Collapse</Card.Header.Title>
                <Card.Header.Icon aria-label="toggle">
                  <Icon
                    name={innerOpen ? 'angle-up' : 'angle-down'}
                    variant="solid"
                  />
                </Card.Header.Icon>
              </Card.Header>
            }
            onOpen={() => setInnerOpen(true)}
            onClose={() => setInnerOpen(false)}
          >
            <Card.Content>
              <Paragraph>
                This is a nested collapse inside the outer one.
              </Paragraph>
            </Card.Content>
          </Collapse>
        </Card.Content>
      </Collapse>
    );
  },
};

/**
 * Panel with collapsible content, similar to Bulma's panel example.
 */
export const PanelCollapse: Story = {
  render: function PanelCollapseExample() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searchValue, setSearchValue] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const tabs = ['All', 'Active', 'Archived', 'Drafts', 'Shared'];

    const projects = [
      { name: 'bestax-components', icon: 'folder' },
      { name: 'design-system', icon: 'folder' },
      { name: 'api-documentation', icon: 'file-alt' },
      { name: 'user-dashboard', icon: 'code-branch' },
      { name: 'mobile-app-prototype', icon: 'code-branch' },
    ];

    return (
      <Panel color="primary">
        <Collapse
          open={isOpen}
          animation="slide"
          trigger={
            <Panel.Heading
              style={{ cursor: 'pointer' }}
              onClick={() => setIsOpen(!isOpen)}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                Projects
                <Icon
                  name={isOpen ? 'angle-up' : 'angle-down'}
                  variant="solid"
                />
              </span>
            </Panel.Heading>
          }
        >
          <Panel.InputBlock
            placeholder="Search"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
          />
          <Panel.Tabs>
            {tabs.map(tab => (
              <a
                key={tab}
                className={activeTab === tab.toLowerCase() ? 'is-active' : ''}
                onClick={() => setActiveTab(tab.toLowerCase())}
              >
                {tab}
              </a>
            ))}
          </Panel.Tabs>
          {projects.map(project => (
            <Panel.Block key={project.name}>
              <Panel.Icon name={project.icon} variant="solid" />
              {project.name}
            </Panel.Block>
          ))}
          <Panel.CheckboxBlock
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
          >
            show archived
          </Panel.CheckboxBlock>
          <Panel.ButtonBlock onClick={() => setSearchValue('')}>
            Clear filters
          </Panel.ButtonBlock>
        </Collapse>
      </Panel>
    );
  },
};
