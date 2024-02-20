export const generateCustomTemplate = () => {
  return {
    name: 'turboFileHeader.generateCustomTemplate',
    handler: async (_args?: unknown[]) => {
      FileheaderLanguageProvider.createCustomTemplate();
    },
  };
};
