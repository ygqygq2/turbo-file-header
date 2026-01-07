import { describe, expect, it, vi } from 'vitest';

import { escapeRegexString } from '@/utils/str';

vi.mock('@/extension', () => ({
  configEvent: {
    onDidChange: vi.fn(),
  },
  configManager: {
    getConfigurationFlatten: vi.fn(),
  },
  languageEvent: {
    onDidChange: vi.fn(),
  },
  languageManager: {
    getAvailableCommentRules: vi.fn(),
  },
}));

describe('parser - Line Picker utilities', () => {
  describe('escapeRegexString', () => {
    it('should escape special regex characters', () => {
      const input = 'test.file+name';
      const result = escapeRegexString(input);

      expect(result).toBe('test\\.file\\+name');
    });

    it('should escape all special regex characters', () => {
      const specialChars = '.*+?^${}()|[]\\';
      const result = escapeRegexString(specialChars);

      // All special chars should be escaped
      expect(result).toContain('\\');
      expect(result.length).toBeGreaterThan(specialChars.length);
    });

    it('should preserve regular characters', () => {
      const input = 'normaltext';
      const result = escapeRegexString(input);

      expect(result).toBe('normaltext');
    });

    it('should handle mixed content', () => {
      const input = 'file.test';
      const result = escapeRegexString(input);

      expect(result).toBe('file\\.test');
    });

    it('should escape forward slash', () => {
      const input = 'path/to/file';
      const result = escapeRegexString(input);

      expect(result).toBe('path\\/to\\/file');
    });

    it('should escape backslash', () => {
      const input = 'path\\to\\file';
      const result = escapeRegexString(input);

      expect(result).toContain('\\\\');
    });

    it('should escape parentheses', () => {
      const input = 'func(arg)';
      const result = escapeRegexString(input);

      expect(result).toBe('func\\(arg\\)');
    });

    it('should escape brackets', () => {
      const input = 'array[0]';
      const result = escapeRegexString(input);

      expect(result).toBe('array\\[0\\]');
    });

    it('should escape pipe character', () => {
      const input = 'a|b';
      const result = escapeRegexString(input);

      expect(result).toBe('a\\|b');
    });

    it('should escape caret', () => {
      const input = '^start';
      const result = escapeRegexString(input);

      expect(result).toBe('\\^start');
    });

    it('should escape dollar sign', () => {
      const input = 'end$';
      const result = escapeRegexString(input);

      expect(result).toBe('end\\$');
    });

    it('should handle empty string', () => {
      const result = escapeRegexString('');

      expect(result).toBe('');
    });

    it('should be useful for building regex patterns', () => {
      const commentMarker = '//';
      const tag = 'TODO';

      const escapedMarker = escapeRegexString(commentMarker);
      const pattern = new RegExp(`(${escapedMarker})(.*${tag})`);

      expect(pattern.test('// TODO: fix this')).toBe(true);
      expect(pattern.test('  // TODO item')).toBe(true);
    });

    it('should handle line comment markers', () => {
      const markers = ['//', '#', '--', '/*'];
      const escaped = markers.map(escapeRegexString);

      expect(escaped[0]).toBe('\\/\\/');
      expect(escaped[1]).toBe('#');
      expect(escaped[2]).toBe('--');
      expect(escaped[3]).toBe('\\/\\*');
    });
  });

  describe('regex pattern building for comment lines', () => {
    it('should create valid pattern for line comments', () => {
      const lineComment = '//';
      const tags = ['TODO', 'FIXME', 'NOTE'];

      const escapedMarker = escapeRegexString(lineComment);
      const escapedTags = tags.join('|');
      const pattern = new RegExp(`(${escapedMarker})[ \\t](${escapedTags})`, 'i');

      expect(pattern.test('// TODO')).toBe(true);
      expect(pattern.test('// FIXME')).toBe(true);
      expect(pattern.test('// NOTE')).toBe(true);
      expect(pattern.test('//TODO')).toBe(false);
    });

    it('should match tags with trailing content', () => {
      const pattern = /(\/\/)[ \t](TODO|FIXME)(.*)/i;

      const match = pattern.exec('// TODO: fix this bug');
      expect(match).toBeTruthy();
      expect(match![0]).toBe('// TODO: fix this bug');
    });

    it('should handle Python-style comments', () => {
      const marker = '#';
      const tags = ['TODO', 'FIXME'];

      const escapedMarker = escapeRegexString(marker);
      const pattern = new RegExp(`(${escapedMarker})[ \\t](${tags.join('|')})`, 'i');

      expect(pattern.test('# TODO')).toBe(true);
      expect(pattern.test('# FIXME')).toBe(true);
    });

    it('should handle indented comments', () => {
      const pattern = /(^|[ \t]+)(\/\/)[ \t](TODO|FIXME)(.*)/gim;

      const text = '  // TODO: item 1\n    // FIXME: item 2';
      const matches = [...text.matchAll(pattern)];

      expect(matches.length).toBe(2);
    });

    it('should build regex for plaintext with tags', () => {
      const tags = ['TODO', 'FIXME', 'NOTE'];
      // Use regex that matches tag at start of line or after spaces
      const pattern = new RegExp(`^\\s*(${tags.join('|')})`, 'i');

      expect(pattern.test('TODO: item')).toBe(true);
      expect(pattern.test('  FIXME: item')).toBe(true);
      expect(pattern.test('NOTE this')).toBe(true);
    });
  });
});
