import { fileheaderManager } from '@/fileheader/FileheaderManager';

export const reloadCustomTemplateProvider = () => {
  return {
    name: 'turboFileHeader.reloadCustomTemplateProvider',
    handler: async (_args?: unknown[]) => {
      fileheaderManager.loadProviders;
    },
  };
};
