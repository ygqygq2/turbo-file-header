import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import { FileheaderManager } from '@/fileheader/FileheaderManager';
import { logger } from '@/services';

vi.mock('vscode');
vi.mock('@/services', () => ({
  logger: {
    handleError: vi.fn(),
    info: vi.fn(),
  },
}));
vi.mock('@/utils/with-progress', () => ({
  withProgress: vi.fn(async (_title: string, cb: (progress: unknown) => Promise<void>) =>
    cb({ report: vi.fn() }),
  ),
  updateProgress: vi.fn(),
}));

const loggerMock = vi.mocked(logger, true);

function createManager(files: string[]) {
  const fileMatcher = {
    findFiles: vi.fn().mockResolvedValue(files.map((f) => vscode.Uri.file(f))),
  };
  const manager = new FileheaderManager(
    {} as never,
    fileMatcher as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { manager, findFiles: vi.mocked(fileMatcher.findFiles) };
}

function makeDocument(fsPath: string) {
  return { uri: vscode.Uri.file(fsPath), save: vi.fn().mockResolvedValue(undefined) } as never;
}

describe('FileheaderManager - batchUpdateFileheader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jest-mock-vscode 的 workspace.openTextDocument / commands.executeCommand 可能不是 vi.fn，直接赋值
    vi.mocked(vscode.workspace, true).openTextDocument = vi
      .fn()
      .mockImplementation(async (uri: never) => makeDocument((uri as { fsPath: string }).fsPath));
    vi.mocked(vscode.commands, true).executeCommand = vi.fn().mockResolvedValue(undefined);
  });

  it('updates all files once when no failure', async () => {
    const { manager } = createManager(['/a.ts', '/b.ts']);
    const updateFileheader = vi.fn().mockResolvedValue(true);
    (manager as { updateFileheader: unknown }).updateFileheader = updateFileheader;

    await manager.batchUpdateFileheader();

    expect(updateFileheader).toHaveBeenCalledTimes(2);
    expect(loggerMock.handleError).not.toHaveBeenCalled();
  });

  it('caps retries for persistently failing files instead of looping forever', async () => {
    const { manager } = createManager(['/bad.ts', '/good.ts']);
    // bad.ts 一直失败，good.ts 成功；初始尝试 + 最多 2 次重试 = 3 次
    const updateFileheader = vi
      .fn()
      .mockImplementation(async (document: { uri: { fsPath: string } }) => {
        if (document.uri.fsPath === '/bad.ts') {
          throw new Error('boom');
        }
        return true;
      });
    (manager as { updateFileheader: unknown }).updateFileheader = updateFileheader;

    await manager.batchUpdateFileheader();

    const badAttempts = updateFileheader.mock.calls.filter(
      ([doc]) => (doc as { uri: { fsPath: string } }).uri.fsPath === '/bad.ts',
    ).length;
    const goodAttempts = updateFileheader.mock.calls.filter(
      ([doc]) => (doc as { uri: { fsPath: string } }).uri.fsPath === '/good.ts',
    ).length;

    expect(badAttempts).toBe(3);
    expect(goodAttempts).toBe(1);
    expect(loggerMock.handleError).toHaveBeenCalled();
  });
});
