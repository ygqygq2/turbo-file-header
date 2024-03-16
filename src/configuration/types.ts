import { LanguagesConfig } from '@/typings/types';

export interface Tag {
  tag: string | string[];
  color: string;
  strikethrough: boolean;
  underline: boolean;
  bold: boolean;
  italic: boolean;
  backgroundColor: string;
}

export interface TagFlatten extends Tag {
  tag: string;
  tagEscaped: string;
}

export interface Configuration {
  userName: string;
  userEmail: string;
  companyName: string;
  dateFormat: string;
  autoInsertOnCreateFile: boolean;
  autoUpdateOnSave: boolean;
  include: string;
  exclude: string;
  disableFields: string[];
  languages: LanguagesConfig;
  updateHeaderForModifiedFilesOnly: boolean;
  multilineComments: boolean;
  useJSDocStyle: boolean;
  highlightPlainText: boolean;
  tags: Tag[];
  tagsLight: Tag[];
  tagsDark: Tag[];
}

export interface ConfigurationFlatten extends Configuration {
  tags: TagFlatten[];
  tagsLight: TagFlatten[];
  tagsDark: TagFlatten[];
}

export type OnDidChangeCallback = (config: ConfigurationFlatten) => void;
