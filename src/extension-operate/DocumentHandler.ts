import * as vscode from 'vscode';
import { ConfigManager } from '../configuration/ConfigManager';
import { FileheaderManager } from '../fileheader/FileheaderManager';
import { CUSTOM_CONFIG_FILE_NAME, ConfigSection } from '@/constants';

export class DocumentHandler {
  private configManager: ConfigManager;
  private fileheaderManager: FileheaderManager;

  constructor(configManager: ConfigManager, fileheaderManager: FileheaderManager) {
    this.configManager = configManager;
    this.fileheaderManager = fileheaderManager;
  }

  public onCreateDocument = async (e: vscode.FileCreateEvent) => {
    const enabled = this.configManager.get<boolean>(ConfigSection.autoInsertOnCreateFile);
    if (!enabled) {
      return;
    }

    for (const file of e.files) {
      const document = await vscode.workspace.openTextDocument(file);
      if (document.lineCount > 1 || document.lineAt(0).text.trim().length !== 0) {
        return;
      }

      await this.fileheaderManager.updateFileheader(document, {
        silent: true,
      });
    }
  };

  public onSaveDocument = (e: vscode.TextDocumentWillSaveEvent) => {
    const enabled = this.configManager.get<boolean>(ConfigSection.autoUpdateOnSave);
    if (!enabled) {
      return;
    }

    if (e.document.uri.path.includes(`.vscode/${CUSTOM_CONFIG_FILE_NAME}`)) {
      return;
    }

    const updatePromise = this.fileheaderManager.updateFileheader(e.document, {
      allowInsert: false,
      silent: true,
    });
    e.waitUntil(updatePromise);
  };

  public onDidChangeVisibleTextEditors = (e: readonly vscode.TextEditor[]) => {
    this.fileheaderManager.recordOriginFileHash(e.map((it) => it.document));
  };
}
