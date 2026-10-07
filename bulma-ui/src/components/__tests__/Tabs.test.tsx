import { act, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import Tabs, {
  Tab,
  TabList,
  TabItem,
  TabsContent,
  TabContentItem,
  type TabsProps,
} from '../Tabs';
import { ConfigProvider } from '../../helpers/Config';
import { resetColorDeprecationWarnings } from '../../helpers/colorDeprecations';

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  resetColorDeprecationWarnings();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe('Tabs', () => {
  describe('rendering', () => {
    it('renders tabs container with .tabs class', () => {
      render(
        <Tabs data-testid="tabs">
          <Tabs.List>
            <Tabs.Item>
              <a>Tab</a>
            </Tabs.Item>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tabs')).toHaveClass('tabs');
    });

    it('applies classPrefix when provided via ConfigProvider', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Tabs data-testid="tabs">
            <Tabs.List>
              <Tabs.Item>
                <a>Tab</a>
              </Tabs.Item>
            </Tabs.List>
          </Tabs>
        </ConfigProvider>
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveClass('bulma-tabs');
      expect(tabs).not.toHaveClass('tabs');
    });

    it('applies alignment, size, and modifiers', () => {
      render(
        <Tabs
          align="centered"
          size="large"
          fullwidth
          boxed
          toggle
          rounded
          data-testid="tabs"
        >
          <Tabs.List>
            <Tabs.Item>
              <a>Tab</a>
            </Tabs.Item>
          </Tabs.List>
        </Tabs>
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveClass('is-centered');
      expect(tabs).toHaveClass('is-large');
      expect(tabs).toHaveClass('is-fullwidth');
      expect(tabs).toHaveClass('is-boxed');
      expect(tabs).toHaveClass('is-toggle');
      expect(tabs).toHaveClass('is-toggle-rounded');
    });

    it('applies Bulma color', () => {
      render(
        <Tabs color="primary" data-testid="tabs">
          <Tabs.List>
            <Tabs.Item>
              <a>Tab</a>
            </Tabs.Item>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tabs')).toHaveClass('is-primary');
    });

    it('accepts custom className', () => {
      render(
        <Tabs className="custom-tabs" data-testid="tabs">
          <Tabs.List>
            <Tabs.Item>
              <a>Tab</a>
            </Tabs.Item>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tabs')).toHaveClass('custom-tabs');
    });

    it('renders children', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Item>
              <a data-testid="child">Tab</a>
            </Tabs.Item>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('applies Bulma helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Tabs color="primary" m="2" data-testid="tabs">
            <Tabs.List>
              <Tabs.Item>
                <a>Tab</a>
              </Tabs.Item>
            </Tabs.List>
          </Tabs>
        </ConfigProvider>
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveClass('bulma-tabs');
      expect(tabs).toHaveClass('bulma-is-primary');
      expect(tabs).toHaveClass('bulma-m-2');
    });
  });

  describe('uncontrolled mode', () => {
    it('defaults to index 0', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0}>First</Tabs.Tab>
            <Tabs.Tab index={1}>Second</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>Content 1</Tabs.Content.Item>
            <Tabs.Content.Item index={1}>Content 2</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByText('First').closest('li')).toHaveClass('is-active');
      expect(screen.getByText('Second').closest('li')).not.toHaveClass(
        'is-active'
      );
    });

    it('respects defaultValue', () => {
      render(
        <Tabs defaultValue={1}>
          <Tabs.List>
            <Tabs.Tab index={0}>First</Tabs.Tab>
            <Tabs.Tab index={1}>Second</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>Content 1</Tabs.Content.Item>
            <Tabs.Content.Item index={1}>Content 2</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByText('First').closest('li')).not.toHaveClass(
        'is-active'
      );
      expect(screen.getByText('Second').closest('li')).toHaveClass('is-active');
    });

    it('switches tab on click', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0}>First</Tabs.Tab>
            <Tabs.Tab index={1}>Second</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>Content 1</Tabs.Content.Item>
            <Tabs.Content.Item index={1}>Content 2</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );

      // Click the <a> inside the second tab
      fireEvent.click(screen.getByText('Second').closest('a')!);

      expect(screen.getByText('First').closest('li')).not.toHaveClass(
        'is-active'
      );
      expect(screen.getByText('Second').closest('li')).toHaveClass('is-active');
    });

    it('shows correct content panel', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0}>First</Tabs.Tab>
            <Tabs.Tab index={1}>Second</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>Content 1</Tabs.Content.Item>
            <Tabs.Content.Item index={1}>Content 2</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );

      // Content 1 should be visible, Content 2 hidden
      expect(
        screen.getByText('Content 1').closest('.tabs-content-item')
      ).toHaveClass('is-active');
      expect(
        screen.getByText('Content 2').closest('.tabs-content-item')
      ).not.toHaveClass('is-active');

      // Switch to tab 2
      fireEvent.click(screen.getByText('Second').closest('a')!);

      expect(
        screen.getByText('Content 1').closest('.tabs-content-item')
      ).not.toHaveClass('is-active');
      expect(
        screen.getByText('Content 2').closest('.tabs-content-item')
      ).toHaveClass('is-active');
    });
  });

  describe('controlled mode', () => {
    it('respects value prop', () => {
      render(
        <Tabs value={1}>
          <Tabs.List>
            <Tabs.Tab index={0}>First</Tabs.Tab>
            <Tabs.Tab index={1}>Second</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByText('First').closest('li')).not.toHaveClass(
        'is-active'
      );
      expect(screen.getByText('Second').closest('li')).toHaveClass('is-active');
    });

    it('calls onChange on tab click', () => {
      const handleChange = jest.fn();
      render(
        <Tabs value={0} onChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab index={0}>First</Tabs.Tab>
            <Tabs.Tab index={1}>Second</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );

      fireEvent.click(screen.getByText('Second').closest('a')!);
      expect(handleChange).toHaveBeenCalledWith(1);
    });

    it('does not change internal state when controlled', () => {
      const handleChange = jest.fn();
      render(
        <Tabs value={0} onChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab index={0}>First</Tabs.Tab>
            <Tabs.Tab index={1}>Second</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );

      fireEvent.click(screen.getByText('Second').closest('a')!);

      // Still tab 0 because value prop hasn't changed
      expect(screen.getByText('First').closest('li')).toHaveClass('is-active');
      expect(screen.getByText('Second').closest('li')).not.toHaveClass(
        'is-active'
      );
    });
  });

  describe('Tabs.List', () => {
    it('renders <ul> with role="tablist"', () => {
      render(
        <Tabs>
          <Tabs.List data-testid="tab-list">
            <Tabs.Tab index={0}>Tab</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      const list = screen.getByTestId('tab-list');
      expect(list.tagName.toLowerCase()).toBe('ul');
      expect(list).toHaveAttribute('role', 'tablist');
    });

    it('accepts custom className', () => {
      render(
        <Tabs>
          <Tabs.List className="custom-list" data-testid="tab-list">
            <Tabs.Tab index={0}>Tab</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tab-list')).toHaveClass('custom-list');
    });

    it('does not render an empty class attribute without a className', () => {
      render(
        <Tabs>
          <Tabs.List data-testid="tab-list">
            <Tabs.Tab index={0}>Tab</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tab-list')).not.toHaveAttribute('class');
    });
  });

  describe('Tabs.Tab', () => {
    it('renders li with role="tab"', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0} data-testid="tab">
              Label
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      const tab = screen.getByTestId('tab');
      expect(tab.tagName.toLowerCase()).toBe('li');
      expect(tab).toHaveAttribute('role', 'tab');
    });

    it('has aria-selected true when active', () => {
      render(
        <Tabs defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab index={0} data-testid="tab">
              Label
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tab')).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('has aria-selected false when inactive', () => {
      render(
        <Tabs defaultValue={1}>
          <Tabs.List>
            <Tabs.Tab index={0} data-testid="tab">
              Label
            </Tabs.Tab>
            <Tabs.Tab index={1}>Other</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tab')).toHaveAttribute(
        'aria-selected',
        'false'
      );
    });

    it('applies is-active class when active', () => {
      render(
        <Tabs defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab index={0} data-testid="tab">
              Label
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tab')).toHaveClass('is-active');
    });

    it('renders internal <a> element', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0} data-testid="tab">
              Label
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      const tab = screen.getByTestId('tab');
      expect(tab.querySelector('a')).toBeInTheDocument();
    });

    it('renders icon when icon prop is provided', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0} icon="image" data-testid="tab">
              Pictures
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      const tab = screen.getByTestId('tab');
      expect(tab.querySelector('.icon')).toBeInTheDocument();
    });

    it('does not activate when disabled', () => {
      const handleChange = jest.fn();
      render(
        <Tabs defaultValue={0} onChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab index={0}>First</Tabs.Tab>
            <Tabs.Tab index={1} disabled data-testid="disabled-tab">
              Second
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );

      fireEvent.click(screen.getByTestId('disabled-tab').querySelector('a')!);
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('sets tabIndex -1 when disabled', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0} disabled data-testid="tab">
              Disabled
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tab')).toHaveAttribute('tabIndex', '-1');
    });

    it('accepts custom className', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0} className="custom-tab" data-testid="tab">
              Tab
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tab')).toHaveClass('custom-tab');
    });

    it('does not render an empty class attribute when inactive and without a className', () => {
      render(
        <Tabs defaultValue={1}>
          <Tabs.List>
            <Tabs.Tab index={0} data-testid="tab">
              Tab
            </Tabs.Tab>
            <Tabs.Tab index={1}>Other</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tab')).not.toHaveAttribute('class');
    });
  });

  describe('Tabs.Item (backward compat)', () => {
    it('renders li and children', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Item data-testid="tab-item">
              <a>Tab</a>
            </Tabs.Item>
          </Tabs.List>
        </Tabs>
      );
      const item = screen.getByTestId('tab-item');
      expect(item.tagName.toLowerCase()).toBe('li');
      expect(item).toHaveTextContent('Tab');
    });

    it('applies is-active class when active', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Item active data-testid="tab-item">
              <a>Tab</a>
            </Tabs.Item>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tab-item')).toHaveClass('is-active');
    });

    it('accepts custom className', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Item className="custom-item" data-testid="tab-item">
              <a>Tab</a>
            </Tabs.Item>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tab-item')).toHaveClass('custom-item');
    });

    it('calls onClick', () => {
      const handleClick = jest.fn();
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Item data-testid="tab-item" onClick={handleClick}>
              <a>Tab</a>
            </Tabs.Item>
          </Tabs.List>
        </Tabs>
      );
      fireEvent.click(screen.getByTestId('tab-item'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('does not render an empty class attribute when inactive and without a className', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Item data-testid="tab-item">
              <a>Tab</a>
            </Tabs.Item>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tab-item')).not.toHaveAttribute('class');
    });
  });

  describe('Tabs.Content', () => {
    it('renders div with tabs-content class', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0}>Tab</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content data-testid="content">
            <Tabs.Content.Item index={0}>Panel</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByTestId('content')).toHaveClass('tabs-content');
    });

    it('accepts custom className', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0}>Tab</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content className="custom-content" data-testid="content">
            <Tabs.Content.Item index={0}>Panel</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByTestId('content')).toHaveClass('custom-content');
    });
  });

  describe('Tabs.Content.Item', () => {
    it('shows active panel and hides inactive', () => {
      render(
        <Tabs defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
            <Tabs.Tab index={1}>Tab 2</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0} data-testid="panel-0">
              Panel 0
            </Tabs.Content.Item>
            <Tabs.Content.Item index={1} data-testid="panel-1">
              Panel 1
            </Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );

      expect(screen.getByTestId('panel-0')).toHaveClass('is-active');
      expect(screen.getByTestId('panel-1')).not.toHaveClass('is-active');
    });

    it('has role="tabpanel"', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0}>Tab</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0} data-testid="panel">
              Panel
            </Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByTestId('panel')).toHaveAttribute('role', 'tabpanel');
    });

    it('has aria-hidden false when active', () => {
      render(
        <Tabs defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab index={0}>Tab</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0} data-testid="panel">
              Panel
            </Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByTestId('panel')).toHaveAttribute(
        'aria-hidden',
        'false'
      );
    });

    it('has aria-hidden true when inactive', () => {
      render(
        <Tabs defaultValue={1}>
          <Tabs.List>
            <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
            <Tabs.Tab index={1}>Tab 2</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0} data-testid="panel">
              Panel
            </Tabs.Content.Item>
            <Tabs.Content.Item index={1}>Panel 2</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByTestId('panel')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    it('accepts custom className', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0}>Tab</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item
              index={0}
              className="custom-panel"
              data-testid="panel"
            >
              Panel
            </Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByTestId('panel')).toHaveClass('custom-panel');
    });
  });

  describe('vertical', () => {
    it('applies is-vertical class on tabs-root', () => {
      render(
        <Tabs vertical data-testid="tabs">
          <Tabs.List>
            <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>Panel</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByTestId('tabs')).toHaveClass('is-vertical');
    });

    it('applies is-right class with side="right"', () => {
      render(
        <Tabs vertical side="right" data-testid="tabs">
          <Tabs.List>
            <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>Panel</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByTestId('tabs')).toHaveClass('is-right');
    });

    it('applies is-expanded class when expanded', () => {
      render(
        <Tabs vertical expanded data-testid="tabs">
          <Tabs.List>
            <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>Panel</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByTestId('tabs')).toHaveClass('is-expanded');
    });

    it('wraps in tabs-root when vertical with content', () => {
      render(
        <Tabs vertical data-testid="tabs">
          <Tabs.List>
            <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>Panel</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByTestId('tabs')).toHaveClass('tabs-root');
    });
  });

  describe('content layout', () => {
    it('wraps in tabs-root when Tabs.Content is present (horizontal)', () => {
      render(
        <Tabs data-testid="tabs">
          <Tabs.List>
            <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>Panel</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByTestId('tabs')).toHaveClass('tabs-root');
      // Inner .tabs div should exist
      expect(
        screen.getByTestId('tabs').querySelector('.tabs')
      ).toBeInTheDocument();
    });

    it('renders single .tabs div when no Tabs.Content (backward compat)', () => {
      render(
        <Tabs data-testid="tabs">
          <Tabs.List>
            <Tabs.Item active>
              <a>Tab</a>
            </Tabs.Item>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('tabs')).toHaveClass('tabs');
      expect(screen.getByTestId('tabs')).not.toHaveClass('tabs-root');
    });
  });

  describe('accessibility', () => {
    it('TabList has role="tablist"', () => {
      render(
        <Tabs>
          <Tabs.List data-testid="list">
            <Tabs.Tab index={0}>Tab</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('list')).toHaveAttribute('role', 'tablist');
    });

    it('Tab has role="tab" and aria-selected', () => {
      render(
        <Tabs defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab index={0} data-testid="active-tab">
              Active
            </Tabs.Tab>
            <Tabs.Tab index={1} data-testid="inactive-tab">
              Inactive
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(screen.getByTestId('active-tab')).toHaveAttribute('role', 'tab');
      expect(screen.getByTestId('active-tab')).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByTestId('inactive-tab')).toHaveAttribute(
        'aria-selected',
        'false'
      );
    });

    it('Content.Item has role="tabpanel" and aria-hidden', () => {
      render(
        <Tabs defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
            <Tabs.Tab index={1}>Tab 2</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0} data-testid="active-panel">
              Panel 1
            </Tabs.Content.Item>
            <Tabs.Content.Item index={1} data-testid="hidden-panel">
              Panel 2
            </Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(screen.getByTestId('active-panel')).toHaveAttribute(
        'role',
        'tabpanel'
      );
      expect(screen.getByTestId('active-panel')).toHaveAttribute(
        'aria-hidden',
        'false'
      );
      expect(screen.getByTestId('hidden-panel')).toHaveAttribute(
        'role',
        'tabpanel'
      );
      expect(screen.getByTestId('hidden-panel')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });
  });

  describe('rendered outside Tabs context', () => {
    it('Tab renders defensively (isActive=false) when no Tabs context is present', () => {
      // Hits the `ctx ? ... : false` false branch in Tab.
      render(
        <Tab index={0} data-testid="solo-tab">
          Solo
        </Tab>
      );
      const tab = screen.getByTestId('solo-tab');
      expect(tab).toHaveAttribute('aria-selected', 'false');
      expect(tab).not.toHaveClass('is-active');
      // Clicking without a context must not throw.
      expect(() => fireEvent.click(tab.querySelector('a')!)).not.toThrow();
    });

    it('TabContentItem renders defensively (isActive=false) when no Tabs context is present', () => {
      // Hits the `ctx ? ... : false` false branch in TabContentItem.
      render(
        <TabContentItem index={0} data-testid="solo-panel">
          Solo Content
        </TabContentItem>
      );
      const panel = screen.getByTestId('solo-panel');
      expect(panel).toHaveAttribute('aria-hidden', 'true');
      expect(panel).not.toHaveClass('is-active');
    });
  });
});

describe('Compound components', () => {
  it('statics are the separately exported components', () => {
    expect(Tabs.List).toBe(TabList);
    expect(Tabs.Tab).toBe(Tab);
    expect(Tabs.Item).toBe(TabItem);
    expect(Tabs.Content).toBe(TabsContent);
    expect(Tabs.Content.Item).toBe(TabContentItem);
  });

  it('renders tabs with content panels through the dot path', () => {
    const { container } = render(
      <Tabs>
        <Tabs.List>
          <Tabs.Tab index={0}>Overview</Tabs.Tab>
          <Tabs.Tab index={1}>Settings</Tabs.Tab>
        </Tabs.List>
        <Tabs.Content>
          <Tabs.Content.Item index={0}>Overview panel</Tabs.Content.Item>
          <Tabs.Content.Item index={1}>Settings panel</Tabs.Content.Item>
        </Tabs.Content>
      </Tabs>
    );
    expect(container.querySelector('.tabs')).toBeInTheDocument();
    expect(container.querySelectorAll('.tabs li')).toHaveLength(2);
    expect(container.querySelector('.tabs-content')).toBeInTheDocument();
    expect(container.querySelectorAll('.tabs-content-item')).toHaveLength(2);
    expect(
      container.querySelector('.tabs-content-item.is-active')
    ).toHaveTextContent('Overview panel');
  });
});

describe('Tabs deprecated color prop', () => {
  it('warns once in development when color is passed', () => {
    const { rerender } = render(
      <Tabs color="primary">
        <TabList>
          <TabItem>One</TabItem>
        </TabList>
      </Tabs>
    );
    rerender(
      <Tabs color="danger">
        <TabList>
          <TabItem>One</TabItem>
        </TabList>
      </Tabs>
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Tabs "color" prop is deprecated')
    );
  });

  it('does not warn when color is omitted', () => {
    render(
      <Tabs>
        <TabList>
          <TabItem>One</TabItem>
        </TabList>
      </Tabs>
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('Tabs fullwidth aliases', () => {
  const list = (
    <Tabs.List>
      <Tabs.Item>
        <a>Tab</a>
      </Tabs.Item>
    </Tabs.List>
  );

  it('applies is-fullwidth via the canonical isFullwidth prop', () => {
    render(
      <Tabs isFullwidth data-testid="tabs">
        {list}
      </Tabs>
    );
    expect(screen.getByTestId('tabs')).toHaveClass('is-fullwidth');
  });

  it('applies is-fullwidth via the deprecated isFullWidth prop', () => {
    render(
      <Tabs isFullWidth data-testid="tabs">
        {list}
      </Tabs>
    );
    expect(screen.getByTestId('tabs')).toHaveClass('is-fullwidth');
  });

  it('applies is-fullwidth via the deprecated fullwidth prop', () => {
    render(
      <Tabs fullwidth data-testid="tabs">
        {list}
      </Tabs>
    );
    expect(screen.getByTestId('tabs')).toHaveClass('is-fullwidth');
  });

  it('isFullwidth wins over isFullWidth when both are set', () => {
    render(
      <Tabs isFullwidth={false} isFullWidth data-testid="tabs">
        {list}
      </Tabs>
    );
    expect(screen.getByTestId('tabs')).not.toHaveClass('is-fullwidth');
  });

  it('isFullWidth wins over fullwidth when both are set', () => {
    render(
      <Tabs isFullWidth={false} fullwidth data-testid="tabs">
        {list}
      </Tabs>
    );
    expect(screen.getByTestId('tabs')).not.toHaveClass('is-fullwidth');
  });

  it('applies the class prefix to is-fullwidth', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Tabs isFullwidth data-testid="tabs">
          {list}
        </Tabs>
      </ConfigProvider>
    );
    expect(screen.getByTestId('tabs')).toHaveClass('bestax-is-fullwidth');
  });
});

describe('Tabs keyboard support (WAI-ARIA tabs pattern)', () => {
  const LABELS = ['One', 'Two', 'Three', 'Four'];

  const renderTabs = (
    props: Partial<TabsProps> = {},
    disabled: number[] = []
  ) =>
    render(
      <>
        <button type="button">before</button>
        <Tabs {...props}>
          <Tabs.List>
            {LABELS.map((label, i) => (
              <Tabs.Tab key={label} index={i} disabled={disabled.includes(i)}>
                {label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <Tabs.Content>
            {LABELS.map((label, i) => (
              <Tabs.Content.Item key={label} index={i}>
                {`${label} panel`}
              </Tabs.Content.Item>
            ))}
          </Tabs.Content>
        </Tabs>
        <button type="button">after</button>
      </>
    );

  const tab = (name: string) => screen.getByRole('tab', { name });
  const focus = (el: HTMLElement) => act(() => el.focus());
  const key = (el: HTMLElement, k: string, init: object = {}) =>
    fireEvent.keyDown(el, { key: k, ...init });
  const tabIndexes = () =>
    LABELS.map(label => tab(label).getAttribute('tabindex'));

  describe('roving tab stop', () => {
    it('makes the selected tab the only tab stop', () => {
      renderTabs({ defaultValue: 2 });
      expect(tabIndexes()).toEqual(['-1', '-1', '0', '-1']);
    });

    it('enters the list on the selected tab and leaves it with one Tab press', async () => {
      const user = userEvent.setup();
      renderTabs({ defaultValue: 1 });
      act(() => screen.getByRole('button', { name: 'before' }).focus());
      await user.tab();
      expect(tab('Two')).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('moves the tab stop with focus, so Tab and Shift+Tab leave the list from any tab', async () => {
      const user = userEvent.setup();
      renderTabs({ defaultValue: 2 });
      focus(tab('Three'));
      key(tab('Three'), 'Home');
      expect(tab('One')).toHaveFocus();
      expect(tabIndexes()).toEqual(['0', '-1', '-1', '-1']);
      await user.tab({ shift: true });
      expect(screen.getByRole('button', { name: 'before' })).toHaveFocus();

      focus(tab('Three'));
      key(tab('Three'), 'ArrowLeft');
      expect(tab('Two')).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('returns the tab stop to the selected tab once focus leaves the list', () => {
      renderTabs({ defaultValue: 0 });
      focus(tab('One'));
      key(tab('One'), 'ArrowRight');
      expect(tabIndexes()).toEqual(['-1', '0', '-1', '-1']);
      focus(screen.getByRole('button', { name: 'after' }));
      expect(tabIndexes()).toEqual(['0', '-1', '-1', '-1']);
    });

    it('returns the tab stop to the selected tab when focus leaves to nowhere', () => {
      renderTabs({ defaultValue: 0 });
      focus(tab('One'));
      key(tab('One'), 'ArrowRight');
      act(() => tab('Two').blur());
      expect(tabIndexes()).toEqual(['0', '-1', '-1', '-1']);
    });

    it('gives the stop to the first enabled tab when the selected one is disabled', () => {
      renderTabs({ defaultValue: 0 }, [0]);
      expect(tabIndexes()).toEqual(['-1', '0', '-1', '-1']);
    });

    it('gives the stop to the first enabled tab when no tab matches the value', () => {
      renderTabs({ value: 9 });
      expect(tabIndexes()).toEqual(['0', '-1', '-1', '-1']);
    });

    it('leaves no tab stop when every tab is disabled', () => {
      renderTabs({ defaultValue: 0 }, [0, 1, 2, 3]);
      expect(tabIndexes()).toEqual(['-1', '-1', '-1', '-1']);
    });

    it('does not keep the stop on a disabled tab that took focus', () => {
      renderTabs({ defaultValue: 0 }, [1]);
      focus(tab('Two'));
      expect(tabIndexes()).toEqual(['0', '-1', '-1', '-1']);
    });

    it('puts the stop on the selected tab in server-rendered markup', () => {
      const html = renderToStaticMarkup(
        <Tabs defaultValue={1}>
          <Tabs.List>
            <Tabs.Tab index={0}>One</Tabs.Tab>
            <Tabs.Tab index={1}>Two</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(html).toMatch(
        /aria-selected="false" tabindex="-1"[^>]*><a><span>One/
      );
      expect(html).toMatch(
        /aria-selected="true" tabindex="0"[^>]*><a><span>Two/
      );
    });
  });

  describe('arrow keys, Home and End', () => {
    it('ArrowRight and ArrowLeft move focus without selecting (manual activation)', () => {
      const onChange = jest.fn();
      renderTabs({ onChange });
      focus(tab('One'));
      expect(key(tab('One'), 'ArrowRight')).toBe(false);
      expect(tab('Two')).toHaveFocus();
      expect(key(tab('Two'), 'ArrowRight')).toBe(false);
      expect(tab('Three')).toHaveFocus();
      expect(key(tab('Three'), 'ArrowLeft')).toBe(false);
      expect(tab('Two')).toHaveFocus();
      expect(tab('One')).toHaveAttribute('aria-selected', 'true');
      expect(tab('Two')).toHaveAttribute('aria-selected', 'false');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('wraps from the last tab to the first and back', () => {
      renderTabs();
      focus(tab('Four'));
      key(tab('Four'), 'ArrowRight');
      expect(tab('One')).toHaveFocus();
      key(tab('One'), 'ArrowLeft');
      expect(tab('Four')).toHaveFocus();
    });

    it('Home and End move to the first and last tabs', () => {
      renderTabs({ defaultValue: 1 });
      focus(tab('Two'));
      expect(key(tab('Two'), 'End')).toBe(false);
      expect(tab('Four')).toHaveFocus();
      expect(key(tab('Four'), 'Home')).toBe(false);
      expect(tab('One')).toHaveFocus();
    });

    it('skips disabled tabs', () => {
      renderTabs({ defaultValue: 1 }, [0, 2, 3]);
      focus(tab('Two'));
      key(tab('Two'), 'ArrowRight');
      expect(tab('Two')).toHaveFocus();
      key(tab('Two'), 'Home');
      expect(tab('Two')).toHaveFocus();
      key(tab('Two'), 'End');
      expect(tab('Two')).toHaveFocus();
    });

    it('skips disabled tabs in both directions and at either end', () => {
      renderTabs({ defaultValue: 1 }, [0, 2]);
      focus(tab('Two'));
      key(tab('Two'), 'ArrowRight');
      expect(tab('Four')).toHaveFocus();
      key(tab('Four'), 'ArrowRight');
      expect(tab('Two')).toHaveFocus();
      key(tab('Two'), 'ArrowLeft');
      expect(tab('Four')).toHaveFocus();
      key(tab('Four'), 'Home');
      expect(tab('Two')).toHaveFocus();
    });

    it('moves on from a disabled tab that took focus, and stays put when nothing is enabled', () => {
      const { unmount } = renderTabs({ defaultValue: 0 }, [1]);
      focus(tab('Two'));
      key(tab('Two'), 'ArrowRight');
      expect(tab('Three')).toHaveFocus();
      unmount();

      renderTabs({ defaultValue: 0 }, [0, 1, 2, 3]);
      focus(tab('Two'));
      expect(key(tab('Two'), 'ArrowRight')).toBe(true);
      expect(tab('Two')).toHaveFocus();
    });

    it('ignores ArrowUp and ArrowDown in a horizontal list', () => {
      renderTabs();
      focus(tab('One'));
      expect(key(tab('One'), 'ArrowDown')).toBe(true);
      expect(key(tab('One'), 'ArrowUp')).toBe(true);
      expect(tab('One')).toHaveFocus();
    });

    it('ignores keys pressed with Alt, Control or Meta', () => {
      renderTabs();
      focus(tab('One'));
      expect(key(tab('One'), 'ArrowRight', { altKey: true })).toBe(true);
      expect(key(tab('One'), 'ArrowRight', { ctrlKey: true })).toBe(true);
      expect(key(tab('One'), 'ArrowRight', { metaKey: true })).toBe(true);
      expect(key(tab('One'), 'Enter', { metaKey: true })).toBe(true);
      expect(tab('One')).toHaveFocus();
    });

    it('ignores other keys', () => {
      renderTabs();
      focus(tab('One'));
      expect(key(tab('One'), 'a')).toBe(true);
      expect(tab('One')).toHaveFocus();
    });

    it('uses ArrowUp and ArrowDown as well in a vertical list', () => {
      renderTabs({ vertical: true });
      expect(screen.getByRole('tablist')).toHaveAttribute(
        'aria-orientation',
        'vertical'
      );
      focus(tab('One'));
      expect(key(tab('One'), 'ArrowDown')).toBe(false);
      expect(tab('Two')).toHaveFocus();
      expect(key(tab('Two'), 'ArrowUp')).toBe(false);
      expect(tab('One')).toHaveFocus();
      // The vertical layout stacks horizontally on mobile, so the
      // horizontal keys keep working.
      key(tab('One'), 'ArrowRight');
      expect(tab('Two')).toHaveFocus();
    });

    it('leaves aria-orientation off a horizontal list', () => {
      renderTabs();
      expect(screen.getByRole('tablist')).not.toHaveAttribute(
        'aria-orientation'
      );
    });
  });

  describe('Enter and Space', () => {
    it.each(['Enter', ' '])('%j activates the focused tab', k => {
      const onChange = jest.fn();
      renderTabs({ onChange });
      focus(tab('One'));
      key(tab('One'), 'ArrowRight');
      expect(key(tab('Two'), k)).toBe(false);
      expect(onChange).toHaveBeenCalledWith(1);
      expect(tab('Two')).toHaveAttribute('aria-selected', 'true');
      expect(tab('Two')).toHaveClass('is-active');
      expect(screen.getByText('Two panel')).toHaveClass('is-active');
      expect(tabIndexes()).toEqual(['-1', '0', '-1', '-1']);
    });

    it('does nothing on a disabled tab', () => {
      const onChange = jest.fn();
      renderTabs({ onChange }, [1]);
      focus(tab('Two'));
      key(tab('Two'), 'Enter');
      key(tab('Two'), ' ');
      expect(onChange).not.toHaveBeenCalled();
      expect(tab('One')).toHaveAttribute('aria-selected', 'true');
    });

    it('activates through a click, so click listeners see keyboard activation', () => {
      const onClick = jest.fn();
      render(
        <div onClick={onClick}>
          <Tabs>
            <Tabs.List>
              <Tabs.Tab index={0}>One</Tabs.Tab>
              <Tabs.Tab index={1}>Two</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </div>
      );
      key(tab('Two'), 'Enter');
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(tab('Two')).toHaveAttribute('aria-selected', 'true');
    });

    it('still activates on a mouse click', () => {
      const onChange = jest.fn();
      renderTabs({ onChange });
      fireEvent.click(screen.getByText('Three'));
      expect(onChange).toHaveBeenCalledWith(2);
      expect(tab('Three')).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('handlers passed to Tabs.Tab', () => {
    it('calls onKeyDown, onFocus and onBlur alongside its own', () => {
      const onKeyDown = jest.fn();
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab
              index={0}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              One
            </Tabs.Tab>
            <Tabs.Tab index={1}>Two</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      focus(tab('One'));
      expect(onFocus).toHaveBeenCalledTimes(1);
      key(tab('One'), 'ArrowRight');
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(tab('Two')).toHaveFocus();
    });

    it('lets onKeyDown take a key over by preventing its default', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0} onKeyDown={e => e.preventDefault()}>
              One
            </Tabs.Tab>
            <Tabs.Tab index={1}>Two</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      focus(tab('One'));
      key(tab('One'), 'ArrowRight');
      key(tab('One'), 'Enter');
      expect(tab('One')).toHaveFocus();
      expect(tab('One')).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('ARIA', () => {
    it('links each tab to its panel and back', () => {
      renderTabs({ defaultValue: 1 });
      LABELS.forEach(label => {
        const t = tab(label);
        const panel = screen.getByText(`${label} panel`);
        expect(t.id).toBeTruthy();
        expect(panel.id).toBeTruthy();
        expect(t).toHaveAttribute('aria-controls', panel.id);
        expect(panel).toHaveAttribute('aria-labelledby', t.id);
      });
    });

    it('gives the active panel the name of its tab', () => {
      renderTabs({ defaultValue: 1 });
      expect(screen.getByRole('tabpanel', { name: 'Two' })).toHaveTextContent(
        'Two panel'
      );
    });

    it('generates ids that differ between two Tabs on a page', () => {
      render(
        <>
          <Tabs>
            <Tabs.List>
              <Tabs.Tab index={0}>A</Tabs.Tab>
            </Tabs.List>
          </Tabs>
          <Tabs>
            <Tabs.List>
              <Tabs.Tab index={0}>B</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </>
      );
      expect(tab('A').id).not.toBe(tab('B').id);
    });

    it('links through ids passed to a tab or a panel', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0} id="my-tab">
              One
            </Tabs.Tab>
            <Tabs.Tab index={1}>Two</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>One panel</Tabs.Content.Item>
            <Tabs.Content.Item index={1} id="my-panel">
              Two panel
            </Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(tab('One')).toHaveAttribute('id', 'my-tab');
      expect(screen.getByText('One panel')).toHaveAttribute(
        'aria-labelledby',
        'my-tab'
      );
      expect(tab('Two')).toHaveAttribute('aria-controls', 'my-panel');
    });

    it('links a Tabs.Content nested below the root', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0}>One</Tabs.Tab>
          </Tabs.List>
          <div>
            <Tabs.Content>
              <Tabs.Content.Item index={0}>One panel</Tabs.Content.Item>
            </Tabs.Content>
          </div>
        </Tabs>
      );
      expect(tab('One')).toHaveAttribute(
        'aria-controls',
        screen.getByText('One panel').id
      );
    });

    it('points aria-controls only at a panel that exists, and aria-labelledby only at a tab that exists', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0}>One</Tabs.Tab>
            <Tabs.Tab index={1}>Two</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>One panel</Tabs.Content.Item>
            <Tabs.Content.Item index={5}>Orphan panel</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      expect(tab('One')).toHaveAttribute('aria-controls');
      expect(tab('Two')).not.toHaveAttribute('aria-controls');
      expect(screen.getByText('Orphan panel')).not.toHaveAttribute(
        'aria-labelledby'
      );
    });

    it('sets no aria-controls when there are no panels', () => {
      render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0}>One</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      );
      expect(tab('One')).toHaveAttribute('id');
      expect(tab('One')).not.toHaveAttribute('aria-controls');
    });

    it('drops a link when its tab or panel unmounts', () => {
      const { rerender } = render(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0}>One</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content>
            <Tabs.Content.Item index={0}>One panel</Tabs.Content.Item>
          </Tabs.Content>
        </Tabs>
      );
      rerender(
        <Tabs>
          <Tabs.List>
            <Tabs.Tab index={0}>One</Tabs.Tab>
          </Tabs.List>
          <Tabs.Content />
        </Tabs>
      );
      expect(tab('One')).not.toHaveAttribute('aria-controls');
    });

    it('marks a disabled tab aria-disabled', () => {
      renderTabs({}, [1]);
      expect(tab('Two')).toHaveAttribute('aria-disabled', 'true');
      expect(tab('One')).not.toHaveAttribute('aria-disabled');
    });
  });

  describe('Tabs as Bulma navigation (links, no Tabs.Content)', () => {
    const nav = (
      <Tabs align="centered" boxed vertical>
        <Tabs.List>
          <Tabs.Item active>
            <a href="/home">Home</a>
          </Tabs.Item>
          <Tabs.Item>
            <a href="/profile">Profile</a>
          </Tabs.Item>
        </Tabs.List>
      </Tabs>
    );

    it('renders exactly the markup it rendered before keyboard support', () => {
      const { container } = render(nav);
      expect(container.innerHTML).toBe(
        '<div class="tabs is-centered is-boxed"><ul role="tablist">' +
          '<li class="is-active"><a href="/home">Home</a></li>' +
          '<li><a href="/profile">Profile</a></li></ul></div>'
      );
    });

    it('leaves the links in the page tab order and the arrow keys alone', async () => {
      const user = userEvent.setup();
      render(nav);
      await user.tab();
      expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
      expect(
        fireEvent.keyDown(screen.getByRole('link', { name: 'Home' }), {
          key: 'ArrowRight',
        })
      ).toBe(true);
      expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('link', { name: 'Profile' })).toHaveFocus();
    });
  });

  describe('outside a Tabs', () => {
    it('Tab keeps its own tab stop and handles keys without throwing', () => {
      render(
        <ul>
          <Tab index={0}>One</Tab>
          <Tab index={1}>Two</Tab>
        </ul>
      );
      expect(tab('One')).toHaveAttribute('tabindex', '0');
      expect(tab('One')).not.toHaveAttribute('id');
      focus(tab('One'));
      expect(() => key(tab('One'), 'Enter')).not.toThrow();
      key(tab('One'), 'ArrowRight');
      expect(tab('Two')).toHaveFocus();
      act(() => tab('Two').blur());
    });

    it('TabContentItem renders no id or aria-labelledby', () => {
      render(<TabContentItem index={0}>Solo</TabContentItem>);
      const panel = screen.getByText('Solo');
      expect(panel).not.toHaveAttribute('id');
      expect(panel).not.toHaveAttribute('aria-labelledby');
    });
  });
});
