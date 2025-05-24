import React from 'react';
import { render, screen } from '@testing-library/react';
import Box from '../Box';

describe('Box Component', () => {
  // Test default rendering
  test('renders children correctly with default props', () => {
    render(<Box>Test Content</Box>);
    const boxElement = screen.getByText('Test Content');
    expect(boxElement).toBeInTheDocument();
    expect(boxElement).toHaveClass('box');
    expect(boxElement).toHaveClass('p-5');
    expect(boxElement).toHaveClass('m-4');
    expect(boxElement).toHaveClass('has-background-white');
    expect(boxElement).toHaveClass('has-shadow');
  });

  // Test custom props
  test('applies custom props correctly', () => {
    render(
      <Box
        padding="p-3"
        margin="m-2"
        backgroundColor="has-background-light"
        hasShadow={false}
        className="custom-class"
      >
        Custom Box Test 4
      </Box>
    );
    const boxElement = screen.getByText('Custom Box Test 4');
    expect(boxElement).toBeInTheDocument();
    expect(boxElement).toHaveClass('box');
    expect(boxElement).toHaveClass('p-3');
    expect(boxElement).toHaveClass('m-2');
    expect(boxElement).toHaveClass('has-background-light');
    expect(boxElement).not.toHaveClass('has-shadow');
    expect(boxElement).toHaveClass('custom-class');
  });

  // Test no children
  test('renders without children', () => {
    render(<Box />);
    const boxElement = screen.getByTestId('box'); // Use data-testid for specificity
    expect(boxElement).toBeInTheDocument();
    expect(boxElement).toHaveClass('box');
  });
});
