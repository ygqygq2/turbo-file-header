type ErrorCodeMessage = {
  [key in ErrorCode]: string;
};

export enum ErrorCode {
  // Git 相关错误 (1000 - 1009)
  GitNotInit = 1000,
  GitGetUserNameFail = 1001,
  GitGetUserEmailFail = 1002,
  GitGetBirthtimeFail = 1003,
  MissingUserNameEmail = 1004,
  ShouldSetUserName = 1005,
  ShouldSetUserEmail = 1006,
  // 保留 Git 相关错误的空间 (1007 - 1009)

  // VCS 相关错误 (1100 - 1109)
  NoVCSProvider = 1100,
  VCSProviderCreateFail = 1101,
  VCSInvalid = 1102,

  // SVN 相关错误 (1200 - 1209)
  SVNNotInit = 1200,
  SVNGetUserNameFail = 1201,
  SVNGetUserEmailFail = 1202,
  SVNInfoShowUserNameFail = 1203,
  SVNGetBirthtimeFail = 1204,
  SVNStatusFail = 1205,
  SVNCommandNotFound = 1206,
  // 保留 SVN 相关错误的空间 (1206 - 1209)

  // 配置和语言相关错误 (1300 - 1309)
  CustomFileheaderConfigFail = 1300,
  GetConfigurationFail = 1301,
  LanguageNotSupport = 1302,
  LanguageProviderNotFound = 1303,
  GenerateTemplateConfigFail = 1304,
  // 保留 配置和语言相关错误的空间 (1305 - 1309)

  // 工作区相关错误 (1400 - 1409)
  WorkspaceFolderNotFound = 1400,
  // 保留 工作区相关错误的空间 (1401 - 1409)

  // 扩展相关错误 (1500 - 1509)
  NeedExtensionContext = 1500,
  VariableBuilderFail = 1501,
  UpdateFileHeaderFail = 1502,
  // 保留 扩展相关错误的空间 (1501 - 1509)

  // 文件和目录操作错误 (1600 - 1609)
  CreateDirFail = 1600,
  CreateFileFail = 1601,
  // 保留 文件和目录操作错误的空间 (1602 - 1609)

  // 自定义提供者相关错误 (1700 - 1709)
  GenerateCustomProviderFail = 1700,
  CustomProviderInstanceFail = 1701,
  // 保留 自定义提供者相关错误的空间 (1702 - 1709)

  // 其他错误 (1800 - 1809)
  OpenDocumentFail = 1800,
  GetCustomConfigFail = 1801,
  UnknownError = 1802,
  // 保留 其他错误的空间 (1803 - 1809)

  // 保留未来扩展的空间 (1900 - 1999)
  // ...
}

const extensionPrefix = '';

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

const otherErrorCodeMessage = {
  [ErrorCode.GetCustomConfigFail]: `${extensionPrefix}Failed to get custom config.`,
  [ErrorCode.OpenDocumentFail]: `${extensionPrefix}Failed to open document: `,
  [ErrorCode.UnknownError]: `${extensionPrefix}Unknown error.`,
};

export const errorCodeMessages: ErrorCodeMessage = {
  ...gitErrorCodeMessage,
  ...vcsErrorCodeMessage,
  ...svnErrorCodeMessage,
  ...configLanguageErrorCodeMessage,
  ...workspaceErrorCodeMessage,
  ...fileDirErrorCodeMessage,
  ...customProviderErrorCodeMessage,
  ...extensionErrorCodeMessage,
  ...otherErrorCodeMessage,
};
