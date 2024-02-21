import { generateCustomTemplate } from '@/extension';
import { ExtensionContext } from 'vscode';

export const generateTemplateConfig = {
  name: 'turboFileHeader.generateTemplateConfig',
  handler: async (args?: unknown[], context?: ExtensionContext) => {
    if (context) {
      generateCustomTemplate.createCustomTemplate(context);
    }
  },
};
