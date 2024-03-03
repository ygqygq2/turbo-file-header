import * as vscode from 'vscode';
import { ConfigManager } from '../configuration/ConfigManager';
import { FileheaderManager } from '../fileheader/FileheaderManager';
import { CUSTOM_CONFIG_FILE_NAME, ConfigSection } from '@/constants';

export class DocumentHandler {
  private configManager: ConfigManager;
  private fileheaderManager: FileheaderManager;
  private saveDocumentTimeoutId: NodeJS.Timeout | null = null;

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
        allowInsert: true,
        silent: true,
      });
    }
  };

  public onSaveDocument = async (e: vscode.TextDocumentWillSaveEvent) => {
    const enabled = this.configManager.get<boolean>(ConfigSection.autoUpdateOnSave);
    if (!enabled) {
      return;
    }

    if (e.document.uri.path.includes(`.vscode/${CUSTOM_CONFIG_FILE_NAME}`)) {
      return;
    }

    // 检查是否已经存在一个定时器，如果存在，则清除它
    if (this.saveDocumentTimeoutId) {
      clearTimeout(this.saveDocumentTimeoutId);
      this.saveDocumentTimeoutId = null;
    }

    // 设置新的定时器，并保存定时器标识
    this.saveDocumentTimeoutId = setTimeout(async () => {
      await this.fileheaderManager.updateFileheader(e.document, {
        allowInsert: false,
        silent: true,
      });

      // 定时器执行完毕后，清除定时器标识
      this.saveDocumentTimeoutId = null;
    }, 2000); // 2000毫秒后执行
  };

  public onDidChangeVisibleTextEditors = (e: readonly vscode.TextEditor[]) => {
    this.fileheaderManager.recordOriginFileHash(e.map((it) => it.document));
  };
}
