import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextArea } from '../TextArea';
import { ConfigProvider } from '../../helpers/Config';

describe('TextArea', () => {
  describe('rendering', () => {
    it('renders a textarea inside a field', () => {
      const { container } = render(
        <TextArea data-testid="textarea" />
      );
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
      expect(container.querySelector('.field')).toBeInTheDocument();
      expect(container.querySelector('.control')).toBeInTheDocument();
      expect(container.querySelector('.textarea')).toBeInTheDocument();
    });

    it('renders with a label', () => {
      const { container } = render(
        <TextArea label="Bio" data-testid="textarea" />
      );
      expect(container.querySelector('.label')).toHaveTextContent('Bio');
    });

    it('renders without label when not provided', () => {
      const { container } = render(
        <TextArea data-testid="textarea" />
      );
      expect(container.querySelector('.label')).not.toBeInTheDocument();
    });
  });

  describe('message', () => {
    it('renders help message', () => {
      const { container } = render(
        <TextArea message="Max 500 chars" data-testid="textarea" />
      );
      expect(container.querySelector('.help')).toHaveTextContent(
        'Max 500 chars'
      );
    });

    it('renders help message with color', () => {
      const { container } = render(
        <TextArea
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
        <TextArea data-testid="textarea" />
      );
      expect(container.querySelector('.help')).not.toBeInTheDocument();
    });
  });

  describe('textarea props', () => {
    it('passes color to textarea', () => {
      render(<TextArea color="danger" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('is-danger');
    });

    it('passes size to textarea', () => {
      render(<TextArea size="large" data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveClass('is-large');
    });

    it('passes placeholder', () => {
      render(<TextArea placeholder="Write here..." />);
      expect(screen.getByPlaceholderText('Write here...')).toBeInTheDocument();
    });

    it('passes disabled', () => {
      render(<TextArea disabled data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toBeDisabled();
    });

    it('passes readOnly', () => {
      render(<TextArea readOnly data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('readonly');
    });

    it('passes rows', () => {
      render(<TextArea rows={6} data-testid="textarea" />);
      expect(screen.getByTestId('textarea')).toHaveAttribute('rows', '6');
    });

    it('handles controlled value', () => {
      render(<TextArea value="hello" onChange={() => {}} />);
      expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
    });

    it('calls onChange', () => {
      const handleChange = jest.fn();
      render(
        <TextArea onChange={handleChange} data-testid="textarea" />
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
        <TextArea isLoading data-testid="textarea" />
      );
      expect(container.querySelector('.control')).toHaveClass('is-loading');
    });
  });

  describe('horizontal layout', () => {
    it('applies is-horizontal to field', () => {
      const { container } = render(
        <TextArea horizontal label="Bio" data-testid="textarea" />
      );
      expect(container.querySelector('.field')).toHaveClass('is-horizontal');
    });
  });

  describe('custom classNames', () => {
    it('applies fieldClassName to field', () => {
      const { container } = render(
        <TextArea
          fieldClassName="custom-field"
          data-testid="textarea"
        />
      );
      expect(container.querySelector('.field')).toHaveClass('custom-field');
    });

    it('applies controlClassName to control', () => {
      const { container } = render(
        <TextArea
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
        <TextArea className="custom-textarea" data-testid="textarea" />
      );
      expect(screen.getByTestId('textarea')).toHaveClass('custom-textarea');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to the textarea element', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<TextArea ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });
  });

  describe('classPrefix', () => {
    it('applies prefix to field, control, textarea, and help classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <TextArea
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
