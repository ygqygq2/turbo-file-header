import { describe, expect, it } from 'vitest';

import { TEMPLATE_SYMBOL_KEY } from '@/constants';
import { getTaggedTemplateInputs, hasShebang } from '@/utils/utils';

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
