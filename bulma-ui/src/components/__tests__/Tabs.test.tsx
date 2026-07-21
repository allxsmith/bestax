import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Tabs, {
  Tab,
  TabList,
  TabItem,
  TabsContent,
  TabContentItem,
} from '../Tabs';
import { ConfigProvider } from '../../helpers/Config';

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
