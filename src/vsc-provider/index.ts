import { existsSync } from 'fs';
import { BaseVCSProvider } from './BaseVCSProvider';
import { GitVCSProvider } from './GitVCSProvider';
import { CustomError } from '@/error/ErrorHandler';
import { ErrorCode } from '@/error/ErrorCodeMessage.enum';
import { errorHandler } from '@/extension';
import { SVNProvider } from './SvnVCSProvider';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';

export async function createVCSProvider(): Promise<BaseVCSProvider | undefined> {
  const activeWorkspace = await getActiveDocumentWorkspace();
  if (!activeWorkspace) {
    errorHandler.throw(new CustomError(ErrorCode.WorkspaceFolderNotFound));
  }

  const gitDirectoryPath = `${activeWorkspace}/.git`;
  const svnDirectoryPath = `${activeWorkspace}/.svn`;
  const isGitRepository = existsSync(gitDirectoryPath);
  if (isGitRepository) {
    return new GitVCSProvider();
  }
  const isSvnRepository = existsSync(svnDirectoryPath);
  if (isSvnRepository) {
    return new SVNProvider();
  }
  errorHandler.throw(new CustomError(ErrorCode.NoVCSProvider));
}
