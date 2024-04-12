import * as vscode from 'vscode';

import { ConfigSection, CUSTOM_CONFIG_FILE_NAME } from '@/constants';

import { ConfigManager } from '../configuration/ConfigManager';
import { FileheaderManager } from '../fileheader/FileheaderManager';
import { DebounceManager } from './DebounceManager';

export class DocumentHandler {
  private configManager: ConfigManager;
  private fileheaderManager: FileheaderManager;
  private debounceManager: DebounceManager;

  constructor(
    debounceManager: DebounceManager,
    configManager: ConfigManager,
    fileheaderManager: FileheaderManager,
  ) {
    this.debounceManager = debounceManager;
    this.configManager = configManager;
    this.fileheaderManager = fileheaderManager;
  }

  public onCreateDocument = async (e: vscode.FileCreateEvent) => {
    const enabled = this.configManager.get<boolean>(ConfigSection.autoInsertOnCreateFile);
    if (!enabled) {
      return;
    }

    for (const file of e.files) {
      const fileStat = await vscode.workspace.fs.stat(file);
      if (fileStat.type === vscode.FileType.Directory) {
        return;
      }

      const document = await vscode.workspace.openTextDocument(file);
      if (document.lineCount > 1 || document.lineAt(0).text.trim().length !== 0) {
        return;
      }

      await this.fileheaderManager.updateFileheader(document, {
        allowInsert: true,
        addSelection: true,
        newFile: true,
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

    const fsPath = e.document.uri.fsPath;
    this.debounceManager.debounce(
      'saveDocument' + fsPath,
      async () => {
        await this.fileheaderManager.updateFileheader(e.document, {
          allowInsert: false,
        });
      },
      2000,
    );
  };

  // 标签变化
  public onDidChangeVisibleTextEditors = (e: readonly vscode.TextEditor[]) => {
    this.fileheaderManager.recordOriginFileHash(e.map((it) => it.document));
  };

  // 文本变化时，使用定时器间隔 1 秒处理文件 hash 更新记录
  public onDidChangeTextDocument = (e: vscode.TextDocumentChangeEvent) => {
    const fsPath = e.document.uri.fsPath;
    this.debounceManager.debounce(
      'changeText' + fsPath,
      () => {
        this.fileheaderManager.updateOriginFileHash(e.document);
      },
      1000,
    );
  };

  // 文档打开时
  public onDidOpenTextDocument = (document: vscode.TextDocument) => {
    this.fileheaderManager.updateOriginFileHash(document);
  };
}
