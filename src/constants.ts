import { IFileheaderVariables } from './typings/types';

export const ConfigTag = 'TurboFileHeader';

export enum ConfigSection {
  userName = ConfigTag + '.' + 'userName',
  userEmail = ConfigTag + '.' + 'userEmail',
  companyName = ConfigTag + '.' + 'companyName',
  dateFormat = ConfigTag + '.' + 'dateFormat',
  autoInsertOnCreateFile = ConfigTag + '.' + 'autoInsertOnCreateFile',
  autoUpdateOnSave = ConfigTag + '.' + 'autoUpdateOnSave',
  disableFields = ConfigTag + '.' + 'disableFields',
  language = ConfigTag + '.' + 'language',
  dirtyFileSupport = ConfigTag + '.' + 'dirtyFileSupport',
  multilineComments = ConfigTag + '.' + 'multilineComments',
  highlightPlainText = ConfigTag + '.' + 'highlightPlainText',
  tags = ConfigTag + '.' + 'tags',
  tagsLight = ConfigTag + '.' + 'tagsLight',
  tagsDark = ConfigTag + '.' + 'tagsDark',
}

export const TEMPLATE_SYMBOL_KEY = Symbol.for('template');

export const TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER = {
  start: '→' as const,
  end: '←' as const,
};

export const TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER = '欢迎使用 Turbo File Header';

export const WILDCARD_ACCESS_VARIABLES: Readonly<Required<IFileheaderVariables>> = {
  ctime: `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_ctime_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
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
};

export const CUSTOM_CONFIG_FILE_NAME = 'fileheader.config.yaml';

export const UPDATE_FILEHEADER_THRESHOLD = 10;

export const TEMPLATE_VARIABLE_KEYS = Reflect.ownKeys(
  WILDCARD_ACCESS_VARIABLES,
) as (keyof IFileheaderVariables)[];
