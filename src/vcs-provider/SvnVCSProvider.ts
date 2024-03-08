import { dirname } from 'path';
import dayjs, { Dayjs } from 'dayjs';
import { stat } from 'fs/promises';
import { exec, getFirstLine } from '../utils/utils';
import { BaseVCSProvider } from './BaseVCSProvider';
import { ErrorCode } from '@/error/ErrorCodeMessage.enum';
import { CustomError } from '@/error/ErrorHandler';
import { errorHandler } from '@/extension';

export class SVNProvider extends BaseVCSProvider {
  public async validate(repoPath: string): Promise<void> {
    try {
      await exec('svn --version');
    } catch (error) {
      errorHandler.handle(new CustomError(ErrorCode.SVNCommandNotFound, error));
    }
    try {
      await exec('svn info', { cwd: repoPath });
    } catch (error) {
      errorHandler.handle(new CustomError(ErrorCode.SVNNotInit, error));
    }
  }

  public async getAuthorName(filePath: string): Promise<string> {
    try {
      const authors = await exec(`svn log -l 1 --quiet ${filePath}|awk '/^r/ {print $3}'`, {
        cwd: dirname(filePath),
      });
      return getFirstLine(authors);
    } catch (error) {
      errorHandler.handle(new CustomError(ErrorCode.SVNGetUserNameFail, error));
    }
    return '';
  }

  public async getAuthorEmail(_filePath: string): Promise<string> {
    try {
      return '';
    } catch (error) {
      errorHandler.handle(new CustomError(ErrorCode.SVNGetUserEmailFail, error));
    }
    return '';
  }

  public async getUserName(repoPath: string): Promise<string> {
    try {
      const userName = await exec(`svn info --show-item last-changed-author`, {
        cwd: repoPath,
      });
      return getFirstLine(userName);
    } catch (error) {
      errorHandler.handle(new CustomError(ErrorCode.SVNInfoShowUserNameFail, error));
    }
    return '';
  }

  public async getUserEmail(_repoPath: string): Promise<string> {
    // SVN 通常不直接存储用户邮箱
    return '';
  }

  // SVN 没有直接的等价于 Git 的 birthtime 命令，通常使用 commit 时间作为参考
  public async getBirthtime(filePath: string): Promise<Dayjs> {
    try {
      const logOutput = await exec(`svn log -l 1 ${filePath}`, {
        cwd: dirname(filePath),
      });
      const dateLine = logOutput.split('\n').find((line) => line.startsWith('Date:'));
      if (!dateLine) {
        throw new Error('Cannot find commit date in SVN log');
      }
      const dateString = dateLine.split(': ')[1];
      return dayjs(new Date(dateString));
    } catch (error) {
      errorHandler.handle(new CustomError(ErrorCode.SVNGetBirthtimeFail, error));
      const fileStat = await stat(filePath);
      return dayjs(fileStat.birthtime);
    }
  }

  public async isTracked(filePath: string): Promise<boolean> {
    try {
      // SVN没有直接的等价于Git的ls-files命令，但可以通过检查文件是否在版本控制下来判断
      const status = await exec(`svn status ${filePath}`, {
        cwd: dirname(filePath),
      });
      return status.includes(filePath);
    } catch (e) {
      return false;
    }
  }

  public async hasChanged(filePath: string): Promise<boolean> {
    try {
      // SVN使用'svn status'命令来检查文件状态，然后判断是否有修改
      const status = await exec(`svn status --show-updates ${filePath}`, {
        cwd: dirname(filePath),
      });

      // 假设只有'M'表示文件被修改过，其他状态如' '表示未修改
      return status.includes('M');
    } catch (error) {
      // 如果发生错误，例如命令执行失败，则认为文件未更改
      errorHandler.handle(new CustomError(ErrorCode.SVNStatusFail, error));
      return false;
    }
  }
}
