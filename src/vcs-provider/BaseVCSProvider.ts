import { Dayjs } from 'dayjs';

export abstract class BaseVCSProvider {
  /**
   * validate can use this CVSProvider
   */
  public abstract validate(repoPath: string): Promise<boolean>;

  /**
   * get the author name of a file from the VCS
   */
  public abstract getAuthorName(filePath: string): Promise<string>;
  /**
   * get the author email of a file from the VCS
   */
  public abstract getAuthorEmail(filePath: string): Promise<string>;

  /**
   * get current user name from the VCS
   */
  public abstract getUserName(repoPath: string): Promise<string>;

  /**
   * get current user email from the VCS
   */
  public abstract getUserEmail(repoPath: string): Promise<string>;

  /**
   * get file create time from the VCS
   * @param filePath the file path
   */
  public abstract getBirthtime(filePath: string): Promise<Dayjs>;

  /**
   * get the result whether the file is tracked by VCS
   */
  public abstract isTracked(filePath: string): Promise<boolean>;

  public abstract isChanged(filePath: string): Promise<boolean>;
}
