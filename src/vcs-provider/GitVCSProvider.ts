import dayjs, { Dayjs } from 'dayjs';
import { stat } from 'fs/promises';
import { dirname } from 'path';
import { exec, getFirstLine } from '../utils/utils';
import { BaseVCSProvider } from './BaseVCSProvider';
import { logger } from '@/extension';
import { CustomError, ErrorCode } from '@/error';

export class GitVCSProvider extends BaseVCSProvider {
  public async validate(repoPath: string): Promise<void> {
    try {
      await exec('git status', { cwd: repoPath });
    } catch (error) {
      logger.handleError(new CustomError(ErrorCode.GitNotInit, error));
    }
  }
  public async getAuthorName(filePath: string): Promise<string> {
    try {
      const authors = await exec(
        `git --no-pager log --format='%aN' --follow --reverse ${filePath}`,
        { cwd: dirname(filePath) },
      );
      // 如果结果有空格，会有单引号
      return getFirstLine(authors).replace(/'/g, '');
    } catch (error) {
      logger.handleError(new CustomError(ErrorCode.GitGetUserNameFail, error));
    }
    return '';
  }
  public async getAuthorEmail(filePath: string): Promise<string> {
    try {
      const emails = await exec(
        `git --no-pager log --format='%aE' --follow --reverse ${filePath}`,
        { cwd: dirname(filePath) },
      );
      return getFirstLine(emails).replace(/'/g, '');
    } catch (error) {
      logger.handleError(new CustomError(ErrorCode.GitGetUserEmailFail, error));
    }
    return '';
  }
  public async getUserName(repoPath: string): Promise<string> {
    try {
      const userName = await exec(`git config user.name`, { cwd: repoPath });
      return getFirstLine(userName);
    } catch (error) {
      logger.handleError(new CustomError(ErrorCode.ShouldSetUserName, error));
    }
    return '';
  }
  public async getUserEmail(repoPath: string): Promise<string> {
    try {
      const userEmail = await exec(`git config user.email`, { cwd: repoPath });
      return getFirstLine(userEmail);
    } catch (error) {
      logger.handleError(new CustomError(ErrorCode.ShouldSetUserName, error));
    }
    return '';
  }
  public async getBirthtime(filePath: string): Promise<Dayjs> {
    try {
      const isoTimes = await exec(
        `git --no-pager log --format='%ai' --follow --reverse ${filePath}`,
        { cwd: dirname(filePath) },
      );

      const ctimeISO = getFirstLine(isoTimes).replace(/'/g, '');

      return dayjs(ctimeISO);
    } catch (error) {
      logger.handleError(new CustomError(ErrorCode.GitGetBirthtimeFail, error));
      const fileStat = await stat(filePath);
      return dayjs(fileStat.birthtime);
    }
  }

  public async isTracked(filePath: string): Promise<boolean> {
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

  public async isChanged(filePath: string): Promise<boolean> {
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
