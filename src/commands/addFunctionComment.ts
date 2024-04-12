import * as vscode from 'vscode';

import { fileheaderManager } from '@/extension';
import { Command } from '@/typings/types';

export const addFunctionComment = (): Command => {
  return {
    name: 'turboFileHeader.addFunctionComment',
    handler: async (_context: vscode.ExtensionContext, args?: unknown[]) => {
      const { activeEditor = vscode.window.activeTextEditor } = (args ?? [])[0] as {
        activeEditor?: vscode.TextEditor;
      };

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
