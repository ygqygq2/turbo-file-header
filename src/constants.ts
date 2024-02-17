import { IFileheaderVariables } from './typings/types';

export enum ConfigSection {
  userName = 'TurboFileHeader.userName',
  userEmail = 'TurboFileHeader.userEmail',
  companyName = 'TurboFileHeader.companyName',
  dateFormat = 'TurboFileHeader.dateFormat',
  autoInsertOnCreateFile = 'TurboFileHeader.autoInsertOnCreateFile',
  autoUpdateOnSave = 'TurboFileHeader.autoUpdateOnSave',
  disableFields = 'TurboFileHeader.disableFields',
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

export const CUSTOM_TEMPLATE_FILE_NAME = 'fileheader.template.js';

export const UPDATE_FILEHEADER_THRESHOLD = 10;

export const TEMPLATE_VARIABLE_KEYS = Reflect.ownKeys(
  WILDCARD_ACCESS_VARIABLES,
) as (keyof IFileheaderVariables)[];
