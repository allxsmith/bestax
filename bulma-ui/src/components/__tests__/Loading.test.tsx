import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Loading } from '../Loading';

describe('Loading', () => {
  describe('rendering', () => {
    it('renders nothing when not active', () => {
      const { container } = render(<Loading />);
      expect(container.querySelector('.loading')).not.toBeInTheDocument();
    });

    it('renders nothing when active is false', () => {
      const { container } = render(<Loading active={false} />);
      expect(container.querySelector('.loading')).not.toBeInTheDocument();
    });

    it('renders when active is true', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading')).toBeInTheDocument();
    });

    it('renders loading overlay', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading-overlay')).toBeInTheDocument();
    });

    it('renders loading content', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading-content')).toBeInTheDocument();
    });

    it('renders loading icon', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading-icon')).toBeInTheDocument();
    });

    it('renders children as loading text', () => {
      render(<Loading active>Loading data...</Loading>);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('renders loading text container when children provided', () => {
      const { container } = render(<Loading active>Loading...</Loading>);
      expect(container.querySelector('.loading-text')).toBeInTheDocument();
    });

    it('does not render loading text when no children', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading-text')).not.toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('applies is-active class when active', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading')).toHaveClass('is-active');
    });
  });

  describe('full page mode', () => {
    it('applies is-full-page class when isFullPage is true', () => {
      const { container } = render(<Loading active isFullPage />);
      expect(container.querySelector('.loading')).toHaveClass('is-full-page');
    });

    it('does not apply is-full-page class when isFullPage is false', () => {
      const { container } = render(<Loading active isFullPage={false} />);
      expect(container.querySelector('.loading')).not.toHaveClass(
        'is-full-page'
      );
    });
  });

  describe('sizes', () => {
    it.each(['small', 'medium', 'large'] as const)(
      'applies is-%s class to icon when size="%s"',
      size => {
        const { container } = render(<Loading active size={size} />);
        expect(container.querySelector('.loading-icon')).toHaveClass(
          `is-${size}`
        );
      }
    );

    it('does not apply size class when no size prop', () => {
      const { container } = render(<Loading active />);
      const icon = container.querySelector('.loading-icon');
      expect(icon).not.toHaveClass('is-small');
      expect(icon).not.toHaveClass('is-medium');
      expect(icon).not.toHaveClass('is-large');
    });
  });

  describe('colors', () => {
    it.each(['primary', 'link', 'info', 'success', 'warning', 'danger'] as const)(
      'applies is-%s class to loading element when color="%s"',
      color => {
        const { container } = render(<Loading active color={color} />);
        expect(container.querySelector('.loading')).toHaveClass(`is-${color}`);
      }
    );

    it('does not apply color class when color prop is omitted', () => {
      const { container } = render(<Loading active />);
      const loading = container.querySelector('.loading');
      expect(loading).not.toHaveClass('is-primary');
      expect(loading).not.toHaveClass('is-link');
      expect(loading).not.toHaveClass('is-info');
      expect(loading).not.toHaveClass('is-success');
      expect(loading).not.toHaveClass('is-warning');
      expect(loading).not.toHaveClass('is-danger');
    });

    it('combines color with other classes correctly', () => {
      const { container } = render(
        <Loading active color="primary" isFullPage className="custom" />
      );
      const loading = container.querySelector('.loading');
      expect(loading).toHaveClass(
        'loading',
        'is-active',
        'is-full-page',
        'is-primary',
        'custom'
      );
    });
  });

  describe('cancel functionality', () => {
    it('renders cancel button when canCancel is true', () => {
      render(<Loading active canCancel />);
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('does not render cancel button when canCancel is false', () => {
      render(<Loading active canCancel={false} />);
      expect(
        screen.queryByRole('button', { name: /cancel/i })
      ).not.toBeInTheDocument();
    });

    it('does not render cancel button by default', () => {
      render(<Loading active />);
      expect(
        screen.queryByRole('button', { name: /cancel/i })
      ).not.toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
      const handleCancel = jest.fn();
      render(<Loading active canCancel onCancel={handleCancel} />);

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when overlay is clicked', () => {
      const handleCancel = jest.fn();
      const { container } = render(
        <Loading active canCancel onCancel={handleCancel} />
      );

      fireEvent.click(container.querySelector('.loading-overlay')!);
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onCancel on overlay click when canCancel is false', () => {
      const handleCancel = jest.fn();
      const { container } = render(
        <Loading active canCancel={false} onCancel={handleCancel} />
      );

      fireEvent.click(container.querySelector('.loading-overlay')!);
      expect(handleCancel).not.toHaveBeenCalled();
    });

    it('calls onCancel when Escape key is pressed', () => {
      const handleCancel = jest.fn();
      render(<Loading active canCancel onCancel={handleCancel} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onCancel on Escape when canCancel is false', () => {
      const handleCancel = jest.fn();
      render(<Loading active canCancel={false} onCancel={handleCancel} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleCancel).not.toHaveBeenCalled();
    });

    it('does not call onCancel on Escape when not active', () => {
      const handleCancel = jest.fn();
      render(<Loading active={false} canCancel onCancel={handleCancel} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleCancel).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has role="alert"', () => {
      render(<Loading active />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-busy="true"', () => {
      render(<Loading active />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-label="Loading"', () => {
      render(<Loading active />);
      expect(screen.getByRole('alert')).toHaveAttribute(
        'aria-label',
        'Loading'
      );
    });

    it('overlay has aria-hidden="true"', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading-overlay')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    it('cancel button has aria-label', () => {
      render(<Loading active canCancel />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Cancel loading'
      );
    });
  });

  describe('className handling', () => {
    it('applies custom className', () => {
      const { container } = render(<Loading active className="custom-class" />);
      expect(container.querySelector('.loading')).toHaveClass('custom-class');
    });

    it('applies overlayClassName', () => {
      const { container } = render(
        <Loading active overlayClassName="custom-overlay" />
      );
      expect(container.querySelector('.loading-overlay')).toHaveClass(
        'custom-overlay'
      );
    });

    it('applies iconClassName', () => {
      const { container } = render(
        <Loading active iconClassName="custom-icon" />
      );
      expect(container.querySelector('.loading-icon')).toHaveClass(
        'custom-icon'
      );
    });

    it('combines multiple classes correctly', () => {
      const { container } = render(
        <Loading active isFullPage className="custom-class" />
      );
      const loading = container.querySelector('.loading');
      expect(loading).toHaveClass(
        'loading',
        'is-active',
        'is-full-page',
        'custom-class'
      );
    });
  });

  describe('Bulma helper classes', () => {
    it('applies Bulma helper classes from props', () => {
      const { container } = render(<Loading active m="2" p="3" />);
      const loading = container.querySelector('.loading');
      expect(loading).toHaveClass('m-2', 'p-3');
    });
  });

  describe('body scroll lock', () => {
    afterEach(() => {
      document.body.style.overflow = '';
    });

    it('sets body overflow to hidden when full page and active', () => {
      render(<Loading active isFullPage />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('does not set body overflow when not full page', () => {
      render(<Loading active />);
      expect(document.body.style.overflow).toBe('');
    });

    it('does not set body overflow when not active', () => {
      render(<Loading active={false} isFullPage />);
      expect(document.body.style.overflow).toBe('');
    });

    it('restores body overflow on unmount', () => {
      const { unmount } = render(<Loading active isFullPage />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('indicator prop', () => {
    it('renders custom indicator when indicator prop is provided', () => {
      const { container } = render(
        <Loading active indicator={<span data-testid="custom-icon">★</span>} />
      );
      expect(container.querySelector('.loading-icon-custom')).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('does not render default spinner when indicator is provided', () => {
      const { container } = render(
        <Loading active indicator={<span>★</span>} />
      );
      expect(container.querySelector('.loading-icon')).not.toBeInTheDocument();
    });

    it('renders default spinner when no indicator', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading-icon')).toBeInTheDocument();
      expect(container.querySelector('.loading-icon-custom')).not.toBeInTheDocument();
    });

    it('renders children alongside custom indicator', () => {
      const { container } = render(
        <Loading active indicator={<span>★</span>}>Loading text</Loading>
      );
      expect(container.querySelector('.loading-icon-custom')).toBeInTheDocument();
      expect(screen.getByText('Loading text')).toBeInTheDocument();
    });
  });

  describe('overlay prop', () => {
    it.each(['light', 'dark', 'opaque'] as const)(
      'applies is-%s class when overlay="%s"',
      overlay => {
        const { container } = render(<Loading active overlay={overlay} />);
        expect(container.querySelector('.loading')).toHaveClass(`is-${overlay}`);
      }
    );

    it('does not apply overlay class when no overlay prop', () => {
      const { container } = render(<Loading active />);
      const loading = container.querySelector('.loading');
      expect(loading).not.toHaveClass('is-light');
      expect(loading).not.toHaveClass('is-dark');
      expect(loading).not.toHaveClass('is-opaque');
    });
  });

  describe('is-cancelable class', () => {
    it('applies is-cancelable class when canCancel is true', () => {
      const { container } = render(<Loading active canCancel />);
      expect(container.querySelector('.loading')).toHaveClass('is-cancelable');
    });

    it('does not apply is-cancelable class when canCancel is false', () => {
      const { container } = render(<Loading active canCancel={false} />);
      expect(container.querySelector('.loading')).not.toHaveClass('is-cancelable');
    });

    it('does not apply is-cancelable class by default', () => {
      const { container } = render(<Loading active />);
      expect(container.querySelector('.loading')).not.toHaveClass('is-cancelable');
    });
  });

  describe('HTML attributes', () => {
    it('passes through HTML attributes', () => {
      const { container } = render(
        <Loading active data-testid="loading" id="my-loading" />
      );
      const loading = container.querySelector('.loading');
      expect(loading).toHaveAttribute('data-testid', 'loading');
      expect(loading).toHaveAttribute('id', 'my-loading');
    });
  });
});
