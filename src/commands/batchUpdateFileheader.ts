import * as vscode from 'vscode';
import { Command } from '@/typings/types';
import { fileheaderManager } from '@/extension';

export const batchUpdateFileheader = (): Command => {
  return {
    name: 'turboFileHeader.batchUpdateFileheader',
    handler: async (_args?: unknown[]) => {
      const files = await vscode.workspace.findFiles('**/*.yourFileExtension');

      files.forEach(async (file) => {
        const document = await vscode.workspace.openTextDocument(file);
        fileheaderManager.updateFileheader(document);
      });
    },
  };
};
