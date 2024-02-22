type ErrorCodeMessage = {
  [key in ErrorCode]: string;
};

export enum ErrorCode {
  MissingUserNameEmail = 101,
  NoVCSProvider = 102,
  VCSProviderCreateFail = 103,
  GitNotInit = 104,
  GitGetUserNameFail = 105,
  GitGetUserEmailFail = 106,
  ShouldSetUserName = 107,
  ShouldSetUserEmail = 108,
  GitGetCtimeFail = 109,
  CustomFileheaderConfigFail = 110,
  VariableBuilderFail = 111,
  WorkspaceFolderNotFound = 112,
  LanguageNotSupport = 113,
  GetConfigurationFail = 114,
  LanguageProviderNotFound = 115,
  GenerateTemplateConfigFail = 116,
  NeedExtensionContext = 117,
  CreateDirFail = 118,
  CreateFileFail = 119,
}

const extensionPrefix = '';

export const errorCodeMessages: ErrorCodeMessage = {
  [ErrorCode.MissingUserNameEmail]: `${extensionPrefix}Missing user name and email.`,
  [ErrorCode.NoVCSProvider]: `${extensionPrefix}No VCS provider available.`,
  [ErrorCode.VCSProviderCreateFail]: `${extensionPrefix}Failed to create VCS provider.`,
  [ErrorCode.GitNotInit]: `${extensionPrefix}Git repository not initialized, please init git via 'git init' first.`,
  [ErrorCode.GitGetUserNameFail]: `${extensionPrefix}Git get commit user name fail.`,
  [ErrorCode.GitGetUserEmailFail]: `${extensionPrefix}Git get commit user email fail.`,
  [ErrorCode.ShouldSetUserName]: `${extensionPrefix}You should set user.name in git config first. Set your username via 'git config user.name "your username"'.`,
  [ErrorCode.ShouldSetUserEmail]: `${extensionPrefix}You should set user.email in git config first. Set your email via 'git config user.email "your email"'.`,
  [ErrorCode.GitGetCtimeFail]: `${extensionPrefix}Failed to get commit time.`,
  [ErrorCode.CustomFileheaderConfigFail]: `${extensionPrefix}Failed to generate custom fileheader config.`,
  [ErrorCode.VariableBuilderFail]: `${extensionPrefix}${extensionPrefix}Failed to build variable.`,
  [ErrorCode.WorkspaceFolderNotFound]: `${extensionPrefix}Your workspace is not contain any folder.`,
  [ErrorCode.LanguageNotSupport]: `${extensionPrefix}This language is not supported.`,
  [ErrorCode.GetConfigurationFail]: `${extensionPrefix}Failed to get configuration.`,
  [ErrorCode.LanguageProviderNotFound]: `${extensionPrefix}Language provider not found.`,
  [ErrorCode.GenerateTemplateConfigFail]: `${extensionPrefix}Failed to generate template config.`,
  [ErrorCode.NeedExtensionContext]: `${extensionPrefix}Need extension context.`,
  [ErrorCode.CreateDirFail]: `${extensionPrefix}Failed to create directory: `,
  [ErrorCode.CreateFileFail]: `${extensionPrefix}Failed to create file: `,
};
