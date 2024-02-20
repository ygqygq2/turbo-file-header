import { internalProviders, FileheaderLanguageProvider } from '../fileheader-language-providers';

export class FileheaderProviderLoader {
  public async loadProviders(): Promise<FileheaderLanguageProvider[]> {
    const customProviders = await this.loadCustomProvers();

    return [...internalProviders, ...customProviders];
  }

  private async loadCustomProvers(): Promise<FileheaderLanguageProvider[]> {
    const providers: FileheaderLanguageProvider[] = [];
    return providers;
  }
}
