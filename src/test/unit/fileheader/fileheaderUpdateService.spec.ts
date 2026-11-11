import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import { headerChanged } from '@/fileheader/fileheaderChangeService';
import { shouldUpdate } from '@/fileheader/fileheaderUpdateService';
import { initVCSProvider } from '@/init';

vi.mock('vscode');
vi.mock('@/services', () => ({
  logger: {
    handleError: vi.fn(),
    info: vi.fn(),
    throw: vi.fn((error: unknown) => {
      throw error;
    }),
  },
}));
vi.mock('@/init', () => ({
  initVCSProvider: vi.fn(),
}));

const initVCSProviderMock = vi.mocked(initVCSProvider);

function makeRange(noHeader = false) {
  return {
    start: { isEqual: () => noHeader },
    end: { isEqual: () => noHeader },
  } as unknown as vscode.Range;
}

function makeDocument(content: string) {
  return {
    uri: { fsPath: '/workspace/src/a.ts' },
    fileName: '/workspace/src/a.ts',
    isDirty: false,
    getText: () => content,
  } as unknown as vscode.TextDocument;
}

const config = {
  updateHeaderForModifiedFilesOnly: false,
  get: (_key: string, defaultValue?: string) => defaultValue,
} as never;

const HEADER = [
  '/*',
  ' * @file a.ts',
  ' * @author tester',
  ' * @createTime 2024-01-01 00:00:00',
  ' */',
].join('\n');

describe('shouldUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initVCSProviderMock.mockResolvedValue({
      isTracked: async () => true,
      isChanged: async () => true,
    } as never);
  });

  it('new file respects file matcher', async () => {
    const fileMatcher = { shouldAddHeader: vi.fn().mockReturnValue(true) };
    const fileHashManager = {};
    const result = await shouldUpdate(
      fileMatcher as never,
      fileHashManager as never,
      makeDocument(''),
      { range: makeRange(true), contentWithoutHeader: '' } as never,
      HEADER,
      config,
      true,
      true,
    );
    expect(result).toBe(true);
    expect(fileMatcher.shouldAddHeader).toHaveBeenCalled();
  });

  it('empty content means insert', async () => {
    const result = await shouldUpdate(
      {} as never,
      {} as never,
      makeDocument(''),
      { range: makeRange(true), contentWithoutHeader: 'x' } as never,
      HEADER,
      config,
      true,
      false,
    );
    expect(result).toBe(true);
  });

  it('header only document is not updated', async () => {
    const result = await shouldUpdate(
      {} as never,
      {} as never,
      makeDocument(HEADER),
      { range: makeRange(false), contentWithoutHeader: '' } as never,
      HEADER,
      config,
      true,
      false,
    );
    expect(result).toBe(false);
  });

  it('no header and insert not allowed', async () => {
    const result = await shouldUpdate(
      {} as never,
      {} as never,
      makeDocument('code'),
      { range: makeRange(true), contentWithoutHeader: 'code' } as never,
      HEADER,
      config,
      false,
      false,
    );
    expect(result).toBe(false);
  });

  it('no header and insert allowed', async () => {
    const result = await shouldUpdate(
      {} as never,
      {} as never,
      makeDocument('code'),
      { range: makeRange(true), contentWithoutHeader: 'code' } as never,
      HEADER,
      config,
      true,
      false,
    );
    expect(result).toBe(true);
  });

  it('main text changed returns true', async () => {
    const fileHashManager = { isMainTextUpdated: vi.fn().mockReturnValue(true) };
    const result = await shouldUpdate(
      {} as never,
      fileHashManager as never,
      makeDocument('changed code'),
      { range: makeRange(false), contentWithoutHeader: 'changed code' } as never,
      HEADER,
      config,
      true,
      false,
    );
    expect(result).toBe(true);
  });

  it('header only change falls back to headerChanged', async () => {
    // 正文未变（false），文件在 VCS 中有修改，此时由 headerChanged 决定
    const fileHashManager = { isMainTextUpdated: vi.fn().mockReturnValue(false) };
    const result = await shouldUpdate(
      {} as never,
      fileHashManager as never,
      makeDocument('code'),
      { range: makeRange(false), contentWithoutHeader: 'code' } as never,
      HEADER,
      config,
      true,
      false,
    );
    // HEADER 与文件正文无关，header 变化判断基于新头内容
    expect(result).toBe(true);

    const sameHeaderResult = await shouldUpdate(
      {} as never,
      { isMainTextUpdated: vi.fn().mockReturnValue(false) } as never,
      makeDocument(HEADER),
      { range: makeRange(false), contentWithoutHeader: HEADER } as never,
      HEADER,
      config,
      true,
      false,
    );
    expect(sameHeaderResult).toBe(false);
  });

  it('no changes means no update', async () => {
    initVCSProviderMock.mockResolvedValue({
      isTracked: async () => true,
      isChanged: async () => false,
    } as never);
    const fileHashManager = {
      isMainTextUpdated: vi.fn().mockReturnValue(false),
      isHashUpdated: vi.fn().mockReturnValue(false),
    };
    const result = await shouldUpdate(
      {} as never,
      fileHashManager as never,
      makeDocument('code'),
      { range: makeRange(false), contentWithoutHeader: 'code' } as never,
      HEADER,
      config,
      true,
      false,
    );
    expect(result).toBe(false);
  });
});

describe('headerChanged', () => {
  it('ignores date differences when date format matches', () => {
    const newHeader = [
      '/*',
      ' * @file a.ts',
      ' * @author tester',
      ' * @createTime 2025-06-01 12:30:45',
      ' */',
    ].join('\n');
    const result = headerChanged(makeDocument(HEADER), makeRange(false), newHeader, config);
    expect(result).toBe(false);
  });

  it('detects non date content differences', () => {
    const newHeader = HEADER.replace('@author tester', '@author someone');
    const result = headerChanged(makeDocument(HEADER), makeRange(false), newHeader, config);
    expect(result).toBe(true);
  });
});
