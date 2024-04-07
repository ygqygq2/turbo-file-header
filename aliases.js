/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const moduleAlias = require('module-alias');

moduleAlias.addAliases({
  '@/': path.resolve(__dirname, './src'),
});
