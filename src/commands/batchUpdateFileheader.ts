import { Command } from '@/typings/types';
import { fileheaderManager } from '@/extension';

export const batchUpdateFileheader = (): Command => {
  return {
    name: 'turboFileHeader.batchUpdateFileheader',
    handler: async (_args?: unknown[]) => {
      await fileheaderManager.batchUpdateFileheader();
    },
  };
};
