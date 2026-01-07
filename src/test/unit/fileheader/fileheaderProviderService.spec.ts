import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getOriginFileheaderInfo,
  getOriginFileheaderRange,
} from '@/fileheader/fileheaderProviderService';

describe('fileheaderProviderService', () => {
  let mockDocument: any;
  let mockProvider: any;

  beforeEach(() => {
    mockDocument = {
      getText: vi.fn(),
      eol: 1, // '\n'
      lineCount: 10,
      lineAt: vi.fn((line: number) => ({
        text: `line ${line}`,
        range: {
          start: { line, character: 0 },
          end: { line, character: 10 },
        },
      })),
    };

    mockProvider = {
      getOriginFileheaderRange: vi.fn(),
      getOriginContentWithoutFileheader: vi.fn(),
      getOriginFileheaderRegExp: vi.fn(),
    };
  });

  describe('getOriginFileheaderRange', () => {
    it('should call provider method and return range', () => {
      const mockRange = {
        start: { line: 0, character: 0 },
        end: { line: 2, character: 0 },
      };
      mockProvider.getOriginFileheaderRange.mockReturnValue(mockRange);

      const result = getOriginFileheaderRange(mockDocument, mockProvider);

      expect(result).toEqual(mockRange);
      expect(mockProvider.getOriginFileheaderRange).toHaveBeenCalledWith(mockDocument);
    });

    it('should handle range with no header', () => {
      const mockRange = {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      };
      mockProvider.getOriginFileheaderRange.mockReturnValue(mockRange);

      const result = getOriginFileheaderRange(mockDocument, mockProvider);

      expect(result).toEqual(mockRange);
    });
  });

  describe('getOriginFileheaderInfo', () => {
    it('should extract header info with single-line patterns', () => {
      const headerRange = {
        start: { line: 0, character: 0 },
        end: { line: 2, character: 0 },
      };
      const headerContent = '// Author: John\n// Date: 2024-01-01\n// Company: Test';

      mockProvider.getOriginFileheaderRange.mockReturnValue(headerRange);
      mockProvider.getOriginContentWithoutFileheader.mockReturnValue('const x = 1;');
      mockDocument.getText.mockReturnValue(headerContent);

      const patterns = [/\/\/ Author: (?<author>\w+)/, /\/\/ Date: (?<date>[\d-]+)/];
      mockProvider.getOriginFileheaderRegExp.mockReturnValue(patterns);

      const result = getOriginFileheaderInfo(mockDocument, mockProvider, false);

      expect(result.range).toEqual(headerRange);
      expect(result.contentWithoutHeader).toBe('const x = 1;');
      expect(result.variables).toBeDefined();
      expect(result.variables?.author).toBe('John');
      expect(result.variables?.date).toBe('2024-01-01');
    });

    it('should extract header info with multi-line pattern', () => {
      const headerRange = {
        start: { line: 0, character: 0 },
        end: { line: 4, character: 0 },
      };
      const headerContent = '/*\n * Author: Jane\n * Date: 2024-06-15\n */';

      mockProvider.getOriginFileheaderRange.mockReturnValue(headerRange);
      mockProvider.getOriginContentWithoutFileheader.mockReturnValue('function test() {}');
      mockDocument.getText.mockReturnValue(headerContent);

      const pattern = /\/\*\s*\n\s*\* Author: (?<author>\w+)\s*\n\s*\* Date: (?<date>[\d-]+)/;
      mockProvider.getOriginFileheaderRegExp.mockReturnValue(pattern);

      const result = getOriginFileheaderInfo(mockDocument, mockProvider, true);

      expect(result.range).toEqual(headerRange);
      expect(result.contentWithoutHeader).toBe('function test() {}');
      expect(result.variables?.author).toBe('Jane');
      expect(result.variables?.date).toBe('2024-06-15');
    });

    it('should handle no matches in single-line mode', () => {
      const headerRange = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      mockProvider.getOriginFileheaderRange.mockReturnValue(headerRange);
      mockProvider.getOriginContentWithoutFileheader.mockReturnValue('code content');
      mockDocument.getText.mockReturnValue('// Some comment');

      const patterns = [/no-match-pattern/];
      mockProvider.getOriginFileheaderRegExp.mockReturnValue(patterns);

      const result = getOriginFileheaderInfo(mockDocument, mockProvider, false);

      expect(result.variables).toBeUndefined();
    });

    it('should handle no matches in multi-line mode', () => {
      const headerRange = {
        start: { line: 0, character: 0 },
        end: { line: 2, character: 0 },
      };

      mockProvider.getOriginFileheaderRange.mockReturnValue(headerRange);
      mockProvider.getOriginContentWithoutFileheader.mockReturnValue('code');
      mockDocument.getText.mockReturnValue('// no match here');

      const pattern = /\/\*[\s\S]*?\*\//;
      mockProvider.getOriginFileheaderRegExp.mockReturnValue(pattern);

      const result = getOriginFileheaderInfo(mockDocument, mockProvider, true);

      expect(result.variables).toBeUndefined();
    });

    it('should handle multiple pattern matches in single-line mode', () => {
      const headerRange = {
        start: { line: 0, character: 0 },
        end: { line: 3, character: 0 },
      };
      const headerContent = '// Author: Alice\n// Version: 1.0\n// License: MIT';

      mockProvider.getOriginFileheaderRange.mockReturnValue(headerRange);
      mockProvider.getOriginContentWithoutFileheader.mockReturnValue('');
      mockDocument.getText.mockReturnValue(headerContent);

      const patterns = [
        /\/\/ Author: (?<author>\w+)/,
        /\/\/ Version: (?<version>[\d.]+)/,
        /\/\/ License: (?<license>\w+)/,
      ];
      mockProvider.getOriginFileheaderRegExp.mockReturnValue(patterns);

      const result = getOriginFileheaderInfo(mockDocument, mockProvider, false);

      expect(result.variables).toBeDefined();
      expect(result.variables?.author).toBe('Alice');
      expect(result.variables?.version).toBe('1.0');
      expect(result.variables?.license).toBe('MIT');
    });

    it('should collect variables from multiple patterns', () => {
      const headerRange = {
        start: { line: 0, character: 0 },
        end: { line: 2, character: 0 },
      };
      const headerContent = '// Author: Bob\n// Team: Backend\n// Contact: bob@example.com';

      mockProvider.getOriginFileheaderRange.mockReturnValue(headerRange);
      mockProvider.getOriginContentWithoutFileheader.mockReturnValue('');
      mockDocument.getText.mockReturnValue(headerContent);

      const patterns = [
        /\/\/ Author: (?<author>[\w]+)/,
        /\/\/ Team: (?<team>[\w]+)/,
        /\/\/ Contact: (?<contact>[\w@.]+)/,
      ];
      mockProvider.getOriginFileheaderRegExp.mockReturnValue(patterns);

      const result = getOriginFileheaderInfo(mockDocument, mockProvider, false);

      expect(Object.keys(result.variables || {})).toHaveLength(3);
      expect(result.variables?.author).toBe('Bob');
      expect(result.variables?.team).toBe('Backend');
      expect(result.variables?.contact).toBe('bob@example.com');
    });

    it('should use EOL from document', () => {
      const headerRange = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      mockDocument.eol = 2; // CRLF

      mockProvider.getOriginFileheaderRange.mockReturnValue(headerRange);
      mockProvider.getOriginContentWithoutFileheader.mockReturnValue('');
      mockDocument.getText.mockReturnValue('');
      mockProvider.getOriginFileheaderRegExp.mockReturnValue([]);

      getOriginFileheaderInfo(mockDocument, mockProvider, false);

      expect(mockProvider.getOriginFileheaderRegExp).toHaveBeenCalledWith(2, false);
    });

    it('should handle complex group names in patterns', () => {
      const headerRange = {
        start: { line: 0, character: 0 },
        end: { line: 2, character: 0 },
      };
      const headerContent = '// @author: John Doe\n// @modified: 2024-01-15';

      mockProvider.getOriginFileheaderRange.mockReturnValue(headerRange);
      mockProvider.getOriginContentWithoutFileheader.mockReturnValue('');
      mockDocument.getText.mockReturnValue(headerContent);

      const patterns = [
        /\/\/ @author: (?<authorName>[\w\s]+?)\n/,
        /\/\/ @modified: (?<modifiedDate>[\d-]+)/,
      ];
      mockProvider.getOriginFileheaderRegExp.mockReturnValue(patterns);

      const result = getOriginFileheaderInfo(mockDocument, mockProvider, false);

      expect(result.variables?.authorName?.trim()).toBe('John Doe');
      expect(result.variables?.modifiedDate).toBe('2024-01-15');
    });
  });
});
