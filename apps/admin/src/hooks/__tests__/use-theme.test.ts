import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../use-theme';

describe('useTheme', () => {
  it('defaults to system theme', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('system');
  });

  it('sets and persists theme', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
    expect(localStorage.setItem).toHaveBeenCalledWith('saas_theme', 'dark');
  });
});
