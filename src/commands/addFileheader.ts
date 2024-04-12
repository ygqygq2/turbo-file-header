import * as vscode from 'vscode';

import { fileheaderManager } from '@/extension';
import { Command } from '@/typings/types';

export const addFileheader = (): Command => {
  return {
    name: 'turboFileHeader.addFileheader',
    handler: async (_context: vscode.ExtensionContext, args?: unknown[]) => {
      const { activeEditor = vscode.window.activeTextEditor } = (args ?? [])[0] as {
        activeEditor?: vscode.TextEditor;
      };
      // if no active window is open, return
      if (!activeEditor) {
        return;
      }

      const currentDocument = activeEditor?.document;
      if (!currentDocument) {
        vscode.window.showErrorMessage('Turbo File Header: You should open a file first.');
        return;
      }
      fileheaderManager.updateFileheader(currentDocument);
    },
  };
};
