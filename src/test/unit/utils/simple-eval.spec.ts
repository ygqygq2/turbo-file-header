import { describe, expect, it } from 'vitest';

import { calculateWithBase, simpleEval } from '@/utils/simple-eval';

describe('simple-eval', () => {
  describe('simpleEval', () => {
    it('calculates basic addition', () => {
      expect(simpleEval('2024 + 1')).toBe('2025');
      expect(simpleEval('10 + 20')).toBe('30');
    });

    it('calculates basic subtraction', () => {
      expect(simpleEval('2024 - 1')).toBe('2023');
      expect(simpleEval('100 - 50')).toBe('50');
    });

    it('calculates basic multiplication', () => {
      expect(simpleEval('10 * 2')).toBe('20');
      expect(simpleEval('5 * 5')).toBe('25');
    });

    it('calculates basic division', () => {
      expect(simpleEval('10 / 2')).toBe('5');
      expect(simpleEval('100 / 4')).toBe('25');
    });

    it('handles complex expressions with parentheses', () => {
      expect(simpleEval('(10 + 5) * 2')).toBe('30');
      expect(simpleEval('100 / (2 + 3)')).toBe('20');
    });

    it('returns original string for invalid expressions', () => {
      expect(simpleEval('invalid')).toBe('invalid');
      expect(simpleEval('hello world')).toBe('hello world');
      expect(simpleEval('2024-01-01')).toBe('2024-01-01');
    });

    it('handles whitespace', () => {
      expect(simpleEval('  10 + 20  ')).toBe('30');
      expect(simpleEval('10+20')).toBe('30');
    });

    it('rejects dangerous patterns', () => {
      expect(simpleEval('10..toString()')).toBe('10..toString()');
      expect(simpleEval('__proto__')).toBe('__proto__');
    });

    it('handles decimal numbers', () => {
      expect(simpleEval('10.5 + 5.5')).toBe('16');
      expect(simpleEval('3.14 * 2')).toBe('6.28');
    });
  });

  describe('calculateWithBase', () => {
    it('adds to base number', () => {
      expect(calculateWithBase('2024', '+1')).toBe('2025');
      expect(calculateWithBase('100', '+50')).toBe('150');
    });

    it('subtracts from base number', () => {
      expect(calculateWithBase('2024', '-1')).toBe('2023');
      expect(calculateWithBase('100', '-25')).toBe('75');
    });

    it('multiplies base number', () => {
      expect(calculateWithBase('10', '*2')).toBe('20');
      expect(calculateWithBase('5', '*10')).toBe('50');
    });

    it('divides base number', () => {
      expect(calculateWithBase('100', '/2')).toBe('50');
      expect(calculateWithBase('50', '/5')).toBe('10');
    });

    it('returns original for invalid base', () => {
      expect(calculateWithBase('invalid', '+1')).toBe('invalid');
      expect(calculateWithBase('abc', '*2')).toBe('abc');
    });
  });
});
