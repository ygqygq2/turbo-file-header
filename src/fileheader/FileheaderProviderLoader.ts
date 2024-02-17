import fs from 'fs/promises';
import vscode from 'vscode';
import { internalProviders, FileheaderLanguageProvider } from '../fileheader-language-providers';
import { CUSTOM_TEMPLATE_FILE_NAME } from '../constants';

class FileheaderProviderLoader {
  public async loadProviders(): Promise<FileheaderLanguageProvider[]> {
    const customProviders = await this.loadCustomProvers();
    return [...customProviders, ...internalProviders];
  }

  private async loadCustomProvers(): Promise<FileheaderLanguageProvider[]> {
    const providers: FileheaderLanguageProvider[] = [];
    for (const folder of vscode.workspace.workspaceFolders || []) {
      const path = vscode.Uri.joinPath(folder.uri, '.vscode', CUSTOM_TEMPLATE_FILE_NAME).fsPath;
      if (!(await this.fileExists(path))) {
        continue;
      }
      try {
        const content = await fs.readFile(path, 'utf8');
        const dynamicFunction = new Function(
          'vscode',
          'FileheaderLanguageProvider',
          '__dirname',
          content,
        );
        const templates = dynamicFunction(
          vscode,
          FileheaderLanguageProvider,
          vscode.Uri.file(path).with({ scheme: 'file' }).fsPath,
        ) as (new (workspaceScopeUri: vscode.Uri) => FileheaderLanguageProvider)[];

        templates.forEach((TemplateConstructor) => {
          const instance = new TemplateConstructor(folder.uri);
          if (!(instance instanceof FileheaderLanguageProvider)) {
            return;
          }
          providers.push(instance);
        });
      } catch (e) {
        console.error(e);
        vscode.window.showErrorMessage(
          `Turbo File Header: Your custom template file has runtime error. Reason:\n${(e as Error).message}`,
        );
      }
    }
    return providers;
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
