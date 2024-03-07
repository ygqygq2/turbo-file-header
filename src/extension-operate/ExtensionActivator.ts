import * as vscode from 'vscode';
import { DocumentHandler } from './DocumentHandler';
import { getAllCommands } from '@/commands';
import { FileheaderManager } from '@/fileheader/FileheaderManager';
import { FileWatcher } from './FileWatcher';
import { Command } from '@/typings/types';
import { useParser } from '@/parser';
import { ConfigEvent } from '@/configuration/ConfigEvent';
import { LanguageEvent } from '@/languages/LanguageEvent';
import { ConfigManager } from '../configuration/ConfigManager';
import { FileheaderProviderLoader } from '../fileheader/FileheaderProviderLoader';
import { LanguageManager } from '../languages/LanguageManager';
import { FileHashMemento } from '../fileheader/FileHashMemento';
import { ErrorHandler } from '../error/ErrorHandler';
import { GenerateTemplateConfig } from '../fileheader/GenerateTemplateConfig';
import { GenerateCustomProviderClasses } from '../language-providers/GenerateCustomProviderClasses';
import { FileheaderVariableBuilder } from '../fileheader/FileheaderVariableBuilder';
import { ConfigReader } from '../configuration/ConfigReader';
import { vcsProvider } from '../init';

export class ExtensionActivator {
  private static _context: vscode.ExtensionContext;
  public errorHandler: ErrorHandler;
  public configManager: ConfigManager;
  private configReader: ConfigReader;
  public configEvent: ConfigEvent;
  public languageEvent: LanguageEvent;
  private disposers: vscode.Disposable[] = [];
  private fileWatcher: FileWatcher;
  private documentHandler: DocumentHandler;
  public fileheaderManager: FileheaderManager;
  private fileheaderProviderLoader: FileheaderProviderLoader;
  private fileHashMemento: FileHashMemento;
  public languageManager: LanguageManager;
  private fileheaderVariableBuilder: FileheaderVariableBuilder;
  public generateCustomTemplate: GenerateTemplateConfig;
  private generateCustomProviderClasses: GenerateCustomProviderClasses;

  constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.configReader = ConfigReader.getInstance();
    this.configManager = ConfigManager.getInstance(this.configReader);
    this.configEvent = new ConfigEvent(this.configManager);
    this.languageManager = LanguageManager.getInstance();
    this.languageEvent = new LanguageEvent(this.languageManager);
    this.generateCustomProviderClasses = new GenerateCustomProviderClasses(this.configReader);
    this.fileheaderProviderLoader = new FileheaderProviderLoader(
      this.languageManager,
      this.generateCustomProviderClasses,
    );
    this.fileHashMemento = new FileHashMemento();
    this.fileheaderVariableBuilder = new FileheaderVariableBuilder(vcsProvider);
    this.fileheaderManager = new FileheaderManager(
      this.configManager,
      vcsProvider,
      this.fileheaderProviderLoader,
      this.fileHashMemento,
      this.fileheaderVariableBuilder,
    );
    this.fileWatcher = new FileWatcher(this.fileheaderManager);
    this.documentHandler = new DocumentHandler(this.configManager, this.fileheaderManager);
    this.generateCustomTemplate = GenerateTemplateConfig.getInstance();
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
