import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Block } from '../Block';

describe('Block Component', () => {
  it('renders children correctly', () => {
    const text = 'Test Block Content';
    render(<Block>{text}</Block>);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('applies Bulma block class', () => {
    render(<Block>Test</Block>);
    const block = screen.getByText('Test');
    expect(block).toHaveClass('block');
  });

  it('applies custom className along with block class', () => {
    const customClass = 'custom-class';
    render(<Block className={customClass}>Test</Block>);
    const block = screen.getByText('Test');
    expect(block).toHaveClass('block', customClass);
  });

  it('forwards additional props to the div', () => {
    const dataTestId = 'block-test';
    render(<Block data-testid={dataTestId}>Test</Block>);
    const block = screen.getByTestId(dataTestId);
    expect(block).toBeInTheDocument();
    expect(block).toHaveClass('block');
  });
});
