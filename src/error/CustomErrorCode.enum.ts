import { createErrorCodeMessages, ErrorCodeMessage } from '@ygqygq2/vscode-log';

export enum CustomErrorCode {
  // Git 相关错误 (1000 - 1009)
  GitNotInit = 1000,
  GitGetUserNameFail = 1001,
  GitGetUserEmailFail = 1002,
  GitGetBirthtimeFail = 1003,
  MissingUserNameEmail = 1004,
  ShouldSetUserName = 1005,
  ShouldSetUserEmail = 1006,
  // 保留 Git 相关错误的空间 (1007 - 1009)

  // VCS 相关错误 (1010 - 1019)
  NoVCSProvider = 1010,
  VCSProviderCreateFail = 1011,
  VCSInvalid = 1012,

  // SVN 相关错误 (1020 - 1029)
  SVNNotInit = 1020,
  SVNGetUserNameFail = 1021,
  SVNGetUserEmailFail = 1022,
  SVNInfoShowUserNameFail = 1023,
  SVNGetBirthtimeFail = 1024,
  SVNStatusFail = 1025,
  SVNCommandNotFound = 1026,
  // 保留 SVN 相关错误的空间 (1027 - 1029)

  // 配置和语言相关错误 (1030 - 1039)
  CustomFileheaderConfigFail = 1030,
  GetConfigurationFail = 1031,
  LanguageNotSupport = 1032,
  LanguageProviderNotFound = 1033,
  GenerateTemplateConfigFail = 1034,
  // 保留 配置和语言相关错误的空间 (1035 - 1039)

  // 工作区相关错误 (1040 - 1049)
  WorkspaceFolderNotFound = 1040,
  // 保留 工作区相关错误的空间 (1041 - 1049)

  // 扩展相关错误 (1050 - 1059)
  NeedExtensionContext = 1050,
  VariableBuilderFail = 1051,
  UpdateFileHeaderFail = 1052,
  // 保留 扩展相关错误的空间 (1053 - 1059)

  // 文件和目录操作错误 (1060 - 1069)
  CreateDirFail = 1060,
  CreateFileFail = 1061,
  // 保留 文件和目录操作错误的空间 (1062 - 1069)

  // 自定义提供者相关错误 (1070 - 1079)
  GenerateCustomProviderFail = 1070,
  CustomProviderInstanceFail = 1071,
  // 保留 自定义提供者相关错误的空间 (1072 - 1079)

  // 变量转换错误 (1080 - 1089)
  UnknownVariable = 1080,

  // 函数参数相关错误 (1090 - 1099)
}

const extensionPrefix = '';

const gitCustomErrorCodeMessage = {
  [CustomErrorCode.MissingUserNameEmail]: `${extensionPrefix}Missing user name and email.`,
  [CustomErrorCode.NoVCSProvider]: `${extensionPrefix}No VCS provider available.`,
  [CustomErrorCode.VCSProviderCreateFail]: `${extensionPrefix}Failed to create VCS provider.`,
  [CustomErrorCode.GitNotInit]: `${extensionPrefix}Git repository not initialized, please init git via 'git init' first.`,
  [CustomErrorCode.GitGetUserNameFail]: `${extensionPrefix}Git get commit user name fail.`,
  [CustomErrorCode.GitGetUserEmailFail]: `${extensionPrefix}Git get commit user email fail.`,
  [CustomErrorCode.ShouldSetUserName]: `${extensionPrefix}You should set user.name in git config first. Set your username via 'git config user.name "your username"'.`,
  [CustomErrorCode.ShouldSetUserEmail]: `${extensionPrefix}You should set user.email in git config first. Set your email via 'git config user.email "your email"'.`,
  [CustomErrorCode.GitGetBirthtimeFail]: `${extensionPrefix}Failed to get commit time.`,
};

const vcsCustomErrorCodeMessage = {
  [CustomErrorCode.NoVCSProvider]: `${extensionPrefix}No VCS provider available.`,
  [CustomErrorCode.VCSProviderCreateFail]: `${extensionPrefix}Failed to create VCS provider.`,
  [CustomErrorCode.VCSInvalid]: `${extensionPrefix}Invalid VCS provider.`,
};

const svnCustomErrorCodeMessage = {
  [CustomErrorCode.SVNNotInit]: `${extensionPrefix}SVN repository not initialized, please init svn via 'svn checkout' first.`,
  [CustomErrorCode.SVNGetUserNameFail]: `${extensionPrefix}Failed to get svn user name.`,
  [CustomErrorCode.SVNGetUserEmailFail]: `${extensionPrefix}Failed to get svn user email.`,
  [CustomErrorCode.SVNInfoShowUserNameFail]: `${extensionPrefix}Failed to show svn user name.`,
  [CustomErrorCode.SVNGetBirthtimeFail]: `${extensionPrefix}Failed to get svn commit time.`,
  [CustomErrorCode.SVNStatusFail]: `${extensionPrefix}Failed to get svn status.`,
  [CustomErrorCode.SVNCommandNotFound]: `${extensionPrefix}SVN command not found.`,
};

const configLanguageCustomErrorCodeMessage = {
  [CustomErrorCode.CustomFileheaderConfigFail]: `${extensionPrefix}Failed to generate custom fileheader config.`,
  [CustomErrorCode.GetConfigurationFail]: `${extensionPrefix}Failed to get configuration.`,
  [CustomErrorCode.LanguageNotSupport]: `${extensionPrefix}This language is not supported.`,
  [CustomErrorCode.LanguageProviderNotFound]: `${extensionPrefix}Language provider not found.`,
  [CustomErrorCode.GenerateTemplateConfigFail]: `${extensionPrefix}Failed to generate template config.`,
};

const workspaceCustomErrorCodeMessage = {
  [CustomErrorCode.WorkspaceFolderNotFound]: `${extensionPrefix}Your workspace is not contain any folder.`,
};

const fileDirCustomErrorCodeMessage = {
  [CustomErrorCode.CreateDirFail]: `${extensionPrefix}Failed to create directory: `,
  [CustomErrorCode.CreateFileFail]: `${extensionPrefix}Failed to create file: `,
};

const customProviderCustomErrorCodeMessage = {
  [CustomErrorCode.GenerateCustomProviderFail]: `${extensionPrefix}Failed to generate custom provider classes.`,
  [CustomErrorCode.CustomProviderInstanceFail]: `${extensionPrefix}Failed to instance custom provider: `,
};

const extensionCustomErrorCodeMessage = {
  [CustomErrorCode.NeedExtensionContext]: `${extensionPrefix}Need extension context.`,
  [CustomErrorCode.VariableBuilderFail]: `${extensionPrefix}Failed to build variable.`,
  [CustomErrorCode.UpdateFileHeaderFail]: `${extensionPrefix}Failed to update file header: `,
};

const variableCustomErrorCodeMessage = {
  [CustomErrorCode.UnknownVariable]: `${extensionPrefix}Unknown variable.`,
};

export const customErrorCodeMessages: ErrorCodeMessage = {
  ...gitCustomErrorCodeMessage,
  ...vcsCustomErrorCodeMessage,
  ...svnCustomErrorCodeMessage,
  ...configLanguageCustomErrorCodeMessage,
  ...workspaceCustomErrorCodeMessage,
  ...fileDirCustomErrorCodeMessage,
  ...customProviderCustomErrorCodeMessage,
  ...extensionCustomErrorCodeMessage,
  ...variableCustomErrorCodeMessage,
};

export const { errorCodeEnum, errorCodeMessages } = createErrorCodeMessages(
  CustomErrorCode,
  customErrorCodeMessages,
);
