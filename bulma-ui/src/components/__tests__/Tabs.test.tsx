import { render, screen, fireEvent } from '@testing-library/react';
import Tabs from '../Tabs';

describe('Tabs', () => {
  it('renders tabs container', () => {
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
});

describe('Tabs.List', () => {
  it('renders ul', () => {
    render(
      <Tabs>
        <Tabs.List data-testid="tab-list">
          <Tabs.Item>
            <a>Tab</a>
          </Tabs.Item>
        </Tabs.List>
      </Tabs>
    );
    expect(screen.getByTestId('tab-list').tagName.toLowerCase()).toBe('ul');
  });

  it('accepts custom className', () => {
    render(
      <Tabs>
        <Tabs.List className="custom-list" data-testid="tab-list">
          <Tabs.Item>
            <a>Tab</a>
          </Tabs.Item>
        </Tabs.List>
      </Tabs>
    );
    expect(screen.getByTestId('tab-list')).toHaveClass('custom-list');
  });
});

describe('Tabs.Item', () => {
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
