import * as vscode from 'vscode';
import { logger, generateCustomTemplate } from '@/extension';
import { CustomError, ErrorCode } from '@/error';
import { Command } from '@/typings/types';

export const generateTemplateConfig = (): Command => {
  return {
    name: 'turboFileHeader.generateTemplateConfig',
    handler: async (args?: unknown[] | undefined) => {
      if (!args || args.length === 0) {
        logger.handleError(new CustomError(ErrorCode.NeedExtensionContext));
        return;
      }

      const context = args[0] as vscode.ExtensionContext;
      if (context) {
        generateCustomTemplate.createCustomTemplate(context);
      }
    },
  };
};
