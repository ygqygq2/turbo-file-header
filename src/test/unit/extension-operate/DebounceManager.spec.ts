import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DebounceManager } from '@/extension-operate/DebounceManager';

describe('DebounceManager', () => {
  let debounceManager: DebounceManager;

  beforeEach(() => {
    debounceManager = new DebounceManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should debounce function calls', () => {
    const mockFn = vi.fn();
    const id = 'test-id';

    debounceManager.debounce(id, mockFn, 100);
    debounceManager.debounce(id, mockFn, 100);
    debounceManager.debounce(id, mockFn, 100);

    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple debounce IDs independently', () => {
    const mockFn1 = vi.fn();
    const mockFn2 = vi.fn();

    debounceManager.debounce('id1', mockFn1, 100);
    debounceManager.debounce('id2', mockFn2, 150);

    vi.advanceTimersByTime(100);
    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn2).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(mockFn2).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous timer when debounced again', () => {
    const mockFn = vi.fn();
    const id = 'test-id';

    debounceManager.debounce(id, mockFn, 100);
    vi.advanceTimersByTime(50);

    // Debounce again before timer completes
    debounceManager.debounce(id, mockFn, 100);
    vi.advanceTimersByTime(50);

    // Should not have been called yet (only 50ms of new timer)
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should clean up timer after execution', () => {
    const mockFn = vi.fn();
    const id = 'test-id';

    debounceManager.debounce(id, mockFn, 100);

    // Timer should exist
    expect(debounceManager['timers'].has(id)).toBe(true);

    vi.advanceTimersByTime(100);

    // Timer should be removed after execution
    expect(debounceManager['timers'].has(id)).toBe(false);
  });
});
