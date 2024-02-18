import dayjs, { Dayjs } from 'dayjs';
import { dirname } from 'path';
import { CommandExecError } from '../error/CommandExecError';
import { exec, getFirstLine } from '../utils/utils';
import { BaseVCSProvider } from './types';
import { ErrorCode, errorCodeMessages } from '@/error/ErrorHandler.enum';
import { CustomError, errorHandler } from '@/error/ErrorHandler';

export class GitVCSProvider implements BaseVCSProvider {
  async validate(repoPath: string): Promise<void> {
    try {
      await exec('git status', { cwd: repoPath });
    } catch (error) {
      errorHandler.handle(
        new CustomError(ErrorCode.GitNotInit, errorCodeMessages[ErrorCode.GitNotInit]),
      );
    }
  }
  async getAuthorName(filePath: string): Promise<string> {
    try {
      const authors = await exec(
        `git --no-pager log --format='%aN' --follow --reverse ${filePath}`,
        { cwd: dirname(filePath) },
      );
      // 如果结果有空格，会有单引号
      return getFirstLine(authors).replace(/'/g, '');
    } catch (error) {
      errorHandler.handle(
        new CustomError(ErrorCode.GetUserNameFail, errorCodeMessages[ErrorCode.GetUserNameFail]),
      );
    }
    return '';
  }
  async getAuthorEmail(filePath: string): Promise<string> {
    try {
      const emails = await exec(
        `git --no-pager log --format='%aE' --follow --reverse ${filePath}`,
        { cwd: dirname(filePath) },
      );
      return getFirstLine(emails).replace(/'/g, '');
    } catch (error) {
      console.error(error);
    }
    return '';
  }
  async getUserName(repoPath: string): Promise<string> {
    try {
      const userName = await exec(`git config user.name`, { cwd: repoPath });
      return getFirstLine(userName);
    } catch (e) {
      if (e instanceof CommandExecError) {
        errorHandler.handle(
          new CustomError(ErrorCode.GetUserNameFail, errorCodeMessages[ErrorCode.GetUserNameFail]),
        );
      }
      throw e;
    }
  }
  async getUserEmail(repoPath: string): Promise<string> {
    try {
      const userEmail = await exec(`git config user.email`, { cwd: repoPath });
      return getFirstLine(userEmail);
    } catch (e) {
      if (e instanceof CommandExecError) {
        throw new CustomError(
          `You should set user.email in git config first.
Set your username via 'git config user.email "your Email"'`,
          ErrorCode.MissingUserNameEmail,
        );
      }
      throw e;
    }
  }
  async getCtime(filePath: string): Promise<Dayjs> {
    try {
      const isoTimes = await exec(
        `git --no-pager log --format='%ai' --follow --reverse ${filePath}`,
        { cwd: dirname(filePath) },
      );

      const ctimeISO = getFirstLine(isoTimes).replace(/'/g, '');

      return dayjs(ctimeISO);
    } catch (error) {
      console.error(error);
    }
    return dayjs(new Date());
  }

  async isTracked(filePath: string): Promise<boolean> {
    try {
      const [result, status] = await Promise.all([
        exec(`git ls-files ${filePath}`, {
          cwd: dirname(filePath),
        }),
        await exec(`git status --short ${filePath}`, {
          cwd: dirname(filePath),
        }),
      ]);
      if (!result) {
        return false;
      }
      if (status[0] === 'A') {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  async hasChanged(filePath: string): Promise<boolean> {
    try {
      const result = await exec(`git status --porcelain ${filePath}`, {
        cwd: dirname(filePath),
      });
      return !!result && !result.replace(/'/g, '').startsWith('M');
    } catch {
      return false;
    }
  }
}
