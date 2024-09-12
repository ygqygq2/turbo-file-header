import * as vscode from 'vscode';

import { fileheaderManager } from '@/extension';

export const reloadCustomTemplateProvider = () => {
  return {
    name: 'turboFileHeader.reloadCustomProvider',
    handler: async (_context: vscode.ExtensionContext, _args?: unknown[]) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      fileheaderManager.loadProviders;
    },
  };
};
