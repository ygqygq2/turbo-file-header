import { Command } from '@/typings/types';
import { configManager, fileheaderManager } from '@/extension';
import { FileMatcher } from '@/extension-operate/FileMatcher';

export const batchUpdateFileheader = (): Command => {
  return {
    name: 'turboFileHeader.batchUpdateFileheader',
    handler: async (_args?: unknown[]) => {
      // const config = await configManager.getConfigurationFromCustomConfig();
      // const { findFilesConfig = {} } = config ?? {};
      // const fileMatcher = new FileMatcher(findFilesConfig);
      await fileheaderManager.batchUpdateFileheader(FileMatcher);
    },
  };
};
