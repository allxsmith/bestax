import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextAreaField } from '../TextAreaField';
import { ConfigProvider } from '../../helpers/Config';

describe('TextAreaField', () => {
  describe('rendering', () => {
    it('renders a textarea inside a field', () => {
      const { container } = render(
        <TextAreaField data-testid="textarea" />
      );
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
      expect(container.querySelector('.field')).toBeInTheDocument();
      expect(container.querySelector('.control')).toBeInTheDocument();
      expect(container.querySelector('.textarea')).toBeInTheDocument();
    });

    it('renders with a label', () => {
      const { container } = render(
        <TextAreaField label="Bio" data-testid="textarea" />
      );
      expect(container.querySelector('.label')).toHaveTextContent('Bio');
    });

    it('renders without label when not provided', () => {
      const { container } = render(
        <TextAreaField data-testid="textarea" />
      );
      expect(container.querySelector('.label')).not.toBeInTheDocument();
    });
  });

  describe('message', () => {
    it('renders help message', () => {
      const { container } = render(
        <TextAreaField message="Max 500 chars" data-testid="textarea" />
      );
      expect(container.querySelector('.help')).toHaveTextContent(
        'Max 500 chars'
      );
    });

    it('renders help message with color', () => {
      const { container } = render(
        <TextAreaField
          message="Too long"
          messageColor="warning"
          data-testid="textarea"
        />
      );
      const help = container.querySelector('.help');
      expect(help).toHaveTextContent('Too long');
      expect(help).toHaveClass('is-warning');
    });

    it('does not render help when message is not provided', () => {
      const { container } = render(
        <TextAreaField data-testid="textarea" />
      );
      expect(container.querySelector('.help')).not.toBeInTheDocument();
    });
  });

  describe('textarea props', () => {
    it('passes color to textarea', () => {
      render(<TextAreaField color="danger" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('is-danger');
    });

    it('passes size to textarea', () => {
      render(<TextAreaField size="large" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('is-large');
    });

    it('passes placeholder', () => {
      render(<TextAreaField placeholder="Write here..." />);
      expect(screen.getByPlaceholderText('Write here...')).toBeInTheDocument();
    });

    it('passes disabled', () => {
      render(<TextAreaField disabled data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toBeDisabled();
    });

    it('passes readOnly', () => {
      render(<TextAreaField readOnly data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('readonly');
    });

    it('passes rows', () => {
      render(<TextAreaField rows={6} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '6');
    });

    it('handles controlled value', () => {
      render(<TextAreaField value="hello" onChange={() => {}} />);
      expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
    });

    it('calls onChange', () => {
      const handleChange = jest.fn();
      render(
        <TextAreaField onChange={handleChange} data-testid="textarea" />
      );
      fireEvent.change(screen.getByTestId('textarea'), {
        target: { value: 'test' },
      });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('control props', () => {
    it('applies isLoading to control', () => {
      const { container } = render(
        <TextAreaField isLoading data-testid="textarea" />
      );
      expect(container.querySelector('.control')).toHaveClass('is-loading');
    });
  });

  describe('horizontal layout', () => {
    it('applies is-horizontal to field', () => {
      const { container } = render(
        <TextAreaField horizontal label="Bio" data-testid="textarea" />
      );
      expect(container.querySelector('.field')).toHaveClass('is-horizontal');
    });
  });

  describe('custom classNames', () => {
    it('applies fieldClassName to field', () => {
      const { container } = render(
        <TextAreaField
          fieldClassName="custom-field"
          data-testid="textarea"
        />
      );
      expect(container.querySelector('.field')).toHaveClass('custom-field');
    });

    it('applies controlClassName to control', () => {
      const { container } = render(
        <TextAreaField
          controlClassName="custom-control"
          data-testid="textarea"
        />
      );
      expect(container.querySelector('.control')).toHaveClass(
        'custom-control'
      );
    });

    it('applies className to textarea', () => {
      render(
        <TextAreaField className="custom-textarea" data-testid="textarea" />
      );
      expect(screen.getByTestId('textarea')).toHaveClass('custom-textarea');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to the textarea element', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<TextAreaField ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });
  });

  describe('classPrefix', () => {
    it('applies prefix to field, control, textarea, and help classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <TextAreaField
            label="Bio"
            message="Required"
            messageColor="danger"
            data-testid="textarea"
          />
        </ConfigProvider>
      );
      expect(container.querySelector('.bulma-field')).toBeInTheDocument();
      expect(container.querySelector('.bulma-control')).toBeInTheDocument();
      expect(container.querySelector('.bulma-textarea')).toBeInTheDocument();
      expect(container.querySelector('.bulma-help')).toBeInTheDocument();
      expect(container.querySelector('.bulma-label')).toBeInTheDocument();
    });
  });
});
