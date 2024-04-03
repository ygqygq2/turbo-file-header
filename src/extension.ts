import { getAllCommands } from '@/commands';
import { ConfigEvent } from '@/configuration/ConfigEvent';
import { CHANNEL_TITLE } from '@/constants';
import { FileheaderManager } from '@/fileheader/FileheaderManager';
import { LanguageEvent } from '@/languages/LanguageEvent';
import { useParser } from '@/parser';
import { Command } from '@/typings/types';
import { CustomError, Logger } from '@ygqygq2/vscode-log';
import * as vscode from 'vscode';
import { ConfigManager } from './configuration/ConfigManager';
import { ConfigReader } from './configuration/ConfigReader';
import { errorCodeMessages } from './error';
import { DebounceManager } from './extension-operate/DebounceManager';
import { DocumentHandler } from './extension-operate/DocumentHandler';
import { FileMatcher } from './extension-operate/FileMatcher';
import { FileWatcher } from './extension-operate/FileWatcher';
import { FileHashManager } from './fileheader/FileHashManager';
import { FileheaderProviderLoader } from './fileheader/FileheaderProviderLoader';
import { FileheaderProviderService } from './fileheader/FileheaderProviderService';
import { FileheaderVariableBuilder } from './fileheader/FileheaderVariableBuilder';
import { GenerateTemplateConfig } from './fileheader/GenerateTemplateConfig';
import { GenerateCustomProviderClasses } from './language-providers/GenerateCustomProviderClasses';
import { LanguageManager } from './languages/LanguageManager';

CustomError.configure(errorCodeMessages);
Logger.configure(vscode.window, CHANNEL_TITLE);
export const logger = Logger.getInstance();
const configReader = ConfigReader.getInstance();
export const configManager = ConfigManager.getInstance(configReader);
const fileMatcher = new FileMatcher(configManager);
export const configEvent = new ConfigEvent(configManager);
export const languageManager = LanguageManager.getInstance(configManager);
export const languageEvent = new LanguageEvent(languageManager);
const generateCustomProviderClasses = new GenerateCustomProviderClasses(configReader);
const fileheaderProviderLoader = new FileheaderProviderLoader(
  configManager,
  languageManager,
  generateCustomProviderClasses,
);
const fileHashMemento = new FileHashManager();
const fileheaderVariableBuilder = new FileheaderVariableBuilder(configManager);
const fileheaderProviderService = new FileheaderProviderService();
export const fileheaderManager = new FileheaderManager(
  configManager,
  fileMatcher,
  fileheaderProviderLoader,
  fileHashMemento,
  fileheaderVariableBuilder,
  fileheaderProviderService,
);
const fileWatcher = new FileWatcher(configManager, fileheaderManager);
const debounceManager = new DebounceManager();
const documentHandler = new DocumentHandler(debounceManager, configManager, fileheaderManager);
export const generateCustomTemplate = GenerateTemplateConfig.getInstance();

export const activate = async (context: vscode.ExtensionContext) => {
  const parser = useParser();
  await fileheaderManager.loadProviders();

  context.subscriptions.push(configEvent.registerEvent());
  context.subscriptions.push(languageEvent.registerEvent());

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
  fileWatcher.createWatcher();

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => fileWatcher.createWatcher()),
  );

  context.subscriptions.push(
    vscode.workspace.onDidCreateFiles((e) => documentHandler.onCreateDocument(e)),
  );
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument((e) => documentHandler.onSaveDocument(e)),
  );
  documentHandler.onDidChangeVisibleTextEditors(vscode.window.visibleTextEditors);
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) =>
      documentHandler.onDidOpenTextDocument(document),
    ),
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) =>
      documentHandler.onDidChangeTextDocument(e),
    ),
  );
};

export const deactivate = () => {};
