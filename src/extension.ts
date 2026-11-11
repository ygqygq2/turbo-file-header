import * as vscode from 'vscode';

import { getAllCommands } from '@/commands';
import {
  configEvent,
  configManager,
  contextService,
  fileHashManager,
  fileheaderManager,
  languageEvent,
} from '@/services';
import { Command } from '@/typings/types';

import { DebounceManager } from './extension-operate/DebounceManager';
import { DocumentHandler } from './extension-operate/DocumentHandler';
import { FileWatcher } from './extension-operate/FileWatcher';
import { useParser } from './parser';

const fileWatcher = new FileWatcher(configManager, fileheaderManager);
const debounceManager = new DebounceManager();
const documentHandler = new DocumentHandler(debounceManager, configManager, fileheaderManager);

export const activate = async (context: vscode.ExtensionContext) => {
  contextService.setContext(context);
  const parser = useParser();
  await fileheaderManager.loadProviders();

  context.subscriptions.push(configEvent.registerEvent());
  context.subscriptions.push(languageEvent.registerEvent());

  // 获取所有命令
  const commands: Array<Command> = getAllCommands();
  // 遍历所有命令，注册命令
  for (const { name, handler } of commands) {
    context.subscriptions.push(
      vscode.commands.registerCommand(name, async (...args: unknown[]) => {
        handler(context, args);
        if (args && args[0] && typeof args[0] === 'object') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const obj = args[0] as { [key: string]: any };
          for (const key in obj) {
            await context.workspaceState.update(key, obj[key]);
          }
        }
      }),
    );
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
  // 文档关闭时清理对应的 hash 缓存，避免长时间会话内存泄漏
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document: vscode.TextDocument) =>
      fileHashManager.remove(document),
    ),
  );
};

export const deactivate = () => {
  // Clean up resources
  fileHashManager.clear();
  debounceManager.dispose();
  fileWatcher.dispose();
};
