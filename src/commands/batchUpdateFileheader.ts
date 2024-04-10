import { fileheaderManager } from '@/extension';
import { Command } from '@/typings/types';
import * as vscode from 'vscode';

export const batchUpdateFileheader = (): Command => {
  return {
    name: 'turboFileHeader.batchUpdateFileheader',
    handler: async (_context: vscode.ExtensionContext, _args?: unknown[]) => {
      await fileheaderManager.batchUpdateFileheader();
    },
  };
};
