import fs from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findVCSRoot } from '@/utils/utils';
import { getActiveDocumentWorkspaceUri } from '@/utils/vscode-utils';
import { createVCSProvider } from '@/vcs-provider';
import { GitVCSProvider } from '@/vcs-provider/GitVCSProvider';

const { validateMock } = vi.hoisted(() => ({ validateMock: vi.fn() }));

vi.mock('vscode');
vi.mock('fs', async (importOriginal) => {
  const mod = await importOriginal<typeof import('fs')>();
  const existsSync = vi.fn<(path: string) => boolean>();
  return {
    existsSync,
    default: { ...mod, existsSync },
  } as unknown as typeof mod;
});
vi.mock('@/services', () => ({
  logger: {
    // 模拟 Logger.throw：抛出传入的错误
    throw: vi.fn((error: unknown) => {
      throw error;
    }),
    handleError: vi.fn(),
  },
  contextService: {
    getContext: vi.fn().mockReturnValue({}),
  },
}));
vi.mock('@/utils/vscode-utils', () => ({
  getActiveDocumentWorkspaceUri: vi.fn(),
}));
vi.mock('@/utils/utils', () => ({
  findVCSRoot: vi.fn(),
}));
vi.mock('@/vcs-provider/GitVCSProvider', () => ({
  GitVCSProvider: class {
    validate = validateMock;
  },
}));
vi.mock('@/vcs-provider/SvnVCSProvider', () => ({
  SVNProvider: class {
    validate = validateMock;
  },
}));

const existsSyncMock = vi.mocked(fs.existsSync);
const findVCSRootMock = vi.mocked(findVCSRoot);
const getActiveDocumentWorkspaceUriMock = vi.mocked(getActiveDocumentWorkspaceUri);

async function expectRejected(promise: Promise<unknown>) {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeDefined();
}

describe('createVCSProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateMock.mockResolvedValue(true);
    getActiveDocumentWorkspaceUriMock.mockResolvedValue({ fsPath: '/workspace' } as never);
    findVCSRootMock.mockResolvedValue('/workspace');
    existsSyncMock.mockImplementation(((p: string) => p.endsWith('.git')) as never);
  });

  it('awaits validate and returns provider when valid', async () => {
    const provider = await createVCSProvider();
    expect(provider).toBeInstanceOf(GitVCSProvider);
    // validate 是异步的，必须被 await 才能真正生效
    expect(validateMock).toHaveBeenCalledTimes(1);
  });

  it('throws when validate fails (awaited, not truthy promise)', async () => {
    validateMock.mockResolvedValue(false);
    await expectRejected(createVCSProvider());
    expect(validateMock).toHaveBeenCalledTimes(1);
  });

  it('throws when no vcs root found', async () => {
    findVCSRootMock.mockResolvedValue(null as never);
    await expectRejected(createVCSProvider());
  });

  it('throws when neither .git nor .svn exists', async () => {
    existsSyncMock.mockReturnValue(false as never);
    await expectRejected(createVCSProvider());
    expect(validateMock).not.toHaveBeenCalled();
  });
});
