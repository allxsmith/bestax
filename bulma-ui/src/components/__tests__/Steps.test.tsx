import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Steps, Step } from '../Steps';

describe('Steps', () => {
  describe('rendering', () => {
    it('renders steps container with wrapper div and inner ul', () => {
      const { container } = render(
        <Steps items={[{ label: 'Step 1' }, { label: 'Step 2' }]} />
      );
      const wrapper = container.querySelector('.steps');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper!.tagName).toBe('DIV');
      expect(wrapper!.querySelector('ul.steps-list')).toBeInTheDocument();
    });

    it('renders correct number of steps from items', () => {
      const { container } = render(
        <Steps
          items={[
            { label: 'Step 1' },
            { label: 'Step 2' },
            { label: 'Step 3' },
          ]}
        />
      );
      expect(container.querySelectorAll('.steps-segment')).toHaveLength(3);
    });

    it('renders step labels', () => {
      render(<Steps items={[{ label: 'Account' }, { label: 'Profile' }]} />);
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('renders step markers', () => {
      const { container } = render(
        <Steps items={[{ label: 'Step 1' }, { label: 'Step 2' }]} hasMarker />
      );
      expect(container.querySelectorAll('.steps-marker')).toHaveLength(2);
    });

    it('renders children as steps', () => {
      render(
        <Steps>
          <Steps.Step label="Step 1" />
          <Steps.Step label="Step 2" />
        </Steps>
      );
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
    });
  });

  describe('step number markers', () => {
    it('shows step numbers in markers when no icon is provided', () => {
      const { container } = render(
        <Steps
          value={2}
          items={[
            { label: 'Step 1' },
            { label: 'Step 2' },
            { label: 'Step 3' },
          ]}
        />
      );
      const markers = container.querySelectorAll('.steps-marker');
      // Step 1 and 2 are completed — show checkmark
      expect(markers[0]).toHaveTextContent('\u2713');
      expect(markers[1]).toHaveTextContent('\u2713');
      // Step 3 is active — show step number
      expect(markers[2]).toHaveTextContent('3');
    });

    it('shows step number for non-active, non-completed steps', () => {
      const { container } = render(
        <Steps
          value={0}
          items={[
            { label: 'Step 1' },
            { label: 'Step 2' },
            { label: 'Step 3' },
          ]}
        />
      );
      const markers = container.querySelectorAll('.steps-marker');
      expect(markers[0]).toHaveTextContent('1');
      expect(markers[1]).toHaveTextContent('2');
      expect(markers[2]).toHaveTextContent('3');
    });

    it('shows icon instead of step number when icon is provided', () => {
      render(
        <Steps
          value={0}
          items={[
            { label: 'Step 1', icon: <span data-testid="custom-icon">X</span> },
          ]}
        />
      );
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('passes stepNumber to children via compound API', () => {
      const { container } = render(
        <Steps value={2}>
          <Steps.Step label="A" />
          <Steps.Step label="B" />
          <Steps.Step label="C" />
        </Steps>
      );
      const markers = container.querySelectorAll('.steps-marker');
      // Step 3 is active, should show number 3
      expect(markers[2]).toHaveTextContent('3');
    });
  });

  describe('showStepNumbers', () => {
    it('hides step numbers when showStepNumbers is false', () => {
      const { container } = render(
        <Steps
          value={0}
          showStepNumbers={false}
          items={[
            { label: 'Step 1' },
            { label: 'Step 2' },
            { label: 'Step 3' },
          ]}
        />
      );
      const markers = container.querySelectorAll('.steps-marker');
      // Active step with no numbers should have empty marker
      expect(markers[0].textContent).toBe('');
      expect(markers[1].textContent).toBe('');
      expect(markers[2].textContent).toBe('');
    });

    it('still shows checkmark on completed when showStepNumbers is false', () => {
      const { container } = render(
        <Steps
          value={2}
          showStepNumbers={false}
          items={[
            { label: 'Step 1' },
            { label: 'Step 2' },
            { label: 'Step 3' },
          ]}
        />
      );
      const markers = container.querySelectorAll('.steps-marker');
      expect(markers[0]).toHaveTextContent('\u2713');
      expect(markers[1]).toHaveTextContent('\u2713');
      expect(markers[2].textContent).toBe('');
    });
  });

  describe('completedIcon', () => {
    it('shows step number instead of checkmark when completedIcon is null', () => {
      const { container } = render(
        <Steps
          value={2}
          items={[
            { label: 'Step 1', completedIcon: null },
            { label: 'Step 2', completedIcon: null },
            { label: 'Step 3' },
          ]}
        />
      );
      const markers = container.querySelectorAll('.steps-marker');
      expect(markers[0]).toHaveTextContent('1');
      expect(markers[1]).toHaveTextContent('2');
      expect(markers[2]).toHaveTextContent('3');
    });

    it('shows custom completedIcon when provided', () => {
      render(
        <Steps
          value={1}
          items={[
            {
              label: 'Step 1',
              completedIcon: <span data-testid="done">done</span>,
            },
            { label: 'Step 2' },
          ]}
        />
      );
      expect(screen.getByTestId('done')).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('marks correct step as active based on value', () => {
      const { container } = render(
        <Steps
          value={1}
          items={[
            { label: 'Step 1' },
            { label: 'Step 2' },
            { label: 'Step 3' },
          ]}
        />
      );
      const segments = container.querySelectorAll('.steps-segment');
      expect(segments[0]).not.toHaveClass('is-active');
      expect(segments[1]).toHaveClass('is-active');
      expect(segments[2]).not.toHaveClass('is-active');
    });

    it('marks previous steps as completed', () => {
      const { container } = render(
        <Steps
          value={2}
          items={[
            { label: 'Step 1' },
            { label: 'Step 2' },
            { label: 'Step 3' },
          ]}
        />
      );
      const segments = container.querySelectorAll('.steps-segment');
      expect(segments[0]).toHaveClass('is-completed');
      expect(segments[1]).toHaveClass('is-completed');
      expect(segments[2]).toHaveClass('is-active');
    });

    it('defaults value to 0', () => {
      const { container } = render(
        <Steps items={[{ label: 'Step 1' }, { label: 'Step 2' }]} />
      );
      const segments = container.querySelectorAll('.steps-segment');
      expect(segments[0]).toHaveClass('is-active');
    });
  });

  describe('sizes', () => {
    it.each(['small', 'medium', 'large'] as const)(
      'applies is-%s class when size="%s"',
      size => {
        const { container } = render(
          <Steps size={size} items={[{ label: 'Step 1' }]} />
        );
        expect(container.querySelector('.steps')).toHaveClass(`is-${size}`);
      }
    );
  });

  describe('colors', () => {
    it.each([
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
    ] as const)('applies is-%s class when color="%s"', color => {
      const { container } = render(
        <Steps color={color} items={[{ label: 'Step 1' }]} />
      );
      expect(container.querySelector('.steps')).toHaveClass(`is-${color}`);
    });
  });

  describe('variants', () => {
    it('applies has-marker class when hasMarker is true', () => {
      const { container } = render(
        <Steps hasMarker items={[{ label: 'Step 1' }]} />
      );
      expect(container.querySelector('.steps')).toHaveClass('has-marker');
    });

    it('applies is-animated class when animated is true', () => {
      const { container } = render(
        <Steps animated items={[{ label: 'Step 1' }]} />
      );
      expect(container.querySelector('.steps')).toHaveClass('is-animated');
    });

    it('applies is-rounded class by default', () => {
      const { container } = render(<Steps items={[{ label: 'Step 1' }]} />);
      expect(container.querySelector('.steps')).toHaveClass('is-rounded');
    });

    it('omits is-rounded class when rounded is false', () => {
      const { container } = render(
        <Steps rounded={false} items={[{ label: 'Step 1' }]} />
      );
      expect(container.querySelector('.steps')).not.toHaveClass('is-rounded');
    });

    it('applies is-vertical class when vertical is true', () => {
      const { container } = render(
        <Steps vertical items={[{ label: 'Step 1' }]} />
      );
      expect(container.querySelector('.steps')).toHaveClass('is-vertical');
    });

    it('applies label position class for right', () => {
      const { container } = render(
        <Steps labelPosition="right" items={[{ label: 'Step 1' }]} />
      );
      expect(container.querySelector('.steps')).toHaveClass('has-label-right');
    });

    it('applies label position class for left', () => {
      const { container } = render(
        <Steps labelPosition="left" items={[{ label: 'Step 1' }]} />
      );
      expect(container.querySelector('.steps')).toHaveClass('has-label-left');
    });
  });

  describe('hasNavigation', () => {
    it('renders prev/next buttons when hasNavigation is true', () => {
      render(
        <Steps
          hasNavigation
          value={1}
          items={[{ label: 'A' }, { label: 'B' }, { label: 'C' }]}
        />
      );
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('does not render nav buttons when hasNavigation is false', () => {
      render(
        <Steps
          value={1}
          items={[{ label: 'A' }, { label: 'B' }, { label: 'C' }]}
        />
      );
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('disables Previous button on first step', () => {
      render(
        <Steps
          hasNavigation
          value={0}
          items={[{ label: 'A' }, { label: 'B' }]}
        />
      );
      expect(screen.getByText('Previous')).toBeDisabled();
      expect(screen.getByText('Next')).not.toBeDisabled();
    });

    it('disables Next button on last step', () => {
      render(
        <Steps
          hasNavigation
          value={1}
          items={[{ label: 'A' }, { label: 'B' }]}
        />
      );
      expect(screen.getByText('Previous')).not.toBeDisabled();
      expect(screen.getByText('Next')).toBeDisabled();
    });

    it('calls onStepClick with value-1 when Previous is clicked', () => {
      const handleClick = jest.fn();
      render(
        <Steps
          hasNavigation
          value={2}
          onStepClick={handleClick}
          items={[{ label: 'A' }, { label: 'B' }, { label: 'C' }]}
        />
      );
      fireEvent.click(screen.getByText('Previous'));
      expect(handleClick).toHaveBeenCalledWith(1);
    });

    it('calls onStepClick with value+1 when Next is clicked', () => {
      const handleClick = jest.fn();
      render(
        <Steps
          hasNavigation
          value={0}
          onStepClick={handleClick}
          items={[{ label: 'A' }, { label: 'B' }, { label: 'C' }]}
        />
      );
      fireEvent.click(screen.getByText('Next'));
      expect(handleClick).toHaveBeenCalledWith(1);
    });

    it('uses custom onPrev/onNext when provided', () => {
      const handlePrev = jest.fn();
      const handleNext = jest.fn();
      render(
        <Steps
          hasNavigation
          value={1}
          onPrev={handlePrev}
          onNext={handleNext}
          items={[{ label: 'A' }, { label: 'B' }, { label: 'C' }]}
        />
      );
      fireEvent.click(screen.getByText('Previous'));
      expect(handlePrev).toHaveBeenCalled();
      fireEvent.click(screen.getByText('Next'));
      expect(handleNext).toHaveBeenCalled();
    });

    it('renders custom labels for nav buttons', () => {
      render(
        <Steps
          hasNavigation
          prevLabel="Back"
          nextLabel="Forward"
          value={1}
          items={[{ label: 'A' }, { label: 'B' }, { label: 'C' }]}
        />
      );
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Forward')).toBeInTheDocument();
    });

    it('renders navigation container with steps-navigation class', () => {
      const { container } = render(
        <Steps
          hasNavigation
          value={0}
          items={[{ label: 'A' }, { label: 'B' }]}
        />
      );
      expect(container.querySelector('.steps-navigation')).toBeInTheDocument();
    });
  });

  describe('clickable steps', () => {
    it('calls onStepClick when clickable step is clicked', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Steps
          value={0}
          onStepClick={handleClick}
          items={[
            { label: 'Step 1', clickable: true },
            { label: 'Step 2', clickable: true },
          ]}
        />
      );

      const segments = container.querySelectorAll('.steps-segment');
      fireEvent.click(segments[1]);
      expect(handleClick).toHaveBeenCalledWith(1);
    });

    it('does not call onStepClick when non-clickable step is clicked', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Steps
          value={0}
          onStepClick={handleClick}
          items={[
            { label: 'Step 1', clickable: false },
            { label: 'Step 2', clickable: false },
          ]}
        />
      );

      const segments = container.querySelectorAll('.steps-segment');
      fireEvent.click(segments[1]);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies tabIndex to clickable steps', () => {
      const { container } = render(
        <Steps
          items={[
            { label: 'Step 1', clickable: true },
            { label: 'Step 2', clickable: false },
          ]}
        />
      );

      const segments = container.querySelectorAll('.steps-segment');
      expect(segments[0]).toHaveAttribute('tabIndex', '0');
      expect(segments[1]).not.toHaveAttribute('tabIndex');
    });

    it('handles keyboard navigation on clickable steps', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Steps
          value={0}
          onStepClick={handleClick}
          items={[{ label: 'Step 1', clickable: true }]}
        />
      );

      const segment = container.querySelector('.steps-segment')!;
      fireEvent.keyDown(segment, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledWith(0);

      handleClick.mockClear();
      fireEvent.keyDown(segment, { key: ' ' });
      expect(handleClick).toHaveBeenCalledWith(0);
    });
  });

  describe('icons', () => {
    it('renders icon in step marker', () => {
      render(
        <Steps
          items={[{ label: 'Step 1', icon: <span data-testid="icon">★</span> }]}
        />
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders checkmark for completed steps without icon', () => {
      const { container } = render(
        <Steps value={1} items={[{ label: 'Step 1' }, { label: 'Step 2' }]} />
      );
      const markers = container.querySelectorAll('.steps-marker');
      expect(markers[0]).toHaveTextContent('\u2713');
    });
  });

  describe('className handling', () => {
    it('applies custom className to Steps', () => {
      const { container } = render(
        <Steps className="custom-class" items={[{ label: 'Step 1' }]} />
      );
      expect(container.querySelector('.steps')).toHaveClass('custom-class');
    });

    it('applies custom className to individual step items', () => {
      const { container } = render(
        <Steps items={[{ label: 'Step 1', className: 'step-custom' }]} />
      );
      expect(container.querySelector('.steps-segment')).toHaveClass(
        'step-custom'
      );
    });
  });

  describe('Bulma helper classes', () => {
    it('applies Bulma helper classes from props', () => {
      const { container } = render(
        <Steps m="2" p="3" items={[{ label: 'Step 1' }]} />
      );
      expect(container.querySelector('.steps')).toHaveClass('m-2', 'p-3');
    });
  });

  describe('accessibility', () => {
    it('clickable steps have role="button"', () => {
      const { container } = render(
        <Steps items={[{ label: 'Step 1', clickable: true }]} />
      );
      expect(container.querySelector('.steps-segment')).toHaveAttribute(
        'role',
        'button'
      );
    });

    it('active step has aria-current="step"', () => {
      const { container } = render(
        <Steps value={0} items={[{ label: 'Step 1' }]} />
      );
      expect(container.querySelector('.steps-segment')).toHaveAttribute(
        'aria-current',
        'step'
      );
    });

    it('non-active steps do not have aria-current', () => {
      const { container } = render(
        <Steps value={1} items={[{ label: 'Step 1' }, { label: 'Step 2' }]} />
      );
      const segments = container.querySelectorAll('.steps-segment');
      expect(segments[0]).not.toHaveAttribute('aria-current');
    });
  });
});

describe('Step subcomponent', () => {
  it('renders with label', () => {
    render(<Step label="Test Step" />);
    expect(screen.getByText('Test Step')).toBeInTheDocument();
  });

  it('renders with children as label', () => {
    render(<Step>Child Label</Step>);
    expect(screen.getByText('Child Label')).toBeInTheDocument();
  });

  it('applies isActive class', () => {
    const { container } = render(<Step isActive label="Test" />);
    expect(container.querySelector('.steps-segment')).toHaveClass('is-active');
  });

  it('applies isCompleted class', () => {
    const { container } = render(<Step isCompleted label="Test" />);
    expect(container.querySelector('.steps-segment')).toHaveClass(
      'is-completed'
    );
  });

  it('renders icon', () => {
    render(<Step icon={<span data-testid="step-icon">★</span>} label="Test" />);
    expect(screen.getByTestId('step-icon')).toBeInTheDocument();
  });

  it('renders step number when provided', () => {
    const { container } = render(<Step stepNumber={3} label="Test" />);
    expect(container.querySelector('.steps-marker')).toHaveTextContent('3');
  });

  it('shows checkmark instead of step number when completed', () => {
    const { container } = render(
      <Step isCompleted stepNumber={1} label="Test" />
    );
    expect(container.querySelector('.steps-marker')).toHaveTextContent(
      '\u2713'
    );
  });

  it('calls onClick when clickable and clicked', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Step clickable onClick={handleClick} label="Test" />
    );
    fireEvent.click(container.querySelector('.steps-segment')!);
    expect(handleClick).toHaveBeenCalled();
  });
});
