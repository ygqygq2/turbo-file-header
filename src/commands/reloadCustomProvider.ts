import * as vscode from 'vscode';

import { fileheaderManager } from '@/extension';

export const reloadCustomTemplateProvider = () => {
  return {
    name: 'turboFileHeader.reloadCustomProvider',
    handler: async (_context: vscode.ExtensionContext, _args?: unknown[]) => {
      fileheaderManager.loadProviders;
    },
  };
};
