import * as vscode from 'vscode';
import { Command } from '@/typings/types';
import { fileheaderManager } from '@/extension';

export const addFileheader = (): Command => {
  return {
    name: 'turboFileHeader.addFileheader',
    handler: async (_args?: unknown[]) => {
      const activeEditor = vscode.window.activeTextEditor;

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
