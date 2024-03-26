import { IFileheaderVariables } from './typings/types';

export const CHANNEL_TITLE = 'Turbo File Header';
export const CONFIG_TAG = 'turboFileHeader';

export enum ConfigSection {
  userName = CONFIG_TAG + '.' + 'userName',
  userEmail = CONFIG_TAG + '.' + 'userEmail',
  companyName = CONFIG_TAG + '.' + 'companyName',
  dateFormat = CONFIG_TAG + '.' + 'dateFormat',
  autoInsertOnCreateFile = CONFIG_TAG + '.' + 'autoInsertOnCreateFile',
  autoUpdateOnSave = CONFIG_TAG + '.' + 'autoUpdateOnSave',
  disableLabels = CONFIG_TAG + '.' + 'disableLabels',
  customVariables = CONFIG_TAG + '.' + 'customVariables',
  fileheader = CONFIG_TAG + '.' + 'fileheader',
  language = CONFIG_TAG + '.' + 'language',
  updateHeaderForModifiedFilesOnly = CONFIG_TAG + '.' + 'updateHeaderForModifiedFilesOnly',
  multilineComments = CONFIG_TAG + '.' + 'multilineComments',
  highlightPlainText = CONFIG_TAG + '.' + 'highlightPlainText',
  tags = CONFIG_TAG + '.' + 'tags',
  tagsLight = CONFIG_TAG + '.' + 'tagsLight',
  tagsDark = CONFIG_TAG + '.' + 'tagsDark',
}

export const TEMPLATE_SYMBOL_KEY = Symbol.for('template');

export const TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER = {
  start: '→' as const,
  end: '←' as const,
};

export const TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER = '这是分界符';

export const WILDCARD_ACCESS_VARIABLES: Readonly<Required<IFileheaderVariables>> = {
  birthtime: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_birthtime_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
  mtime: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_mtime_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
  authorName: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_authorName_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
  authorEmail: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_authorEmail_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
  userName: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_userName_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
  userEmail: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_userEmail_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
  companyName: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_companyName_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
  projectName: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_projectName_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
  filePath: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_filePath_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
  dirPath: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_dirPath_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
  fileName: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_fileName_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
  now: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_now_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
};

export const CUSTOM_CONFIG_FILE_NAME = 'fileheader.config.yaml';
