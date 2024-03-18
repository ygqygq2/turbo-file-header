type ErrorCodeMessage = {
  [key in ErrorCode]: string;
};

export enum ErrorCode {
  // 其他错误 (800 - 999)
  OpenDocumentFail = 800,
  GetCustomConfigFail = 801,
  UnknownError = 802,

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

  // 保留未来扩展的空间 (1900 - 1999)
  // ...
}

const extensionPrefix = '';

const otherErrorCodeMessage = {
  [ErrorCode.GetCustomConfigFail]: `${extensionPrefix}Failed to get custom config.`,
  [ErrorCode.OpenDocumentFail]: `${extensionPrefix}Failed to open document: `,
  [ErrorCode.UnknownError]: `${extensionPrefix}Unknown error.`,
};

const gitErrorCodeMessage = {
  [ErrorCode.MissingUserNameEmail]: `${extensionPrefix}Missing user name and email.`,
  [ErrorCode.NoVCSProvider]: `${extensionPrefix}No VCS provider available.`,
  [ErrorCode.VCSProviderCreateFail]: `${extensionPrefix}Failed to create VCS provider.`,
  [ErrorCode.GitNotInit]: `${extensionPrefix}Git repository not initialized, please init git via 'git init' first.`,
  [ErrorCode.GitGetUserNameFail]: `${extensionPrefix}Git get commit user name fail.`,
  [ErrorCode.GitGetUserEmailFail]: `${extensionPrefix}Git get commit user email fail.`,
  [ErrorCode.ShouldSetUserName]: `${extensionPrefix}You should set user.name in git config first. Set your username via 'git config user.name "your username"'.`,
  [ErrorCode.ShouldSetUserEmail]: `${extensionPrefix}You should set user.email in git config first. Set your email via 'git config user.email "your email"'.`,
  [ErrorCode.GitGetBirthtimeFail]: `${extensionPrefix}Failed to get commit time.`,
};

const vcsErrorCodeMessage = {
  [ErrorCode.NoVCSProvider]: `${extensionPrefix}No VCS provider available.`,
  [ErrorCode.VCSProviderCreateFail]: `${extensionPrefix}Failed to create VCS provider.`,
  [ErrorCode.VCSInvalid]: `${extensionPrefix}Invalid VCS provider.`,
};

const svnErrorCodeMessage = {
  [ErrorCode.SVNNotInit]: `${extensionPrefix}SVN repository not initialized, please init svn via 'svn checkout' first.`,
  [ErrorCode.SVNGetUserNameFail]: `${extensionPrefix}Failed to get svn user name.`,
  [ErrorCode.SVNGetUserEmailFail]: `${extensionPrefix}Failed to get svn user email.`,
  [ErrorCode.SVNInfoShowUserNameFail]: `${extensionPrefix}Failed to show svn user name.`,
  [ErrorCode.SVNGetBirthtimeFail]: `${extensionPrefix}Failed to get svn commit time.`,
  [ErrorCode.SVNStatusFail]: `${extensionPrefix}Failed to get svn status.`,
  [ErrorCode.SVNCommandNotFound]: `${extensionPrefix}SVN command not found.`,
};

const configLanguageErrorCodeMessage = {
  [ErrorCode.CustomFileheaderConfigFail]: `${extensionPrefix}Failed to generate custom fileheader config.`,
  [ErrorCode.GetConfigurationFail]: `${extensionPrefix}Failed to get configuration.`,
  [ErrorCode.LanguageNotSupport]: `${extensionPrefix}This language is not supported.`,
  [ErrorCode.LanguageProviderNotFound]: `${extensionPrefix}Language provider not found.`,
  [ErrorCode.GenerateTemplateConfigFail]: `${extensionPrefix}Failed to generate template config.`,
};

const workspaceErrorCodeMessage = {
  [ErrorCode.WorkspaceFolderNotFound]: `${extensionPrefix}Your workspace is not contain any folder.`,
};

const fileDirErrorCodeMessage = {
  [ErrorCode.CreateDirFail]: `${extensionPrefix}Failed to create directory: `,
  [ErrorCode.CreateFileFail]: `${extensionPrefix}Failed to create file: `,
};

const customProviderErrorCodeMessage = {
  [ErrorCode.GenerateCustomProviderFail]: `${extensionPrefix}Failed to generate custom provider classes.`,
  [ErrorCode.CustomProviderInstanceFail]: `${extensionPrefix}Failed to instance custom provider: `,
};

const extensionErrorCodeMessage = {
  [ErrorCode.NeedExtensionContext]: `${extensionPrefix}Need extension context.`,
  [ErrorCode.VariableBuilderFail]: `${extensionPrefix}Failed to build variable.`,
  [ErrorCode.UpdateFileHeaderFail]: `${extensionPrefix}Failed to update file header: `,
};

const variableErrorCodeMessage = {
  [ErrorCode.UnknownVariable]: `${extensionPrefix}Unknown variable.`,
};

export const errorCodeMessages: ErrorCodeMessage = {
  ...otherErrorCodeMessage,
  ...gitErrorCodeMessage,
  ...vcsErrorCodeMessage,
  ...svnErrorCodeMessage,
  ...configLanguageErrorCodeMessage,
  ...workspaceErrorCodeMessage,
  ...fileDirErrorCodeMessage,
  ...customProviderErrorCodeMessage,
  ...extensionErrorCodeMessage,
  ...variableErrorCodeMessage,
};
