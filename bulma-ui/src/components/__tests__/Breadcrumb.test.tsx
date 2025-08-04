import React from 'react';
import { render, screen } from '@testing-library/react';
import { Breadcrumb, BreadcrumbProps } from '../Breadcrumb';
import { Icon } from '../../elements/Icon';
import { ConfigProvider } from '../../helpers/Config';

// Sample breadcrumb items for reuse in tests
const defaultItems = (
  <>
    <li>
      <a href="#">
        <Icon name="fas fa-home" ariaLabel="home icon" /> Home
      </a>
    </li>
    <li>
      <a href="#">
        <Icon name="fas fa-folder" ariaLabel="category icon" /> Category
      </a>
    </li>
    <li className="is-active">
      <a href="#">
        <Icon name="fas fa-file" ariaLabel="item icon" /> Item
      </a>
    </li>
  </>
);

describe('Breadcrumb', () => {
  // Helper function to render the component with default props
  const setup = (props: Partial<BreadcrumbProps> = {}) => {
    return render(<Breadcrumb {...props}>{defaultItems}</Breadcrumb>);
  };

  test('renders breadcrumb with default classes and accessibility attributes', () => {
    setup();
    const breadcrumb = screen.getByLabelText('breadcrumbs');
    expect(breadcrumb).toBeInTheDocument();
    expect(breadcrumb).toHaveClass('breadcrumb');
    expect(breadcrumb.tagName).toBe('NAV');
    expect(breadcrumb).toContainElement(screen.getByRole('list'));
  });

  test('applies custom className', () => {
    setup({ className: 'custom-breadcrumb' });
    const breadcrumb = screen.getByLabelText('breadcrumbs');
    expect(breadcrumb).toHaveClass('breadcrumb custom-breadcrumb');
  });

  test('applies alignment modifier', () => {
    setup({ alignment: 'centered' });
    const breadcrumb = screen.getByLabelText('breadcrumbs');
    expect(breadcrumb).toHaveClass('breadcrumb is-centered');
  });

  test('applies separator modifier', () => {
    setup({ separator: 'dot' });
    const breadcrumb = screen.getByLabelText('breadcrumbs');
    expect(breadcrumb).toHaveClass('breadcrumb has-dot-separator');
  });

  test('applies size modifier', () => {
    setup({ size: 'large' });
    const breadcrumb = screen.getByLabelText('breadcrumbs');
    expect(breadcrumb).toHaveClass('breadcrumb is-large');
  });

  test('applies Bulma helper classes via useBulmaClasses', () => {
    setup({ textWeight: 'semibold', mx: 'auto' });
    const breadcrumb = screen.getByLabelText('breadcrumbs');
    expect(breadcrumb).toHaveClass(
      'breadcrumb has-text-weight-semibold mx-auto'
    );
  });

  test('renders icons correctly', () => {
    setup();
    // Verify icon containers
    const homeIcon = screen.getByLabelText('home icon');
    const categoryIcon = screen.getByLabelText('category icon');
    const itemIcon = screen.getByLabelText('item icon');

    expect(homeIcon).toBeInTheDocument();
    expect(categoryIcon).toBeInTheDocument();
    expect(itemIcon).toBeInTheDocument();

    // Verify icon container classes
    expect(homeIcon).toHaveClass('icon');

    // Verify the <i> elements have correct Font Awesome classes
    const homeIconElement = homeIcon.querySelector('i');
    const categoryIconElement = categoryIcon.querySelector('i');
    const itemIconElement = itemIcon.querySelector('i');

    expect(homeIconElement).toHaveClass('fas', 'fa-home');
    expect(categoryIconElement).toHaveClass('fas', 'fa-folder');
    expect(itemIconElement).toHaveClass('fas', 'fa-file');
  });

  test('renders children correctly', () => {
    setup();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
    expect(listItems[2]).toHaveClass('is-active');
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Item')).toBeInTheDocument();
  });

  test('does not apply invalid modifiers', () => {
    setup({
      alignment: 'invalid' as unknown as BreadcrumbProps['alignment'],
      separator: 'invalid' as unknown as BreadcrumbProps['separator'],
      size: 'invalid' as unknown as BreadcrumbProps['size'],
    });
    const breadcrumb = screen.getByLabelText('breadcrumbs');
    expect(breadcrumb).toHaveClass('breadcrumb');
    expect(breadcrumb).not.toHaveClass('is-invalid');
    expect(breadcrumb).not.toHaveClass('has-invalid-separator');
  });

  test('forwards additional HTML attributes', () => {
    setup({
      id: 'breadcrumb-nav',
      'data-testid': 'breadcrumb-test',
    } as Partial<BreadcrumbProps> & React.HTMLAttributes<HTMLElement>);
    const breadcrumb = screen.getByTestId('breadcrumb-test');
    expect(breadcrumb).toHaveAttribute('id', 'breadcrumb-nav');
  });

  test('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Breadcrumb>{defaultItems}</Breadcrumb>
      </ConfigProvider>
    );
    const breadcrumb = screen.getByRole('navigation');
    expect(breadcrumb).toHaveClass('bulma-breadcrumb');
    expect(breadcrumb).not.toHaveClass('breadcrumb');
  });
});
