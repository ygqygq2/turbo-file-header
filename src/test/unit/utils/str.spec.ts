import { describe, expect, it, test } from 'vitest';

import { escapeRegexString, removeSpecialString, trim, trimLeft, trimRight } from '@/utils/str';

test('escapeRegexString', () => {
  const input = '.*+?^${}()|[\\/';
  const expected = '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\\\\\/';

  const result = escapeRegexString(input);

  expect(result).toBe(expected);
});

describe('trim', () => {
  it('should trim leading and trailing whitespace by default', () => {
    const str = '  Hello, World!  ';
    const expected = 'Hello, World!';

    const result = trim(str);

    expect(result).toBe(expected);
  });

  it('should trim leading and trailing specified character', () => {
    const str = '***Hello, World!***';
    const char = '*';
    const expected = 'Hello, World!';

    const result = trim(str, char);

    expect(result).toBe(expected);
  });

  it('should trim leading and trailing whitespace when no character is specified', () => {
    const str = '  Hello, World!  ';
    const expected = 'Hello, World!';

    const result = trim(str);

    expect(result).toBe(expected);
  });
});

describe('trimLeft', () => {
  it('trimLeft', () => {
    const input = '   Hello, World!   ';
    const expected = 'Hello, World!   ';

    const result = trimLeft(input);

    expect(result).toBe(expected);
  });

  it('trimLeft with specific character', () => {
    const input = '---Hello, World!---';
    const expected = 'Hello, World!---';

    const result = trimLeft(input, '-');

    expect(result).toBe(expected);
  });
});

describe('trimRight', () => {
  it('should trim trailing whitespace by default', () => {
    const str = 'Hello, World!  ';
    const expected = 'Hello, World!';

    const result = trimRight(str);

    expect(result).toBe(expected);
  });

  it('should trim trailing specified character', () => {
    const str = 'Hello, World!***';
    const char = '*';
    const expected = 'Hello, World!';

    const result = trimRight(str, char);

    expect(result).toBe(expected);
  });

  it('should trim trailing whitespace when no character is specified', () => {
    const str = 'Hello, World!  ';
    const expected = 'Hello, World!';

    const result = trimRight(str);

    expect(result).toBe(expected);
  });
});

describe('removeSpecialString', () => {
  it('should remove special string when regex is a single regular expression', () => {
    const fileHeaderContent = 'Hello, /* World */!';
    const regex = /\/\*.*\*\//g;

    const result = removeSpecialString(fileHeaderContent, regex);

    expect(result).toBe('Hello, !');
  });

  it('should remove special strings when regex is an array of regular expressions', () => {
    const fileHeaderContent = 'Hello, /* World */! /* Goodbye */';
    const regex = [/\/\*.*?\*\//g, /\/\/.*/g];

    const result = removeSpecialString(fileHeaderContent, regex);

    expect(result).toBe('Hello, ! ');
  });

  it('should return the same string when no special string is found', () => {
    const fileHeaderContent = 'Hello, World!';
    const regex = /\/\*.*\*\//g;

    const result = removeSpecialString(fileHeaderContent, regex);

    expect(result).toBe(fileHeaderContent);
  });
});
