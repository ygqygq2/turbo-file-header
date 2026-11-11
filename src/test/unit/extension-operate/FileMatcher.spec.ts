import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import { FileMatcher } from '@/extension-operate/FileMatcher';
import { getActiveDocumentWorkspaceUri } from '@/utils/vscode-utils';

vi.mock('vscode');
vi.mock('@/services', () => ({
  contextService: {
    getContext: vi.fn().mockReturnValue({}),
  },
}));
vi.mock('@/utils/vscode-utils', () => ({
  getActiveDocumentWorkspaceUri: vi.fn(),
}));

// jest-mock-vscode 未实现 CancellationTokenSource，手动补充
class MockCancellationTokenSource {
  readonly token = {};
  dispose = vi.fn();
}

beforeAll(() => {
  (vscode as unknown as { CancellationTokenSource: unknown }).CancellationTokenSource =
    MockCancellationTokenSource;
});

const findFilesMock = vi.mocked(vscode.workspace.findFiles);
const asRelativePathMock = vi.mocked(vscode.workspace.asRelativePath);
const getActiveDocumentWorkspaceUriMock = vi.mocked(getActiveDocumentWorkspaceUri);

function createFileMatcher(globalConfig: {
  include?: string;
  exclude?: string;
  [key: string]: unknown;
}) {
  const configManager = {
    getConfiguration: vi.fn(() => globalConfig),
    getConfigurationFromCustomConfig: vi.fn(async () => ({ findFilesConfig: undefined })),
  } as never;

  return new FileMatcher(configManager);
}

describe('FileMatcher - shouldAddHeader', () => {
  beforeEach(() => {
    asRelativePathMock.mockReset();
    asRelativePathMock.mockImplementation(((path: string) =>
      path.replace('/workspace/', '')) as never);
  });

  it('returns true for single include pattern match', () => {
    const matcher = createFileMatcher({ include: '**/*.ts' });
    expect(matcher.shouldAddHeader('/workspace/src/a.ts')).toBe(true);
  });

  it('returns false for non match', () => {
    const matcher = createFileMatcher({ include: '**/*.ts' });
    expect(matcher.shouldAddHeader('/workspace/src/a.js')).toBe(false);
  });

  it('supports comma separated multiple include patterns', () => {
    const matcher = createFileMatcher({ include: '**/*.ts, **/*.md' });
    expect(matcher.shouldAddHeader('/workspace/src/a.ts')).toBe(true);
    expect(matcher.shouldAddHeader('/workspace/README.md')).toBe(true);
    expect(matcher.shouldAddHeader('/workspace/src/a.js')).toBe(false);
  });

  it('does not throw when exclude is empty', () => {
    const matcher = createFileMatcher({ include: '**/*', exclude: undefined });
    expect(() => matcher.shouldAddHeader('/workspace/src/a.ts')).not.toThrow();
    expect(matcher.shouldAddHeader('/workspace/src/a.ts')).toBe(true);
  });

  it('excludes files matching any of comma separated exclude patterns', () => {
    const matcher = createFileMatcher({
      include: '**/*',
      exclude: '**/node_modules/**, **/dist/**',
    });
    expect(matcher.shouldAddHeader('/workspace/dist/a.js')).toBe(false);
    expect(matcher.shouldAddHeader('/workspace/node_modules/a.js')).toBe(false);
    expect(matcher.shouldAddHeader('/workspace/src/a.js')).toBe(true);
  });
});

describe('FileMatcher - findFiles', () => {
  beforeEach(() => {
    findFilesMock.mockReset();
    findFilesMock.mockResolvedValue([]);
    getActiveDocumentWorkspaceUriMock.mockReset();
    getActiveDocumentWorkspaceUriMock.mockResolvedValue({ fsPath: '/workspace' } as never);
  });

  it('returns empty when no active workspace', async () => {
    getActiveDocumentWorkspaceUriMock.mockResolvedValue(undefined as never);
    const matcher = createFileMatcher({});
    const files = await matcher.findFiles();
    expect(files).toEqual([]);
    expect(findFilesMock).not.toHaveBeenCalled();
  });

  it('uses default include pattern when not configured', async () => {
    const matcher = createFileMatcher({});
    await matcher.findFiles();
    expect(findFilesMock).toHaveBeenCalledWith('**/*', undefined, undefined, expect.anything());
  });

  it('converts comma separated include patterns to brace glob', async () => {
    const matcher = createFileMatcher({ include: '**/*.ts, **/*.md' });
    await matcher.findFiles();
    expect(findFilesMock).toHaveBeenCalledWith(
      '{**/*.ts,**/*.md}',
      undefined,
      undefined,
      expect.anything(),
    );
  });

  it('converts comma separated exclude patterns to brace glob', async () => {
    const matcher = createFileMatcher({
      include: '**/*',
      exclude: '**/node_modules/**, **/dist/**',
    });
    await matcher.findFiles();
    expect(findFilesMock).toHaveBeenCalledWith(
      '**/*',
      '{**/node_modules/**,**/dist/**}',
      undefined,
      expect.anything(),
    );
  });
});
