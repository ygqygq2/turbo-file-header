import * as vscode from 'vscode';

import { generateCustomTemplate } from '@/services';
import { Command } from '@/typings/types';

export const generateTemplateConfig = (): Command => {
  return {
    name: 'turboFileHeader.generateTemplateConfig',
    handler: async (context: vscode.ExtensionContext, _args?: unknown[]) => {
      if (context) {
        generateCustomTemplate.createCustomTemplate(context);
      }
    },
  };
};
