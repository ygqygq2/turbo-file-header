import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import { DebounceManager } from '@/extension-operate/DebounceManager';
import { DocumentHandler } from '@/extension-operate/DocumentHandler';
import { logger } from '@/services';

vi.mock('vscode');
vi.mock('@/services', () => ({
  logger: {
    handleError: vi.fn(),
  },
}));

const loggerMock = vi.mocked(logger, true);
const CUSTOM_CONFIG_PATH = `/workspace/.vscode/fileheader.config.yaml`;

function createHandler(enabled: boolean) {
  const configManager = {
    get: vi.fn().mockReturnValue(enabled),
  };
  const fileheaderManager = {
    updateFileheader: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
  };
  const handler = new DocumentHandler(
    new DebounceManager(),
    configManager as never,
    fileheaderManager as never,
  );
  return { handler, updateFileheader: fileheaderManager.updateFileheader };
}

function createSaveEvent(fsPath: string) {
  return {
    document: { uri: { fsPath, path: fsPath } },
    waitUntil: vi.fn(),
  } as unknown as vscode.TextDocumentWillSaveEvent & { waitUntil: ReturnType<typeof vi.fn> };
}

describe('DocumentHandler - onSaveDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates fileheader inside save transaction without extra save', async () => {
    const { handler, updateFileheader } = createHandler(true);
    const e = createSaveEvent('/workspace/src/a.ts');

    handler.onSaveDocument(e);

    expect(updateFileheader).toHaveBeenCalledTimes(1);
    expect(updateFileheader).toHaveBeenCalledWith(e.document, {
      allowInsert: false,
      autoSave: false,
    });
    // 修改通过 waitUntil 交给本次保存事务，不额外触发 document.save
    expect(e.waitUntil).toHaveBeenCalledTimes(1);
    const waited = e.waitUntil.mock.calls[0][0] as Promise<unknown>;
    expect(typeof waited?.then).toBe('function');
    await waited;
  });

  it('does nothing when autoUpdateOnSave disabled', () => {
    const { handler, updateFileheader } = createHandler(false);
    const e = createSaveEvent('/workspace/src/a.ts');

    handler.onSaveDocument(e);

    expect(updateFileheader).not.toHaveBeenCalled();
    expect(e.waitUntil).not.toHaveBeenCalled();
  });

  it('skips custom config file', () => {
    const { handler, updateFileheader } = createHandler(true);
    const e = createSaveEvent(CUSTOM_CONFIG_PATH);

    handler.onSaveDocument(e);

    expect(updateFileheader).not.toHaveBeenCalled();
    expect(e.waitUntil).not.toHaveBeenCalled();
  });

  it('swallows update errors so save is not blocked', async () => {
    const { handler, updateFileheader } = createHandler(true);
    updateFileheader.mockRejectedValueOnce(new Error('boom'));
    const e = createSaveEvent('/workspace/src/a.ts');

    handler.onSaveDocument(e);

    const waited = e.waitUntil.mock.calls[0][0] as Promise<unknown>;
    await expect(waited).resolves.toBeUndefined();
    expect(loggerMock.handleError).toHaveBeenCalled();
  });
});
