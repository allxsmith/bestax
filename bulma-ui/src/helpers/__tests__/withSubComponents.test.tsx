import React, { forwardRef } from 'react';
import { render, screen } from '@testing-library/react';
import { withSubComponents } from '../withSubComponents';

describe('withSubComponents', () => {
  const Sub: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <span data-testid="sub">{children}</span>
  );

  it('returns the same object it was given (identity preserved)', () => {
    const Base: React.FC = () => <div />;
    const result = withSubComponents(Base, { Sub });
    expect(result).toBe(Base);
  });

  it('attaches sub-components as statics', () => {
    const Base: React.FC = () => <div />;
    const result = withSubComponents(Base, { Sub });
    expect(result.Sub).toBe(Sub);
  });

  it('sets displayName on the parent when provided', () => {
    const Base: React.FC = () => <div />;
    const result = withSubComponents(Base, { Sub }, 'Base');
    expect(result.displayName).toBe('Base');
  });

  it('leaves displayName untouched when omitted', () => {
    const Base: React.FC = () => <div />;
    Base.displayName = 'Existing';
    const result = withSubComponents(Base, { Sub });
    expect(result.displayName).toBe('Existing');
  });

  it('works on a forwardRef base component', () => {
    const Base = forwardRef<HTMLDivElement, { children?: React.ReactNode }>(
      ({ children }, ref) => (
        <div data-testid="base" ref={ref}>
          {children}
        </div>
      )
    );
    const Compound = withSubComponents(Base, { Sub }, 'Compound');
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Compound ref={ref}>
        <Compound.Sub>inner</Compound.Sub>
      </Compound>
    );
    expect(screen.getByTestId('base')).toBeInTheDocument();
    expect(screen.getByTestId('sub')).toHaveTextContent('inner');
    expect(ref.current).toBe(screen.getByTestId('base'));
    expect(Compound.displayName).toBe('Compound');
  });
});
