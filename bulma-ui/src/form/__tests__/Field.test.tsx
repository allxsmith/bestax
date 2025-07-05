import React from 'react';
import { render, screen } from '@testing-library/react';
import Field from '../Field';

// Mocks for Bulma classes
jest.mock('../../helpers/useBulmaClasses', () => ({
  useBulmaClasses: () => ({
    bulmaHelperClasses: '',
    rest: {},
  }),
  validColors: [
    'primary',
    'link',
    'info',
    'success',
    'warning',
    'danger',
    'black',
    'dark',
    'light',
    'white',
  ],
}));

describe('Field', () => {
  it('renders children', () => {
    render(<Field>Test Content</Field>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with no props', () => {
    // Should not throw
    const { container } = render(<Field />);
    expect(container.firstChild).toHaveClass('field');
  });

  it('applies custom className', () => {
    const { container } = render(<Field className="custom-class">Child</Field>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders label when provided as string', () => {
    render(<Field label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Username')).toHaveClass('label');
  });

  it('renders label when provided as a React node', () => {
    render(<Field label={<span data-testid="custom-label">Node</span>} />);
    expect(screen.getByTestId('custom-label')).toBeInTheDocument();
  });

  it('renders horizontal layout with label', () => {
    render(<Field horizontal label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    const fieldLabel = screen.getByText('Email').closest('.field-label');
    expect(fieldLabel).toBeInTheDocument();
    const fieldElement = screen.getByText('Email').closest('.field');
    expect(fieldElement).not.toBeNull();
    const fieldBody = fieldElement?.querySelector('.field-body');
    expect(fieldBody).toBeInTheDocument();
  });

  it('renders grouped and has-addons classes', () => {
    const { container } = render(
      <Field grouped hasAddons>
        GroupAddon
      </Field>
    );
    const field = container.firstChild as HTMLElement;
    expect(field).toHaveClass('is-grouped');
    expect(field).toHaveClass('has-addons');
  });

  it('renders is-grouped-centered, is-grouped-right, is-grouped-multiline', () => {
    const { container: c1 } = render(
      <Field grouped="centered">centered</Field>
    );
    expect(c1.firstChild).toHaveClass('is-grouped-centered');
    const { container: c2 } = render(<Field grouped="right">right</Field>);
    expect(c2.firstChild).toHaveClass('is-grouped-right');
    const { container: c3 } = render(<Field grouped="multiline">multi</Field>);
    expect(c3.firstChild).toHaveClass('is-grouped-multiline');
  });

  it('renders with textColor and bgColor (delegates to useBulmaClasses)', () => {
    render(
      <Field textColor="danger" bgColor="light">
        Colors
      </Field>
    );
    expect(screen.getByText('Colors')).toBeInTheDocument();
  });

  it('passes labelProps to label (with htmlFor and data-testid)', () => {
    render(
      <Field
        label="Lab"
        labelProps={{ 'data-testid': 'my-label', htmlFor: 'f' }}
      />
    );
    const label = screen.getByTestId('my-label');
    expect(label).toHaveAttribute('for', 'f');
  });

  it('passes style and className from labelProps', () => {
    render(
      <Field
        label="Styled"
        labelProps={{
          style: { color: 'red' },
          className: 'extra-label',
          'data-testid': 'styled-label',
        }}
      />
    );
    const label = screen.getByTestId('styled-label');
    expect(label).toHaveStyle({ color: 'red' });
    expect(label).toHaveClass('extra-label');
  });

  it('renders Field.Label and Field.Body as static components', () => {
    render(
      <Field>
        <Field.Label data-testid="f-label">My Label</Field.Label>
        <Field.Body data-testid="f-body">Body Content</Field.Body>
      </Field>
    );
    expect(screen.getByTestId('f-label')).toBeInTheDocument();
    expect(screen.getByTestId('f-body')).toBeInTheDocument();
    expect(
      screen.getByText('My Label').closest('.field-label')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Body Content').closest('.field-body')
    ).toBeInTheDocument();
  });

  it('renders labelSize as size class (vertical and horizontal)', () => {
    // Vertical
    render(<Field label="Label" labelSize="large" />);
    expect(screen.getByText('Label')).toHaveClass('label');
    // Horizontal
    render(<Field label="Label2" labelSize="medium" horizontal />);
    const fieldLabel = screen.getByText('Label2').closest('.field-label');
    expect(fieldLabel).toHaveClass('is-medium');
  });

  it('does not add a Bulma size class for labelSize "normal"', () => {
    render(<Field label="NormalSize" labelSize="normal" horizontal />);
    const fieldLabel = screen.getByText('NormalSize').closest('.field-label');
    expect(fieldLabel?.className).not.toMatch(/is-normal/);
  });

  it('does not wrap children in FieldBody if already a FieldBody', () => {
    render(
      <Field horizontal>
        <Field.Body data-testid="existing-body">AlreadyBody</Field.Body>
      </Field>
    );
    // Should only be one field-body
    const bodies = screen.getAllByText('AlreadyBody');
    expect(bodies.length).toBe(1);
    expect(screen.getByTestId('existing-body')).toBeInTheDocument();
  });

  it('spreads extra props to FieldLabel and FieldBody', () => {
    render(
      <Field>
        <Field.Label data-testid="label-x" aria-label="lbl">
          A
        </Field.Label>
        <Field.Body data-testid="body-x" aria-label="body">
          B
        </Field.Body>
      </Field>
    );
    expect(screen.getByTestId('label-x')).toHaveAttribute('aria-label', 'lbl');
    expect(screen.getByTestId('body-x')).toHaveAttribute('aria-label', 'body');
  });

  it('passes labelProps.style to label in horizontal layout', () => {
    render(
      <Field
        horizontal
        label="Horiz"
        labelProps={{ style: { color: 'blue' }, 'data-testid': 'horiz-label' }}
      />
    );
    const label = screen.getByTestId('horiz-label');
    expect(label).toHaveStyle({ color: 'blue' });
  });

  it('does not wrap children if type.displayName is "FieldBody"', () => {
    const FakeBody = (props: React.ComponentPropsWithoutRef<'div'>) => (
      <div {...props}>FakeBody</div>
    );
    FakeBody.displayName = 'FieldBody';
    render(
      <Field horizontal>
        <FakeBody data-testid="fake-body" />
      </Field>
    );
    expect(screen.getByTestId('fake-body')).toBeInTheDocument();
  });
});
