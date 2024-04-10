import * as vscode from 'vscode';
import { Command } from '@/typings/types';
import { fileheaderManager } from '@/extension';

export const addFunctionComment = (): Command => {
  return {
    name: 'turboFileHeader.addFunctionComment',
    handler: async (_context: vscode.ExtensionContext, args?: unknown[]) => {
      const activeEditor = ((args ?? [])[0] as vscode.TextEditor) || vscode.window.activeTextEditor;

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
