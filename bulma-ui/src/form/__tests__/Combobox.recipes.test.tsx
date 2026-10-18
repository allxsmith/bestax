/**
 * The Server Search recipe, which the docs page and the `ServerSearch` story
 * write the same way. Rendered from the story, since the docs page's copy has
 * no harness of its own.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ServerSearch } from '../Combobox.stories';

const field = () => screen.getByRole('combobox') as HTMLInputElement;
const loading = () =>
  field().closest('.control')?.classList.contains('is-loading');

/** Runs the recipe's debounce and its pretend server, and what they resolve. */
const settleSearch = async () => {
  await act(async () => {
    jest.advanceTimersByTime(250);
  });
  await act(async () => {
    jest.advanceTimersByTime(600);
  });
};

describe('The Server Search recipe', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stops loading when a city is picked while a search is still out', async () => {
    const Recipe = ServerSearch.render as () => React.ReactElement;
    render(<Recipe />);
    act(() => field().focus());

    fireEvent.change(field(), { target: { value: 'p' } });
    expect(loading()).toBe(true);
    await settleSearch();
    expect(loading()).toBe(false);

    // Another letter sends a new search, and the old results stay showing.
    fireEvent.change(field(), { target: { value: 'pa' } });
    expect(loading()).toBe(true);
    fireEvent.click(screen.getByRole('option', { name: 'Paris, France' }));
    expect(field()).toHaveValue('Paris');
    expect(loading()).toBe(false);

    // The search the pick overtook comes back to nothing.
    await settleSearch();
    expect(loading()).toBe(false);
  });
});
