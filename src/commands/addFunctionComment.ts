import * as vscode from 'vscode';

import { fileheaderManager } from '@/extension';
import { Command } from '@/typings/types';

export const addFunctionComment = (): Command => {
  return {
    name: 'turboFileHeader.addFunctionComment',
    handler: async (_context: vscode.ExtensionContext, args?: unknown[]) => {
      let activeEditor: vscode.TextEditor | undefined;
      if (args && args[0]) {
        activeEditor = (args[0] as { activeEditor?: vscode.TextEditor }).activeEditor;
      }
      activeEditor = activeEditor ?? vscode.window.activeTextEditor;

      if (!activeEditor) {
        return;
      }

      const currentDocument = activeEditor?.document;
      if (!currentDocument) {
        vscode.window.showErrorMessage('Turbo File Header: You should open a file first.');
        return;
      }
      fileheaderManager.updateFunctionComment(activeEditor);
    },
  };
};
