import { describe, expect, it } from 'vitest';

import { TEMPLATE_SYMBOL_KEY } from '@/constants';
import {
  convertDateFormatToRegex,
  extractComplexType,
  getFirstLine,
  getStringHash,
  getTaggedTemplateInputs,
  hasShebang,
  sleep,
} from '@/utils/utils';

describe('hasShebang', () => {
  it('should return true if the text has a shebang', () => {
    const text = '#!/usr/bin/env node';
    const result = hasShebang(text);
    expect(result).toBe(true);
  });

  it('should return false if the text does not have a shebang', () => {
    const text = 'console.log("Hello, world!");';
    const result = hasShebang(text);
    expect(result).toBe(false);
  });
});

describe('getTaggedTemplateInputs', () => {
  it('should return the tagged template inputs', () => {
    const strings = ['Hello', 'World'] as unknown as TemplateStringsArray;
    const interpolations = [1, 2];
    const result = getTaggedTemplateInputs(strings, ...interpolations);
    expect(result).toEqual({
      [TEMPLATE_SYMBOL_KEY]: true,
      strings,
      interpolations,
    });
  });
});

describe('getFirstLine', () => {
  it('returns first line of multiline text', () => {
    expect(getFirstLine('line1\nline2\nline3')).toBe('line1');
  });

  it('returns entire text if single line', () => {
    expect(getFirstLine('single line')).toBe('single line');
  });
});

describe('convertDateFormatToRegex', () => {
  it('converts date format to regex pattern', () => {
    const pattern = convertDateFormatToRegex('YYYY-MM-DD');
    expect(pattern).toContain('\\d{4}');
    expect(pattern).toContain('\\d{2}');
  });

  it('handles time format', () => {
    const pattern = convertDateFormatToRegex('YYYY-MM-DD HH:mm:ss');
    expect(pattern).toContain('\\d{4}');
    expect(pattern).toContain('\\d{2}');
  });
});

describe('getStringHash', () => {
  it('generates consistent hash for same input', () => {
    const hash1 = getStringHash('test');
    const hash2 = getStringHash('test');
    expect(hash1).toBe(hash2);
  });

  it('generates different hash for different input', () => {
    const hash1 = getStringHash('test1');
    const hash2 = getStringHash('test2');
    expect(hash1).not.toBe(hash2);
  });

  it('generates base64 hash', () => {
    const hash = getStringHash('hello');
    expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});

describe('sleep', () => {
  it('delays execution', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45);
  });
});

describe('extractComplexType', () => {
  it('extracts between string delimiters', () => {
    const result = extractComplexType('function(arg1, arg2)', '(', ')');
    expect(result).toBe('(arg1, arg2');
  });

  it('extracts with regex start', () => {
    const result = extractComplexType('function foo(arg)', /foo/, ')');
    expect(result).toBe('(arg)');
  });

  it('handles nested brackets', () => {
    const result = extractComplexType('fn(outer(inner))', '(', ')');
    expect(result).toBe('(outer(inner');
  });
});
