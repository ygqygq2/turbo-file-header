import * as vscode from 'vscode';
import { ConfigSection, CUSTOM_TEMPLATE_FILE_NAME } from '../constants';
import { extensionConfigManager } from './ExtensionConfigManager';
import { fileheaderManager } from '../fileheader/FileheaderManager';
import { getAllCommands } from '@/commands';
import { Command } from '@/typings/types';

export class Extension {
  private disposers: vscode.Disposable[] = [];
  private customTemplateFileheaderWatcher: vscode.FileSystemWatcher | undefined;

  activate = async (context: vscode.ExtensionContext) => {
    await fileheaderManager.loadProviders();

    // 获取所有命令
    const commands: Array<Command> = getAllCommands();
    // 遍历所有命令，注册命令
    for (const { name, handler } of commands) {
      vscode.commands.registerCommand(name, (args: unknown[]) => {
        handler(args);
      });
    }

    this.createCustomTemplateFileListener();

    this.disposers.push(
      vscode.workspace.onDidChangeWorkspaceFolders(this.createCustomTemplateFileListener),
    );

    this.disposers.push(vscode.workspace.onDidCreateFiles(this.onCreateDocument, this));

    this.disposers.push(vscode.workspace.onWillSaveTextDocument(this.onSaveDocument, this));

    this.onDidChangeVisibleTextEditors(vscode.window.visibleTextEditors);
    this.disposers.push(
      vscode.window.onDidChangeVisibleTextEditors(this.onDidChangeVisibleTextEditors),
    );
  };

  deactivate = () => {
    for (const disposer of this.disposers) {
      disposer.dispose();
    }
  };

  private async onCreateDocument(e: vscode.FileCreateEvent) {
    const enabled = extensionConfigManager.get<boolean>(ConfigSection.autoInsertOnCreateFile);
    if (!enabled) {
      return;
    }

    for (const file of e.files) {
      const document = await vscode.workspace.openTextDocument(file);
      if (document.lineCount > 1 || document.lineAt(0).text.trim().length !== 0) {
        return;
      }
      await fileheaderManager.updateFileheader(document, {
        silent: true,
      });
    }
  }

  private onSaveDocument(e: vscode.TextDocumentWillSaveEvent) {
    const enabled = extensionConfigManager.get<boolean>(ConfigSection.autoUpdateOnSave);
    if (!enabled) {
      return;
    }

    if (e.document.uri.path.includes(`.vscode/${CUSTOM_TEMPLATE_FILE_NAME}`)) {
      return;
    }
    // disable insert new fileheader because it will cause some issues
    // we only support update origin fileheader
    const updatePromise = fileheaderManager.updateFileheader(e.document, {
      allowInsert: false,
      silent: true,
    });
    e.waitUntil(updatePromise);
  }

  private onDidChangeVisibleTextEditors(e: readonly vscode.TextEditor[]) {
    fileheaderManager.recordOriginFileHash(e.map((it) => it.document));
  }

  private async createCustomTemplateFileListener() {
    this.customTemplateFileheaderWatcher?.dispose();
    this.customTemplateFileheaderWatcher = vscode.workspace.createFileSystemWatcher(
      '**/.vscode/fileheader.template.js',
    );

    const reloadProviders = () => {
      fileheaderManager.loadProviders();
    };

    this.customTemplateFileheaderWatcher.onDidCreate(reloadProviders);
    this.customTemplateFileheaderWatcher.onDidChange(reloadProviders);
    this.customTemplateFileheaderWatcher.onDidDelete(reloadProviders);
  }
}

export const extension = new Extension();
