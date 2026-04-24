import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Input } from '../Input';
import { ConfigProvider } from '../../helpers/Config';

describe('Input', () => {
  describe('rendering', () => {
    it('renders an input inside a field', () => {
      const { container } = render(<Input data-testid="input" />);
      expect(screen.getByTestId('input')).toBeInTheDocument();
      expect(container.querySelector('.field')).toBeInTheDocument();
      expect(container.querySelector('.control')).toBeInTheDocument();
      expect(container.querySelector('.input')).toBeInTheDocument();
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
      const { container } = render(
        <Input color="danger" data-testid="input" />
      );
      expect(screen.getByTestId('input')).toHaveClass('is-danger');
    });

    it('passes size to input', () => {
      const { container } = render(<Input size="large" data-testid="input" />);
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
      expect(container.querySelector('.bulma-input')).toBeInTheDocument();
      expect(container.querySelector('.bulma-help')).toBeInTheDocument();
      expect(container.querySelector('.bulma-label')).toBeInTheDocument();
    });
  });
});
