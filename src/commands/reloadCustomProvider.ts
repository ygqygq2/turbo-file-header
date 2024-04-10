import { fileheaderManager } from '@/extension';
import * as vscode from 'vscode';

export const reloadCustomTemplateProvider = () => {
  return {
    name: 'turboFileHeader.reloadCustomProvider',
    handler: async (_context: vscode.ExtensionContext, _args?: unknown[]) => {
      fileheaderManager.loadProviders;
    },
  };
};
