import path from 'path';
import { existsSync } from 'fs';
import { BaseVCSProvider } from './BaseVCSProvider';
import { GitVCSProvider } from './GitVCSProvider';
import { logger } from '@/extension';
import { SVNProvider } from './SvnVCSProvider';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';
import { CustomError, ErrorCode } from '@/error';

export async function createVCSProvider(): Promise<BaseVCSProvider | undefined> {
  const activeWorkspace = await getActiveDocumentWorkspace();
  if (!activeWorkspace) {
    logger.throw(new CustomError(ErrorCode.WorkspaceFolderNotFound));
  }
  const activePath = activeWorkspace?.uri.fsPath || '';

  const gitDirectoryPath = path.join(activePath, '.git');
  const svnDirectoryPath = path.join(activePath, '.svn');
  const isGitRepository = existsSync(gitDirectoryPath);
  if (isGitRepository) {
    return new GitVCSProvider();
  }
  const isSvnRepository = existsSync(svnDirectoryPath);
  if (isSvnRepository) {
    return new SVNProvider();
  }
  logger.throw(new CustomError(ErrorCode.NoVCSProvider));
}
