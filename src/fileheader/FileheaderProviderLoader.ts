import fs from 'fs/promises';
import { internalProviders, FileheaderLanguageProvider } from '../fileheader-language-providers';

class FileheaderProviderLoader {
  public async loadProviders(): Promise<FileheaderLanguageProvider[]> {
    return [...internalProviders];
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * @singleton
 */
export const fileheaderProviderLoader = new FileheaderProviderLoader();
