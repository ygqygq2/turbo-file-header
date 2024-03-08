import * as vscode from 'vscode';
import { DocumentHandler } from './DocumentHandler';
import { getAllCommands } from '@/commands';
import { FileheaderManager } from '@/fileheader/FileheaderManager';
import { FileWatcher } from './FileWatcher';
import { Command } from '@/typings/types';
import { useParser } from '@/parser';
import { ConfigEvent } from '@/configuration/ConfigEvent';
import { LanguageEvent } from '@/languages/LanguageEvent';

export class ExtensionActivator {
  private static _context: vscode.ExtensionContext;
  private configEvent: ConfigEvent;
  private languageEvent: LanguageEvent;
  private disposers: vscode.Disposable[] = [];
  private fileWatcher: FileWatcher;
  private documentHandler: DocumentHandler;
  private fileheaderManager: FileheaderManager;

  constructor(
    configEvent: ConfigEvent,
    languageEvent: LanguageEvent,
    fileWatcher: FileWatcher,
    documentHandler: DocumentHandler,
    fileheaderManager: FileheaderManager,
  ) {
    this.configEvent = configEvent;
    this.languageEvent = languageEvent;
    this.fileWatcher = fileWatcher;
    this.documentHandler = documentHandler;
    this.fileheaderManager = fileheaderManager;
  }

  activate = async (context: vscode.ExtensionContext) => {
    const parser = useParser();
    await this.fileheaderManager.loadProviders();

    this.disposers.push(this.configEvent.registerEvent());
    this.disposers.push(this.languageEvent.registerEvent());

    // 获取所有命令
    const commands: Array<Command> = getAllCommands();
    // 遍历所有命令，注册命令
    for (const { name, handler } of commands) {
      vscode.commands.registerCommand(name, (...args: unknown[]) => {
        handler([context, ...args]);
      });
    }

    if (vscode.window.activeTextEditor) {
      await parser.setEditor(vscode.window.activeTextEditor);
      parser.updateDecorations(true);
    }

    vscode.window.onDidChangeActiveTextEditor(
      async (editor) => {
        if (editor) {
          // Set regex for updated language
          await parser.setEditor(editor);

          // Update decorations for newly active file
          parser.updateDecorations(true);
        }
      },
      null,
      context.subscriptions,
    );

    vscode.workspace.onDidChangeTextDocument(
      (event) => {
        // Trigger updates if the text was changed in the same document
        if (event.document === parser.getEditor()?.document) {
          parser.updateDecorations();
        }
      },
      null,
      context.subscriptions,
    );

    // 监控配置文件变化
    this.fileWatcher.createWatcher();

    this.disposers.push(
      vscode.workspace.onDidChangeWorkspaceFolders(() => this.fileWatcher.createWatcher()),
    );

    this.disposers.push(
      vscode.workspace.onDidCreateFiles((e) => this.documentHandler.onCreateDocument(e)),
    );
    this.disposers.push(
      vscode.workspace.onWillSaveTextDocument((e) => this.documentHandler.onSaveDocument(e)),
    );
    this.documentHandler.onDidChangeVisibleTextEditors(vscode.window.visibleTextEditors);
    this.disposers.push(
      vscode.window.onDidChangeVisibleTextEditors((editors) =>
        this.documentHandler.onDidChangeVisibleTextEditors(editors),
      ),
    );
  };

  deactivate = () => {
    for (const disposer of this.disposers) {
      disposer.dispose();
    }
  };
}
