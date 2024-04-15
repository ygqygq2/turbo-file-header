import * as vscode from 'vscode';

import { TEMPLATE_SYMBOL_KEY } from '../constants';

export type TemplateInterpolation = string | number | null | undefined | boolean | Template;

export type Template = {
  [TEMPLATE_SYMBOL_KEY]: true;
  strings: TemplateStringsArray;
  interpolations: TemplateInterpolation[];
};

export type ITemplateFunction = (
  strings: TemplateStringsArray,
  ...interpolations: TemplateInterpolation[]
) => Template;

/**
 * Fileheader variables
 * some fields are inspired by https://www.jetbrains.com/help/idea/file-template-variables.html
 */
export type IFileheaderVariables = {
  /**
   * file create time
   * will get it from VCS or fallback to filesystem when it is not available
   */
  birthtime?: string;

  /**
   * file modified time
   * will get it from VCS or fallback to filesystem when it is not available
   */
  mtime?: string;

  /**
   * if the file is tracked by VCS, it will get the author name from VCS
   * else it will get it from current user name
   */
  authorName?: string;

  /**
   * if the file is tracked by VCS, it will get the author email from VCS
   * else it will get it from current user email
   */
  authorEmail?: string;

  /**
   * user name is from VSCode config, and fallback to VCS config
   */
  userName?: string;

  /**
   * user email is from VSCode config, and fallback to VCS config
   */
  userEmail?: string;

  companyName?: string;

  /**
   * name of current project
   */
  projectName?: string;

  /**
   * the file path, relative to project root
   * POSIX path separator
   */
  filePath?: string;

  /**
   * the directory path, relative to project root
   * POSIX path separator
   */
  dirPath?: string;

  /**
   * filename including extension
   */
  fileName?: string;

  now?: string;
};

export type CustomVariables = {
  [key: string]: string;
};

export type Command = {
  name: string;
  handler: (context: vscode.ExtensionContext, args?: unknown[] | undefined) => Promise<void>;
};

export interface Provider {
  name: string;
  startLineOffset?: number;
  languages: string[];
  template: string;
}

export interface FindFilesConfig {
  include: string;
  exclude: string;
  maxResults?: number;
}

export type ConfigYaml = {
  providers: Provider[];
  findFilesConfig: FindFilesConfig;
};

export interface LanguageConfig {
  id: string;
  extensions: string[];
  aliases: string[];
  configuration: {
    comments: vscode.CommentRule;
  };
}

export type LanguagesConfig = LanguageConfig[];

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

export interface CustomVariable {
  name: string;
  value: string;
}

export interface HeaderLine {
  label: string;
  value: string;
  usePrevious: boolean;
  wholeLine?: boolean;
}

export interface LanguageFunctionCommentSettings {
  languageId: string;
  defaultReturnName?: string;
  defaultReturnType?: string;
  defaultParamType?: string;
}

export type LanguagesSettings = LanguageFunctionCommentSettings[];

export interface FunctionComment {
  languagesSettings: LanguagesSettings;
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
  disableLabels: string[];
  customVariables: CustomVariable[];
  fileheader: HeaderLine[];
  languages: LanguagesConfig;
  patternMultiline: boolean;
  updateHeaderForModifiedFilesOnly: boolean;
  multilineComments: boolean;
  useJSDocStyle: boolean;
  functionComment: FunctionComment;
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

export type Config = vscode.WorkspaceConfiguration & Configuration;
