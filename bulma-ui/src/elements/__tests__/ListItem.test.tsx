import { render, screen } from '@testing-library/react';
import { ListItem } from '../ListItem';
import { UnorderedList } from '../UnorderedList';
import { ConfigProvider } from '../../helpers/Config';

describe('ListItem Component', () => {
  test('renders children content', () => {
    render(
      <UnorderedList>
        <ListItem>Test Content</ListItem>
      </UnorderedList>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders as li element', () => {
    render(
      <UnorderedList>
        <ListItem data-testid="item">Test</ListItem>
      </UnorderedList>
    );
    const item = screen.getByTestId('item');
    expect(item.tagName).toBe('LI');
  });

  test('applies custom className', () => {
    render(
      <UnorderedList>
        <ListItem className="custom-class">Test</ListItem>
      </UnorderedList>
    );
    expect(screen.getByText('Test')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies textColor class', () => {
    render(
      <UnorderedList>
        <ListItem textColor="primary">Test</ListItem>
      </UnorderedList>
    );
    expect(screen.getByText('Test')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(
      <UnorderedList>
        <ListItem bgColor="light">Test</ListItem>
      </UnorderedList>
    );
    expect(screen.getByText('Test')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  test('applies Bulma helper classes', () => {
    render(
      <UnorderedList>
        <ListItem m="3" p="4" textWeight="bold" data-testid="item">
          Test
        </ListItem>
      </UnorderedList>
    );
    const item = screen.getByTestId('item');
    expect(item).toHaveClass('m-3', { exact: false });
    expect(item).toHaveClass('p-4', { exact: false });
    expect(item).toHaveClass('has-text-weight-bold', { exact: false });
  });

  test('applies value attribute', () => {
    render(
      <UnorderedList>
        <ListItem value={10} data-testid="item">
          Test
        </ListItem>
      </UnorderedList>
    );
    expect(screen.getByTestId('item')).toHaveAttribute('value', '10');
  });

  test('passes HTML attributes to li', () => {
    render(
      <UnorderedList>
        <ListItem
          id="item-id"
          data-testid="item"
          aria-label="Item"
          title="Item title"
        >
          Test
        </ListItem>
      </UnorderedList>
    );
    const item = screen.getByTestId('item');
    expect(item).toHaveAttribute('id', 'item-id');
    expect(item).toHaveAttribute('aria-label', 'Item');
    expect(item).toHaveAttribute('title', 'Item title');
  });

  test('does not pass non-HTML props to li', () => {
    render(
      <UnorderedList>
        <ListItem textColor="primary" bgColor="light" m="3" data-testid="item">
          Test
        </ListItem>
      </UnorderedList>
    );
    const item = screen.getByTestId('item');
    expect(item).not.toHaveAttribute('textColor');
    expect(item).not.toHaveAttribute('bgColor');
    expect(item).not.toHaveAttribute('m');
  });

  test('renders without className when no classes are applied', () => {
    render(
      <UnorderedList>
        <ListItem data-testid="item">Plain Item</ListItem>
      </UnorderedList>
    );
    const item = screen.getByTestId('item');
    expect(item.getAttribute('class')).toBeNull();
  });

  test('combines multiple color-related classes', () => {
    render(
      <UnorderedList>
        <ListItem textColor="primary" bgColor="light">
          Styled Item
        </ListItem>
      </UnorderedList>
    );
    const item = screen.getByText('Styled Item');
    expect(item).toHaveClass('has-text-primary', { exact: false });
    expect(item).toHaveClass('has-background-light', { exact: false });
  });

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <UnorderedList>
            <ListItem m="2" p="3" data-testid="item">
              Test Item
            </ListItem>
          </UnorderedList>
        </ConfigProvider>
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('bulma-m-2');
      expect(item).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      render(
        <UnorderedList>
          <ListItem m="4" textAlign="centered" data-testid="item">
            Standard Item
          </ListItem>
        </UnorderedList>
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('m-4');
      expect(item).toHaveClass('has-text-centered');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <UnorderedList>
            <ListItem m="2">Test</ListItem>
          </UnorderedList>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('m-2');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <UnorderedList>
            <ListItem p="3">Test</ListItem>
          </UnorderedList>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('p-3');
    });
  });
});
