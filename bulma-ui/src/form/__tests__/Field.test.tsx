import React from 'react';
import { render, screen } from '@testing-library/react';
import Field, { FieldLabel, FieldBody } from '../Field';
import { Control } from '../Control';
import InputBase from '../InputBase';
import SelectBase from '../SelectBase';
import TextAreaBase from '../TextAreaBase';
import { ConfigProvider } from '../../helpers/Config';

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
    expect(label).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(label).toHaveClass('extra-label');
  });

  it('horizontal with element whose type is null (covers ?. nullish branch)', () => {
    // Construct a React-element-like object whose `type` is null. This still
    // passes React.isValidElement (which only checks $$typeof), so the Field
    // logic's `c.type?.displayName` short-circuits via the `?.` nullish branch.
    // React itself will refuse to render the fake child, so we silence and catch.
    const real = React.createElement('div');
    const fake = { ...real, type: null } as unknown as React.ReactElement;
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    try {
      expect(() =>
        render(
          <Field horizontal label="Hi">
            {fake}
          </Field>
        )
      ).toThrow();
    } finally {
      errorSpy.mockRestore();
    }
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

  it('adds is-normal class for labelSize "normal" in horizontal layout', () => {
    render(<Field label="NormalSize" labelSize="normal" horizontal />);
    const fieldLabel = screen.getByText('NormalSize').closest('.field-label');
    expect(fieldLabel?.className).toMatch(/is-normal/);
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
    expect(label).toHaveStyle({ color: 'rgb(0, 0, 255)' });
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

  it('applies classPrefix when provided via ConfigProvider', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <Field label="Test Label">Test content</Field>
      </ConfigProvider>
    );
    const field = container.querySelector('.bulma-field');
    expect(field).toBeInTheDocument();
    expect(field).not.toHaveClass('field');

    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('bulma-label');
    expect(label).not.toHaveClass('label');
  });

  it('applies classPrefix to FieldLabel and FieldBody components', () => {
    render(
      <ConfigProvider classPrefix="custom-">
        <Field>
          <Field.Label data-testid="field-label">Label with prefix</Field.Label>
          <Field.Body data-testid="field-body">Body with prefix</Field.Body>
        </Field>
      </ConfigProvider>
    );

    const fieldLabel = screen.getByTestId('field-label');
    const fieldBody = screen.getByTestId('field-body');

    expect(fieldLabel).toHaveClass('custom-field-label');
    expect(fieldLabel).not.toHaveClass('field-label');
    expect(fieldBody).toHaveClass('custom-field-body');
    expect(fieldBody).not.toHaveClass('field-body');
  });

  it('applies classPrefix to horizontal field labels', () => {
    render(
      <ConfigProvider classPrefix="prefix-">
        <Field horizontal label="Horizontal Label">
          <input type="text" />
        </Field>
      </ConfigProvider>
    );

    const label = screen.getByText('Horizontal Label');
    expect(label).toHaveClass('prefix-label');
    expect(label).not.toHaveClass('label');

    const fieldLabel = label.closest('.prefix-field-label');
    expect(fieldLabel).toBeInTheDocument();
    expect(fieldLabel).not.toHaveClass('field-label');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Field label="Test">Content</Field>
        </ConfigProvider>
      );
      const field = container.querySelector('.bulma-field');
      expect(field).toBeInTheDocument();
      expect(field).toHaveClass('bulma-field');
    });

    it('uses default classes when no prefix is provided', () => {
      const { container } = render(<Field label="Test">Content</Field>);
      const field = container.querySelector('.field');
      expect(field).toBeInTheDocument();
      expect(field).toHaveClass('field');
    });

    it('uses default classes when classPrefix is undefined', () => {
      const { container } = render(
        <ConfigProvider classPrefix={undefined}>
          <Field label="Test">Content</Field>
        </ConfigProvider>
      );
      const field = container.querySelector('.field');
      expect(field).toBeInTheDocument();
      expect(field).toHaveClass('field');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Field grouped m="2" data-testid="test-field">
            Content
          </Field>
        </ConfigProvider>
      );

      const field = container.querySelector('.bulma-field');
      expect(field).toBeInTheDocument();
      expect(field).toHaveClass('bulma-field');
      expect(field).toHaveClass('bulma-is-grouped');
      expect(field).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Field hasAddons p="3">
          Content
        </Field>
      );
      const field = container.querySelector('.field');
      expect(field).toHaveClass('field');
      expect(field).toHaveClass('has-addons');
      expect(field).toHaveClass('p-3');
    });
  });
});

describe('Compound components', () => {
  test('Field.Control is the Control component', () => {
    expect(Field.Control).toBe(Control);
  });

  test('Field.Label is the FieldLabel component', () => {
    expect(Field.Label).toBe(FieldLabel);
  });

  test('Field.Body is the FieldBody component', () => {
    expect(Field.Body).toBe(FieldBody);
  });

  test('renders a horizontal field through Field.Label and Field.Body', () => {
    const { container } = render(
      <Field horizontal>
        <Field.Label>Name</Field.Label>
        <Field.Body>
          <Field.Control>
            <input className="input" />
          </Field.Control>
        </Field.Body>
      </Field>
    );
    expect(container.querySelector('.field-label')).toBeInTheDocument();
    expect(container.querySelector('.field-body')).toBeInTheDocument();
    expect(container.querySelector('.control')).toBeInTheDocument();
  });
});

describe('label auto-association (#495)', () => {
  const labelEl = (container: HTMLElement) =>
    container.querySelector('label.label') as HTMLElement;

  it('associates the label with a composed InputBase', () => {
    const { container } = render(
      <Field label="Email">
        <Control>
          <InputBase type="email" />
        </Control>
      </Field>
    );
    const input = screen.getByLabelText('Email');
    expect(input.tagName).toBe('INPUT');
    expect(input.id).toBeTruthy();
    expect(labelEl(container)).toHaveAttribute('for', input.id);
  });

  it('associates in horizontal layout', () => {
    const { container } = render(
      <Field horizontal label="Email">
        <Control>
          <InputBase type="email" />
        </Control>
      </Field>
    );
    const input = screen.getByLabelText('Email');
    expect(labelEl(container)).toHaveAttribute('for', input.id);
  });

  it('associates a composed SelectBase via the inner select', () => {
    const { container } = render(
      <Field label="Country">
        <Control>
          <SelectBase>
            <option value="us">United States</option>
          </SelectBase>
        </Control>
      </Field>
    );
    const select = screen.getByLabelText('Country');
    expect(select.tagName).toBe('SELECT');
    expect(container.querySelector('div.select')).not.toHaveAttribute('id');
    expect(labelEl(container)).toHaveAttribute('for', select.id);
  });

  it('associates a composed TextAreaBase', () => {
    const { container } = render(
      <Field label="Bio">
        <Control>
          <TextAreaBase />
        </Control>
      </Field>
    );
    const textarea = screen.getByLabelText('Bio');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(labelEl(container)).toHaveAttribute('for', textarea.id);
  });

  it('keeps a user id on the base; the label still points at its own target', () => {
    const { container } = render(
      <Field label="Email">
        <Control>
          <InputBase id="mine" />
        </Control>
      </Field>
    );
    const input = container.querySelector('input') as HTMLElement;
    expect(input).toHaveAttribute('id', 'mine');
    const forValue = labelEl(container).getAttribute('for');
    expect(forValue).toBeTruthy();
    expect(forValue).not.toBe('mine');
  });

  it('an explicit labelProps.htmlFor takes over the association', () => {
    const { container } = render(
      <Field label="Email" labelProps={{ htmlFor: 'custom' }}>
        <Control>
          <InputBase id="custom" />
        </Control>
      </Field>
    );
    expect(labelEl(container)).toHaveAttribute('for', 'custom');
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'custom');
  });

  it('labelProps={{ htmlFor: undefined }} opts out entirely', () => {
    const { container } = render(
      <Field label="Email" labelProps={{ htmlFor: undefined }}>
        <Control>
          <InputBase />
        </Control>
      </Field>
    );
    expect(labelEl(container)).not.toHaveAttribute('for');
    expect(container.querySelector('input')).not.toHaveAttribute('id');
  });

  it('skips association for grouped fields', () => {
    const { container } = render(
      <Field label="Range" grouped>
        <Control>
          <InputBase />
        </Control>
        <Control>
          <InputBase />
        </Control>
      </Field>
    );
    expect(labelEl(container)).not.toHaveAttribute('for');
    container.querySelectorAll('input').forEach(input => {
      expect(input).not.toHaveAttribute('id');
    });
  });

  it('skips association for hasAddons fields', () => {
    const { container } = render(
      <Field label="Search" hasAddons>
        <Control>
          <InputBase />
        </Control>
      </Field>
    );
    expect(labelEl(container)).not.toHaveAttribute('for');
    expect(container.querySelector('input')).not.toHaveAttribute('id');
  });

  it('a nested unlabeled Field shadows the outer id', () => {
    const { container } = render(
      <Field label="Outer">
        <Field>
          <Control>
            <InputBase />
          </Control>
        </Field>
      </Field>
    );
    expect(container.querySelector('input')).not.toHaveAttribute('id');
  });

  it('a labeled Field with no adopting control renders the for anyway', () => {
    const { container } = render(<Field label="Only text">plain</Field>);
    expect(labelEl(container).getAttribute('for')).toBeTruthy();
  });
});
