import * as vscode from 'vscode';

import { fileheaderManager } from '@/extension';
import { Command } from '@/typings/types';

export const batchUpdateFileheader = (): Command => {
  return {
    name: 'turboFileHeader.batchUpdateFileheader',
    handler: async (_context: vscode.ExtensionContext, _args?: unknown[]) => {
      await fileheaderManager.batchUpdateFileheader();
    },
  };
};
