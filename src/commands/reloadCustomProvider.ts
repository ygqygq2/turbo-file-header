import { fileheaderManager } from '@/extension';

export const reloadCustomTemplateProvider = () => {
  return {
    name: 'turboFileHeader.reloadCustomProvider',
    handler: async (_args?: unknown[]) => {
      fileheaderManager.loadProviders;
    },
  };
};
