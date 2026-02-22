import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Collapse } from '../Collapse';

describe('Collapse', () => {
  describe('rendering', () => {
    it('renders the collapse container', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>}>Content</Collapse>
      );
      expect(container.querySelector('.collapse')).toBeInTheDocument();
    });

    it('renders the trigger', () => {
      render(<Collapse trigger={<button>Toggle</button>}>Content</Collapse>);
      expect(screen.getByText('Toggle')).toBeInTheDocument();
    });

    it('renders the trigger wrapper with role="button"', () => {
      const { container } = render(
        <Collapse trigger={<span>Toggle</span>}>Content</Collapse>
      );
      expect(container.querySelector('.collapse-trigger')).toHaveAttribute(
        'role',
        'button'
      );
    });

    it('renders children in content area', () => {
      render(
        <Collapse trigger={<button>Toggle</button>} defaultOpen>
          <p>Content text</p>
        </Collapse>
      );
      expect(screen.getByText('Content text')).toBeInTheDocument();
    });

    it('renders collapse-content wrapper', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>}>Content</Collapse>
      );
      expect(container.querySelector('.collapse-content')).toBeInTheDocument();
    });
  });

  describe('uncontrolled mode', () => {
    it('starts closed by default', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>}>Content</Collapse>
      );
      expect(container.querySelector('.collapse')).not.toHaveClass('is-active');
    });

    it('starts open when defaultOpen is true', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} defaultOpen>
          Content
        </Collapse>
      );
      expect(container.querySelector('.collapse')).toHaveClass('is-active');
    });

    it('toggles open state on trigger click', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>}>Content</Collapse>
      );

      const trigger = container.querySelector('.collapse-trigger')!;

      expect(container.querySelector('.collapse')).not.toHaveClass('is-active');
      fireEvent.click(trigger);
      expect(container.querySelector('.collapse')).toHaveClass('is-active');
      fireEvent.click(trigger);
      expect(container.querySelector('.collapse')).not.toHaveClass('is-active');
    });
  });

  describe('controlled mode', () => {
    it('respects open prop', () => {
      const { container, rerender } = render(
        <Collapse trigger={<button>Toggle</button>} open={false}>
          Content
        </Collapse>
      );

      expect(container.querySelector('.collapse')).not.toHaveClass('is-active');

      rerender(
        <Collapse trigger={<button>Toggle</button>} open={true}>
          Content
        </Collapse>
      );

      expect(container.querySelector('.collapse')).toHaveClass('is-active');
    });

    it('does not toggle internally when controlled', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} open={false}>
          Content
        </Collapse>
      );

      const trigger = container.querySelector('.collapse-trigger')!;
      fireEvent.click(trigger);

      // Should still be closed because it's controlled
      expect(container.querySelector('.collapse')).not.toHaveClass('is-active');
    });
  });

  describe('callbacks', () => {
    it('calls onOpen when opening', () => {
      const handleOpen = jest.fn();
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} onOpen={handleOpen}>
          Content
        </Collapse>
      );

      const trigger = container.querySelector('.collapse-trigger')!;
      fireEvent.click(trigger);

      expect(handleOpen).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when closing', () => {
      const handleClose = jest.fn();
      const { container } = render(
        <Collapse
          trigger={<button>Toggle</button>}
          defaultOpen
          onClose={handleClose}
        >
          Content
        </Collapse>
      );

      const trigger = container.querySelector('.collapse-trigger')!;
      fireEvent.click(trigger);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not call callbacks when controlled', () => {
      const handleOpen = jest.fn();
      const handleClose = jest.fn();
      const { container } = render(
        <Collapse
          trigger={<button>Toggle</button>}
          open={false}
          onOpen={handleOpen}
          onClose={handleClose}
        >
          Content
        </Collapse>
      );

      const trigger = container.querySelector('.collapse-trigger')!;
      fireEvent.click(trigger);

      expect(handleOpen).not.toHaveBeenCalled();
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interaction', () => {
    it('toggles on Enter key', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>}>Content</Collapse>
      );

      const trigger = container.querySelector('.collapse-trigger')!;

      expect(container.querySelector('.collapse')).not.toHaveClass('is-active');
      fireEvent.keyDown(trigger, { key: 'Enter' });
      expect(container.querySelector('.collapse')).toHaveClass('is-active');
    });

    it('toggles on Space key', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>}>Content</Collapse>
      );

      const trigger = container.querySelector('.collapse-trigger')!;

      expect(container.querySelector('.collapse')).not.toHaveClass('is-active');
      fireEvent.keyDown(trigger, { key: ' ' });
      expect(container.querySelector('.collapse')).toHaveClass('is-active');
    });

    it('does not toggle on other keys', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>}>Content</Collapse>
      );

      const trigger = container.querySelector('.collapse-trigger')!;

      expect(container.querySelector('.collapse')).not.toHaveClass('is-active');
      fireEvent.keyDown(trigger, { key: 'Tab' });
      expect(container.querySelector('.collapse')).not.toHaveClass('is-active');
    });
  });

  describe('accessibility', () => {
    it('trigger has tabIndex="0"', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>}>Content</Collapse>
      );
      expect(container.querySelector('.collapse-trigger')).toHaveAttribute(
        'tabIndex',
        '0'
      );
    });

    it('trigger has aria-expanded="false" when closed', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>}>Content</Collapse>
      );
      expect(container.querySelector('.collapse-trigger')).toHaveAttribute(
        'aria-expanded',
        'false'
      );
    });

    it('trigger has aria-expanded="true" when open', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} defaultOpen>
          Content
        </Collapse>
      );
      expect(container.querySelector('.collapse-trigger')).toHaveAttribute(
        'aria-expanded',
        'true'
      );
    });

    it('trigger has aria-controls pointing to content', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} ariaId="my-collapse">
          Content
        </Collapse>
      );
      expect(container.querySelector('.collapse-trigger')).toHaveAttribute(
        'aria-controls',
        'my-collapse'
      );
      expect(container.querySelector('.collapse-content')).toHaveAttribute(
        'id',
        'my-collapse'
      );
    });

    it('content has aria-hidden="true" when closed', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>}>Content</Collapse>
      );
      expect(container.querySelector('.collapse-content')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    it('content has aria-hidden="false" when open', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} defaultOpen>
          Content
        </Collapse>
      );
      expect(container.querySelector('.collapse-content')).toHaveAttribute(
        'aria-hidden',
        'false'
      );
    });
  });

  describe('animation', () => {
    it('defaults to fade animation', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>}>Content</Collapse>
      );

      const wrapper =
        container.querySelector('.collapse-content')?.parentElement;
      expect(wrapper?.style.transition).toContain('opacity');
    });

    it('uses height transition for slide animation', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} animation="slide">
          Content
        </Collapse>
      );

      const wrapper =
        container.querySelector('.collapse-content')?.parentElement;
      expect(wrapper?.style.transition).toContain('height');
    });

    it('has no animation when animation={false}', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} animation={false}>
          Content
        </Collapse>
      );

      const wrapper =
        container.querySelector('.collapse-content')?.parentElement;
      expect(wrapper?.style.display).toBe('none');
    });

    it('shows content instantly when animation={false} and open', () => {
      const { container } = render(
        <Collapse
          trigger={<button>Toggle</button>}
          animation={false}
          defaultOpen
        >
          Content
        </Collapse>
      );

      const wrapper =
        container.querySelector('.collapse-content')?.parentElement;
      expect(wrapper?.style.display).toBe('block');
    });

    it('uses opacity for fade animation when open', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} animation="fade" defaultOpen>
          Content
        </Collapse>
      );

      const wrapper =
        container.querySelector('.collapse-content')?.parentElement;
      expect(wrapper?.style.opacity).toBe('1');
    });

    it('uses opacity 0 for fade animation when closed', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} animation="fade">
          Content
        </Collapse>
      );

      const wrapper =
        container.querySelector('.collapse-content')?.parentElement;
      expect(wrapper?.style.opacity).toBe('0');
    });
  });

  describe('position', () => {
    it('renders trigger before content by default', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>}>
          <p>Content</p>
        </Collapse>
      );

      const collapse = container.querySelector('.collapse')!;
      const children = Array.from(collapse.children);
      expect(children[0]).toHaveClass('collapse-trigger');
    });

    it('renders trigger before content with position="top"', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} position="top">
          <p>Content</p>
        </Collapse>
      );

      const collapse = container.querySelector('.collapse')!;
      const children = Array.from(collapse.children);
      expect(children[0]).toHaveClass('collapse-trigger');
    });

    it('renders trigger after content with position="bottom"', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} position="bottom">
          <p>Content</p>
        </Collapse>
      );

      const collapse = container.querySelector('.collapse')!;
      const children = Array.from(collapse.children);
      // First child should be the content wrapper, second should be trigger
      expect(children[children.length - 1]).toHaveClass('collapse-trigger');
    });
  });

  describe('className handling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} className="custom-class">
          Content
        </Collapse>
      );
      expect(container.querySelector('.collapse')).toHaveClass('custom-class');
    });

    it('applies triggerClassName', () => {
      const { container } = render(
        <Collapse
          trigger={<button>Toggle</button>}
          triggerClassName="custom-trigger"
        >
          Content
        </Collapse>
      );
      expect(container.querySelector('.collapse-trigger')).toHaveClass(
        'custom-trigger'
      );
    });

    it('applies contentClassName', () => {
      const { container } = render(
        <Collapse
          trigger={<button>Toggle</button>}
          contentClassName="custom-content"
        >
          Content
        </Collapse>
      );
      expect(container.querySelector('.collapse-content')).toHaveClass(
        'custom-content'
      );
    });

    it('applies is-active class to collapse when open', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} defaultOpen>
          Content
        </Collapse>
      );
      expect(container.querySelector('.collapse')).toHaveClass('is-active');
    });

    it('applies is-active class to content when open', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} defaultOpen>
          Content
        </Collapse>
      );
      expect(container.querySelector('.collapse-content')).toHaveClass(
        'is-active'
      );
    });
  });

  describe('Bulma helper classes', () => {
    it('applies Bulma helper classes from props', () => {
      const { container } = render(
        <Collapse trigger={<button>Toggle</button>} m="2" p="3">
          Content
        </Collapse>
      );
      const collapse = container.querySelector('.collapse');
      expect(collapse).toHaveClass('m-2', 'p-3');
    });
  });

  describe('HTML attributes', () => {
    it('passes through HTML attributes', () => {
      const { container } = render(
        <Collapse
          trigger={<button>Toggle</button>}
          data-testid="collapse"
          id="my-collapse"
        >
          Content
        </Collapse>
      );
      const collapse = container.querySelector('.collapse');
      expect(collapse).toHaveAttribute('data-testid', 'collapse');
      expect(collapse).toHaveAttribute('id', 'my-collapse');
    });
  });

  describe('complex content', () => {
    it('renders complex children', () => {
      render(
        <Collapse trigger={<button>Toggle</button>} defaultOpen>
          <div data-testid="child1">First child</div>
          <div data-testid="child2">Second child</div>
        </Collapse>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });

    it('renders complex trigger', () => {
      render(
        <Collapse
          trigger={
            <div>
              <span data-testid="trigger-icon">Icon</span>
              <span data-testid="trigger-text">Title</span>
            </div>
          }
        >
          Content
        </Collapse>
      );

      expect(screen.getByTestId('trigger-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-text')).toBeInTheDocument();
    });
  });
});
