import React from 'react';
import { renderHook } from '@testing-library/react';
import {
  useInsideField,
  useInsideControl,
  useRadiosGroup,
  useCheckboxesGroup,
  useRadiosName,
  useCheckboxesName,
  RadiosNameProvider,
  CheckboxesNameProvider,
  RadiosProvider,
  CheckboxesProvider,
} from '../FormContext';

describe('FormContext hooks (defaults outside any provider)', () => {
  it('useInsideField returns false by default', () => {
    const { result } = renderHook(() => useInsideField());
    expect(result.current).toBe(false);
  });

  it('useInsideControl returns false by default', () => {
    const { result } = renderHook(() => useInsideControl());
    expect(result.current).toBe(false);
  });

  it('useRadiosGroup returns undefined by default', () => {
    const { result } = renderHook(() => useRadiosGroup());
    expect(result.current).toBeUndefined();
  });

  it('useCheckboxesGroup returns undefined by default', () => {
    const { result } = renderHook(() => useCheckboxesGroup());
    expect(result.current).toBeUndefined();
  });

  it('useRadiosName returns undefined by default', () => {
    const { result } = renderHook(() => useRadiosName());
    expect(result.current).toBeUndefined();
  });

  it('useCheckboxesName returns undefined by default', () => {
    const { result } = renderHook(() => useCheckboxesName());
    expect(result.current).toBeUndefined();
  });

  it('useRadiosName reads name from RadiosProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RadiosProvider value={{ name: 'colors' }}>{children}</RadiosProvider>
    );
    const { result } = renderHook(() => useRadiosName(), { wrapper });
    expect(result.current).toBe('colors');
  });

  it('useCheckboxesName reads name from CheckboxesProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CheckboxesProvider value={{ name: 'tags' }}>
        {children}
      </CheckboxesProvider>
    );
    const { result } = renderHook(() => useCheckboxesName(), { wrapper });
    expect(result.current).toBe('tags');
  });

  it('exports backward-compat aliases', () => {
    // RadiosNameProvider and CheckboxesNameProvider are aliases for the new
    // providers. Sanity-check they are the same identity to keep the alias
    // export path covered.
    expect(RadiosNameProvider).toBe(RadiosProvider);
    expect(CheckboxesNameProvider).toBe(CheckboxesProvider);
  });
});
