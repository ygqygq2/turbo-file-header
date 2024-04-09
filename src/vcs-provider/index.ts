import { CustomError, ErrorCode } from '@/error';
import { logger } from '@/extension';
import { findVCSRoot } from '@/utils/utils';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';
import fs from 'fs';
import path from 'path';
import { BaseVCSProvider } from './BaseVCSProvider';
import { GitVCSProvider } from './GitVCSProvider';
import { SVNProvider } from './SvnVCSProvider';

export async function createVCSProvider(): Promise<BaseVCSProvider | undefined> {
  const activeWorkspace = await getActiveDocumentWorkspace();
  if (!activeWorkspace) {
    logger.throw(new CustomError(ErrorCode.WorkspaceFolderNotFound));
  }
  const activePath = activeWorkspace?.uri.fsPath || '';

  const vcsRootPath = (await findVCSRoot(activePath)) || '';
  if (!vcsRootPath) {
    logger.throw(new CustomError(ErrorCode.NoVCSProvider));
  }

  let vcsProvider: BaseVCSProvider | undefined;
  if (fs.existsSync(path.join(vcsRootPath, '.git'))) {
    vcsProvider = new GitVCSProvider();
  } else if (fs.existsSync(path.join(vcsRootPath, '.svn'))) {
    vcsProvider = new SVNProvider();
  }

  const isValid = vcsProvider?.validate(vcsRootPath);
  if (isValid) {
    return vcsProvider;
  }
  logger.throw(new CustomError(ErrorCode.NoVCSProvider));
}
