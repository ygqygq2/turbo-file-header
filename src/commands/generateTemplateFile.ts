import * as vscode from 'vscode';
import { logger, generateCustomTemplate } from '@/extension';
import { CustomError, ErrorCode } from '@/error';
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
