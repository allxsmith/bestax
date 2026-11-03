import { render, screen } from '@testing-library/react';
import { Flex } from '../Flex';
import { Box } from '../../elements/Box';
import { ConfigProvider } from '../../helpers/Config';

// The shared behavior (`as`, the list role, the ref, the helper props) is in
// helpers/__tests__/stackLayout.test.tsx, and the layout itself in
// Stack.styles.test.tsx.
describe('Flex', () => {
  it('renders the bare stack class, a flex container with CSS’s own defaults', () => {
    render(<Flex data-testid="flex" />);
    expect(screen.getByTestId('flex').className).toBe('stack');
  });

  it.each(['row', 'row-reverse', 'column', 'column-reverse'] as const)(
    'takes flexDirection %s',
    direction => {
      render(<Flex data-testid="flex" flexDirection={direction} />);
      expect(screen.getByTestId('flex').className).toBe(
        `stack is-flex-direction-${direction}`
      );
    }
  );

  it('takes every flex container prop, with no display prop', () => {
    render(
      <Flex
        data-testid="flex"
        flexDirection="column"
        flexWrap="wrap"
        alignItems="center"
        justifyContent="flex-end"
        alignContent="space-around"
        gap="4"
        rowGap="2"
        columnGap="1"
      />
    );
    expect(screen.getByTestId('flex').className).toBe(
      'stack is-gap-4 is-column-gap-1 is-row-gap-2 is-flex-direction-column ' +
        'is-flex-wrap-wrap is-justify-content-flex-end ' +
        'is-align-content-space-around is-align-items-center'
    );
  });

  it('leaves the flex item props to the children', () => {
    render(
      <Flex gap="4" alignItems="flex-start">
        <Box data-testid="side" flexShrink="0">
          Side
        </Box>
        <Box data-testid="main" flexGrow="1">
          Main
        </Box>
      </Flex>
    );
    expect(screen.getByTestId('side')).toHaveClass('box', 'is-flex-shrink-0');
    expect(screen.getByTestId('main')).toHaveClass('box', 'is-flex-grow-1');
  });

  it('prefixes its classes', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Flex data-testid="flex" flexDirection="column" />
      </ConfigProvider>
    );
    expect(screen.getByTestId('flex').className).toBe(
      'bestax-stack bestax-is-flex-direction-column'
    );
  });
});
