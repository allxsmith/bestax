import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { TreeView } from './TreeView';
import { Menu } from './Menu';
import { Block } from '../elements/Block';
import { Button } from '../elements/Button';
import { Buttons } from '../elements/Buttons';
import { Content } from '../elements/Content';
import { Paragraph } from '../elements/Paragraph';
import { Title } from '../elements/Title';
import { Column } from '../columns/Column';
import { Columns } from '../columns/Columns';
import { validColors } from '../helpers/useBulmaClasses';

interface FileNode {
  id: string;
  name: string;
  children?: FileNode[];
}

const FILES: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    children: [
      {
        id: 'src/components',
        name: 'components',
        children: [
          { id: 'src/components/Button.tsx', name: 'Button.tsx' },
          { id: 'src/components/Card.tsx', name: 'Card.tsx' },
          { id: 'src/components/TreeView.tsx', name: 'TreeView.tsx' },
        ],
      },
      {
        id: 'src/helpers',
        name: 'helpers',
        children: [{ id: 'src/helpers/classNames.ts', name: 'classNames.ts' }],
      },
      { id: 'src/index.ts', name: 'index.ts' },
    ],
  },
  {
    id: 'docs',
    name: 'docs',
    children: [{ id: 'docs/intro.md', name: 'intro.md' }],
  },
  { id: 'package.json', name: 'package.json' },
  { id: 'README.md', name: 'README.md' },
];

/** Keeps a story's tree to about a sidebar's width. */
function Narrow({ children }: { children: React.ReactNode }) {
  return (
    <Columns>
      <Column size="one-third">{children}</Column>
    </Columns>
  );
}

/** The app's data mapped to items, one level at a time. */
function FileItems({ nodes }: { nodes: FileNode[] }) {
  return (
    <>
      {nodes.map(node => (
        <TreeView.Item
          key={node.id}
          value={node.id}
          label={node.name}
          icon={node.children ? 'folder' : 'file'}
        >
          {node.children && <FileItems nodes={node.children} />}
        </TreeView.Item>
      ))}
    </>
  );
}

const meta: Meta<typeof TreeView> = {
  title: 'Components/TreeView',
  component: TreeView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A tree of items you browse and pick from, the way a file explorer works: one tab stop, the arrow keys to move, and Right and Left to open and close. It looks like Bulma’s menu, but it isn’t for site navigation: items aren’t links, and a sidebar is `Menu`’s job. An item is picked one at a time with `selectionMode="single"`, or checked with boxes and mixed parents with `selectionMode="checkbox"`, or neither.',
      },
    },
  },
  args: {
    'aria-label': 'Files',
    defaultExpanded: ['src', 'src/components'],
  },
  argTypes: {
    children: {
      control: false,
      description:
        'TreeView.Items, nested inside each other for their children; render them whether the item is open or not',
    },
    selectionMode: {
      control: 'inline-radio',
      options: ['none', 'single', 'checkbox'],
      description:
        'none picks nothing; single picks one item with Enter, Space or a click; checkbox checks any number, with mixed parents',
    },
    selected: {
      control: 'text',
      description:
        'The selected item’s value when you hold the state, or null for none; read with single only',
    },
    defaultSelected: {
      control: 'text',
      description:
        'The item selected to begin with, when the tree holds its own state; read with single only',
    },
    onSelectedChange: {
      action: 'selectedChange',
      description:
        'Called with the value of the item picked; not for the one already selected, and never from moving focus',
    },
    checked: {
      control: 'object',
      description:
        'The checked values when you hold the state; read with checkbox only, and a parent’s value stands for its whole branch',
    },
    defaultChecked: {
      control: 'object',
      description:
        'The values checked to begin with, when the tree holds its own state; read with checkbox only',
    },
    onCheckedChange: {
      action: 'checkedChange',
      description:
        'Called after a check or an uncheck with every item that shows checked, parents included, plus values the tree doesn’t know',
    },
    expanded: {
      control: 'object',
      description:
        'The open items’ values when you hold the state; a value stays while its parent is closed',
    },
    defaultExpanded: {
      control: 'object',
      description: 'The items open to begin with',
    },
    onExpandedChange: {
      action: 'expandedChange',
      description:
        'Called with the new list whenever an item opens or closes, * included',
    },
    size: {
      control: 'inline-radio',
      options: [undefined, 'small', 'medium', 'large'],
      description: 'The text size, as Bulma’s menu sizes it',
    },
    color: {
      control: 'select',
      options: [undefined, ...validColors],
      description: 'Text color helper',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
  },
  render: args => (
    <Narrow>
      <TreeView {...args}>
        <FileItems nodes={FILES} />
      </TreeView>
    </Narrow>
  ),
};

export default meta;
type Story = StoryObj<typeof TreeView>;

export const Default: Story = {};

export const FileBrowser: Story = {
  render: function FileBrowserExample() {
    const [file, setFile] = useState<string | null>('src/components/Card.tsx');
    return (
      <Columns>
        <Column size="one-third">
          <TreeView
            aria-label="Files"
            selectionMode="single"
            selected={file}
            onSelectedChange={setFile}
            defaultExpanded={['src', 'src/components']}
          >
            <FileItems nodes={FILES} />
          </TreeView>
        </Column>
        <Column>
          <Content>
            {file ? <p>Showing {file}</p> : <p>Pick a file.</p>}
          </Content>
        </Column>
      </Columns>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole('treeitem', { name: 'Card.tsx' });
    await expect(card).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(canvas.getByRole('treeitem', { name: 'index.ts' }));
    await expect(canvas.getByText('Showing src/index.ts')).toBeInTheDocument();
  },
};

export const Permissions: Story = {
  render: function PermissionsExample() {
    const [checked, setChecked] = useState<string[]>(['projects/read']);
    return (
      <Narrow>
        <Buttons size="small">
          <Button onClick={() => setChecked(['projects', 'billing'])}>
            Check all
          </Button>
          <Button onClick={() => setChecked([])}>Clear</Button>
        </Buttons>
        <TreeView
          aria-label="Permissions"
          selectionMode="checkbox"
          checked={checked}
          onCheckedChange={setChecked}
          defaultExpanded={['projects']}
        >
          <TreeView.Item value="projects" label="Projects">
            <TreeView.Item value="projects/read" label="Read" />
            <TreeView.Item value="projects/write" label="Write" />
            <TreeView.Item value="projects/delete" label="Delete" disabled />
          </TreeView.Item>
          <TreeView.Item value="billing" label="Billing">
            <TreeView.Item value="billing/view" label="View invoices" />
            <TreeView.Item value="billing/pay" label="Pay invoices" />
          </TreeView.Item>
        </TreeView>
        <Paragraph mt="3" textSize="7">
          Checked: {checked.length ? checked.join(', ') : 'nothing'}
        </Paragraph>
      </Narrow>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const projects = canvas.getByRole('treeitem', { name: 'Projects' });
    await expect(projects).toHaveAttribute('aria-checked', 'mixed');
    await userEvent.click(canvas.getByRole('treeitem', { name: 'Billing' }));
    await expect(
      canvas.getByRole('treeitem', { name: 'Billing' })
    ).toHaveAttribute('aria-checked', 'true');
  },
};

interface Folder {
  id: string;
  name: string;
  hasFolders: boolean;
}

/** A pretend server: each folder holds two more, three levels down. */
function listFolders(id: string): Promise<Folder[]> {
  const depth = id.split('/').length;
  return new Promise(resolve =>
    setTimeout(
      () =>
        resolve(
          ['a', 'b'].map(name => ({
            id: `${id}/${name}`,
            name: `Folder ${name.toUpperCase()}`,
            hasFolders: depth < 3,
          }))
        ),
      800
    )
  );
}

function FolderItem({
  folder,
  expanded,
}: {
  folder: Folder;
  expanded: string[];
}) {
  const open = expanded.includes(folder.id);
  const [children, setChildren] = useState<Folder[] | null>(null);

  useEffect(() => {
    if (!open || children) return undefined;
    let current = true;
    listFolders(folder.id).then(found => {
      if (current) setChildren(found);
    });
    return () => {
      current = false;
    };
  }, [open, children, folder.id]);

  return (
    <TreeView.Item
      value={folder.id}
      label={folder.name}
      icon="folder"
      hasChildren={folder.hasFolders}
    >
      {children
        ? children.map(child => (
            <FolderItem key={child.id} folder={child} expanded={expanded} />
          ))
        : open && (
            <TreeView.Item
              value={`${folder.id}:loading`}
              label="Loading…"
              disabled
            />
          )}
    </TreeView.Item>
  );
}

export const LazyFolders: Story = {
  render: function LazyFoldersExample() {
    const [expanded, setExpanded] = useState<string[]>([]);
    return (
      <Narrow>
        <TreeView
          aria-label="Folders"
          expanded={expanded}
          onExpandedChange={setExpanded}
        >
          <FolderItem
            folder={{ id: 'home', name: 'Home', hasFolders: true }}
            expanded={expanded}
          />
          <FolderItem
            folder={{ id: 'shared', name: 'Shared', hasFolders: true }}
            expanded={expanded}
          />
        </TreeView>
      </Narrow>
    );
  },
};

const OUTLINE = ['company', 'company/engineering', 'company/sales'];

export const Outline: Story = {
  render: function OutlineExample() {
    const [expanded, setExpanded] = useState<string[]>(['company']);
    return (
      <Narrow>
        <Buttons size="small">
          <Button onClick={() => setExpanded(OUTLINE)}>Expand all</Button>
          <Button onClick={() => setExpanded([])}>Collapse all</Button>
        </Buttons>
        <TreeView
          aria-label="Org chart"
          expanded={expanded}
          onExpandedChange={setExpanded}
        >
          <TreeView.Item value="company" label="Ada Lovelace, CEO">
            <TreeView.Item
              value="company/engineering"
              label="Grace Hopper, Engineering"
            >
              <TreeView.Item value="eng/1" label="Alan Turing" />
              <TreeView.Item value="eng/2" label="Katherine Johnson" />
            </TreeView.Item>
            <TreeView.Item value="company/sales" label="Hedy Lamarr, Sales">
              <TreeView.Item value="sales/1" label="Mary Jackson" />
            </TreeView.Item>
          </TreeView.Item>
        </TreeView>
      </Narrow>
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <Columns isMultiline>
      {([undefined, 'small', 'medium', 'large'] as const).map(size => (
        <Column key={size ?? 'normal'} size="half">
          <Title as="h3" size="6">
            {size ?? 'normal'}
          </Title>
          <TreeView
            aria-label={`Files, ${size ?? 'normal'}`}
            size={size}
            selectionMode="single"
            defaultSelected="src/index.ts"
            defaultExpanded={['src']}
          >
            <FileItems nodes={FILES} />
          </TreeView>
        </Column>
      ))}
    </Columns>
  ),
};

/** The same rows as a Bulma menu, for comparing the two. */
export const BesideBulmaMenu: Story = {
  render: () => (
    <Columns isMobile>
      <Column>
        <Title as="h3" size="6">
          Bulma menu
        </Title>
        <Menu>
          <Menu.List>
            <Menu.Item href="#src">
              src
              <Menu.List>
                <Menu.Item href="#components">
                  components
                  <Menu.List>
                    <Menu.Item href="#button">Button.tsx</Menu.Item>
                    <Menu.Item href="#card" active>
                      Card.tsx
                    </Menu.Item>
                  </Menu.List>
                </Menu.Item>
                <Menu.Item href="#helpers">helpers</Menu.Item>
              </Menu.List>
            </Menu.Item>
            <Menu.Item href="#package">package.json</Menu.Item>
          </Menu.List>
        </Menu>
      </Column>
      <Column>
        <Title as="h3" size="6">
          TreeView
        </Title>
        <TreeView
          aria-label="Files"
          selectionMode="single"
          defaultSelected="card"
          defaultExpanded={['src', 'components']}
        >
          <TreeView.Item value="src" label="src">
            <TreeView.Item value="components" label="components">
              <TreeView.Item value="button" label="Button.tsx" />
              <TreeView.Item value="card" label="Card.tsx" />
            </TreeView.Item>
            <TreeView.Item value="helpers" label="helpers">
              <TreeView.Item value="classNames" label="classNames.ts" />
            </TreeView.Item>
          </TreeView.Item>
          <TreeView.Item value="package" label="package.json" />
        </TreeView>
      </Column>
    </Columns>
  ),
};

/** A tree under a menu label, beside the menu's own navigation. */
export const InAMenu: Story = {
  render: () => (
    <Narrow>
      <Menu>
        <Menu.Label>Pages</Menu.Label>
        <Menu.List>
          <Menu.Item href="#overview" active>
            Overview
          </Menu.Item>
          <Menu.Item href="#settings">Settings</Menu.Item>
        </Menu.List>
        <Menu.Label id="files-label">Files</Menu.Label>
        <TreeView
          aria-labelledby="files-label"
          selectionMode="single"
          defaultExpanded={['src']}
        >
          <FileItems nodes={FILES} />
        </TreeView>
      </Menu>
    </Narrow>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <Block dir="rtl">
      <Narrow>
        <TreeView
          aria-label="Files"
          selectionMode="single"
          defaultSelected="src/index.ts"
          defaultExpanded={['src']}
        >
          <FileItems nodes={FILES} />
        </TreeView>
      </Narrow>
    </Block>
  ),
};

/** Depth, a disabled item and icons, in a checkbox tree. */
export const DeepTree: Story = {
  render: () => (
    <Narrow>
      <TreeView
        aria-label="Settings"
        selectionMode="checkbox"
        defaultChecked={['a/b/c/d1']}
        defaultExpanded={['a', 'a/b', 'a/b/c']}
      >
        <TreeView.Item value="a" label="Workspace" icon="building">
          <TreeView.Item value="a/b" label="Team" icon="users">
            <TreeView.Item value="a/b/c" label="Project" icon="folder">
              <TreeView.Item value="a/b/c/d1" label="Read" icon="eye" />
              <TreeView.Item value="a/b/c/d2" label="Write" icon="pen" />
              <TreeView.Item
                value="a/b/c/d3"
                label="Delete"
                icon="trash"
                disabled
              />
            </TreeView.Item>
          </TreeView.Item>
          <TreeView.Item value="a/x" label="Billing" icon="credit-card">
            <TreeView.Item value="a/x/1" label="View invoices" />
          </TreeView.Item>
        </TreeView.Item>
      </TreeView>
    </Narrow>
  ),
};

export const CompoundUsage: Story = {
  render: () => (
    <Narrow>
      <TreeView
        aria-label="Files"
        selectionMode="single"
        defaultExpanded={['src']}
      >
        <TreeView.Item value="src" label="src" icon="folder">
          <TreeView.Item value="src/index.ts" label="index.ts" icon="file" />
          <TreeView.Item value="src/App.tsx" label="App.tsx" icon="file" />
        </TreeView.Item>
        <TreeView.Item value="package.json" label="package.json" icon="file" />
      </TreeView>
    </Narrow>
  ),
};
