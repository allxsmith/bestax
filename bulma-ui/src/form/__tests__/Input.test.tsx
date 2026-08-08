import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Input } from '../Input';
import { Field } from '../Field';
import { ConfigProvider } from '../../helpers/Config';

describe('Input', () => {
  describe('rendering', () => {
    it('renders an input inside a field', () => {
      const { container } = render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('input');
      expect(container.querySelector('.field')).toBeInTheDocument();
      expect(container.querySelector('.control')).toBeInTheDocument();
    });

    it('renders with a label', () => {
      const { container } = render(
        <Input label="Username" data-testid="input" />
      );
      expect(container.querySelector('.label')).toHaveTextContent('Username');
    });

    it('renders without label when not provided', () => {
      const { container } = render(<Input data-testid="input" />);
      expect(container.querySelector('.label')).not.toBeInTheDocument();
    });
  });

  describe('message', () => {
    it('renders help message', () => {
      const { container } = render(
        <Input message="Required field" data-testid="input" />
      );
      expect(container.querySelector('.help')).toHaveTextContent(
        'Required field'
      );
    });

    it('renders help message with color', () => {
      const { container } = render(
        <Input
          message="Invalid email"
          messageColor="danger"
          data-testid="input"
        />
      );
      const help = container.querySelector('.help');
      expect(help).toHaveTextContent('Invalid email');
      expect(help).toHaveClass('is-danger');
    });

    it('does not render help when message is not provided', () => {
      const { container } = render(<Input data-testid="input" />);
      expect(container.querySelector('.help')).not.toBeInTheDocument();
    });
  });

  describe('input props', () => {
    it('passes color to input', () => {
      render(<Input color="danger" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('is-danger');
    });

    it('passes size to input', () => {
      render(<Input size="large" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('is-large');
    });

    it('passes placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('passes disabled', () => {
      render(<Input disabled data-testid="input" />);
      expect(screen.getByTestId('input')).toBeDisabled();
    });

    it('passes readOnly', () => {
      render(<Input readOnly data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('readonly');
    });

    it('handles controlled value', () => {
      render(<Input value="hello" onChange={() => {}} />);
      expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
    });

    it('calls onChange', () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} data-testid="input" />);
      fireEvent.change(screen.getByTestId('input'), {
        target: { value: 'test' },
      });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('control props', () => {
    it('renders with icon left name', () => {
      const { container } = render(
        <Input iconLeftName="user" data-testid="input" />
      );
      expect(container.querySelector('.control')).toHaveClass('has-icons-left');
    });

    it('renders with icon right name', () => {
      const { container } = render(
        <Input iconRightName="check" data-testid="input" />
      );
      expect(container.querySelector('.control')).toHaveClass(
        'has-icons-right'
      );
    });

    it('applies isLoading to control', () => {
      const { container } = render(<Input isLoading data-testid="input" />);
      expect(container.querySelector('.control')).toHaveClass('is-loading');
    });

    it('applies isExpanded to control', () => {
      const { container } = render(<Input isExpanded data-testid="input" />);
      expect(container.querySelector('.control')).toHaveClass('is-expanded');
    });
  });

  describe('horizontal layout', () => {
    it('applies is-horizontal to field', () => {
      const { container } = render(
        <Input horizontal label="Name" data-testid="input" />
      );
      expect(container.querySelector('.field')).toHaveClass('is-horizontal');
    });
  });

  describe('custom classNames', () => {
    it('applies fieldClassName to field', () => {
      const { container } = render(
        <Input fieldClassName="custom-field" data-testid="input" />
      );
      expect(container.querySelector('.field')).toHaveClass('custom-field');
    });

    it('applies controlClassName to control', () => {
      const { container } = render(
        <Input controlClassName="custom-control" data-testid="input" />
      );
      expect(container.querySelector('.control')).toHaveClass('custom-control');
    });

    it('applies className to input', () => {
      render(<Input className="custom-input" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveClass('custom-input');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to the input element', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('classPrefix', () => {
    it('applies prefix to field, control, input, and help classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Input
            label="Name"
            message="Required"
            messageColor="danger"
            data-testid="input"
          />
        </ConfigProvider>
      );
      expect(container.querySelector('.bulma-field')).toBeInTheDocument();
      expect(container.querySelector('.bulma-control')).toBeInTheDocument();
      expect(screen.getByTestId('input')).toHaveClass('bulma-input');
      expect(container.querySelector('.bulma-help')).toBeInTheDocument();
      expect(container.querySelector('.bulma-label')).toBeInTheDocument();
    });
  });
});

describe('Input label association (#368)', () => {
  it('associates the label with the input via htmlFor/id', () => {
    const { container } = render(<Input label="Username" />);
    const input = screen.getByLabelText('Username');
    expect(input.tagName).toBe('INPUT');
    expect(input.id).toBeTruthy();
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      input.id
    );
  });

  it('uses a user-supplied id as the association target', () => {
    const { container } = render(<Input label="Username" id="my-input" />);
    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('id', 'my-input');
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      'my-input'
    );
  });

  it('lets an explicit labelProps.htmlFor override the association', () => {
    const { container } = render(
      <Input label="Username" id="my-input" labelProps={{ htmlFor: 'other' }} />
    );
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      'other'
    );
    expect(container.querySelector('input')).toHaveAttribute('id', 'my-input');
  });

  it('injects no id when labelProps.htmlFor is set without an id', () => {
    const { container } = render(
      <Input label="Username" labelProps={{ htmlFor: 'elsewhere' }} />
    );
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      'elsewhere'
    );
    expect(container.querySelector('input')).not.toHaveAttribute('id');
  });

  it('injects no id without a label', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('input')).not.toHaveAttribute('id');
  });

  it('adopts the outer Field label inside a Field, dropping its own', () => {
    const { container } = render(
      <Field label="Outer">
        <Input label="Dropped" />
      </Field>
    );
    expect(container.querySelectorAll('label').length).toBe(1);
    const input = screen.getByLabelText('Outer');
    expect(input.id).toBeTruthy();
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      input.id
    );
  });

  it('associates in horizontal layout', () => {
    const { container } = render(<Input label="Username" horizontal />);
    const input = screen.getByLabelText('Username');
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      input.id
    );
  });
});
