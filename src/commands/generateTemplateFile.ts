import * as vscode from 'vscode';
import { errorHandler, generateCustomTemplate } from '@/extension';
import { CustomError, ErrorCode } from '@/error';
import { Command } from '@/typings/types';

export const generateTemplateConfig = (): Command => {
  return {
    name: 'turboFileHeader.generateTemplateConfig',
    handler: async (args?: unknown[] | undefined) => {
      if (!args || args.length === 0) {
        errorHandler.handle(new CustomError(ErrorCode.NeedExtensionContext));
        return;
      }

      const context = args[0] as vscode.ExtensionContext;
      if (context) {
        generateCustomTemplate.createCustomTemplate(context);
      }
    },
  };
};
