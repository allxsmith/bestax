import { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import { useAnchoredPosition } from '../useAnchoredPosition';
import type { PickerPosition } from '../../form/_pickerInternals/pickerTypes';

/** Measures with neither element on the page. */
const Detached = ({ position }: { position: PickerPosition }) => {
  const anchorRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const resolved = useAnchoredPosition(anchorRef, panelRef, {
    active: true,
    position,
    fixed: true,
  });
  return <output>{JSON.stringify(resolved)}</output>;
};

describe('useAnchoredPosition', () => {
  it('keeps its last placement when there is nothing to measure', () => {
    const { rerender } = render(<Detached position="auto" />);
    expect(screen.getByRole('status')).toHaveTextContent(
      '{"position":"bottom-left"}'
    );
    rerender(<Detached position="top-right" />);
    expect(screen.getByRole('status')).toHaveTextContent(
      '{"position":"bottom-left"}'
    );
  });

  it('starts at the corner asked for', () => {
    render(<Detached position="top-right" />);
    expect(screen.getByRole('status')).toHaveTextContent(
      '{"position":"top-right"}'
    );
  });
});
