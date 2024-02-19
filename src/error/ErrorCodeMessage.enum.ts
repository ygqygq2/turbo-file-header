type ErrorCodeMessage = {
  [key in ErrorCode]: string;
};

export enum ErrorCode {
  MissingUserNameEmail = 101,
  NoVCSProvider = 102,
  VCSProviderCreateFail = 103,
  GitNotInit = 104,
  ShouldSetUserName = 105,
  ShouldSetUserEmail = 106,
  GitGetCtimeFail = 107,
  CustomFileheaderConfigFail = 108,
  VariableBuilderFail = 109,
  WorkspaceFolderNotFound = 110,
  LanguageNotSupport = 111,
}

const extensionPrefix = 'Turbo File Header: ';

export const errorCodeMessages: ErrorCodeMessage = {
  [ErrorCode.MissingUserNameEmail]: `${extensionPrefix}Missing user name and email.`,
  [ErrorCode.NoVCSProvider]: `${extensionPrefix}No VCS provider available.`,
  [ErrorCode.VCSProviderCreateFail]: `${extensionPrefix}Failed to create VCS provider.`,
  [ErrorCode.GitNotInit]: `${extensionPrefix}Git repository not initialized, please init git via 'git init' first.`,
  [ErrorCode.ShouldSetUserName]: `${extensionPrefix}You should set user.name in git config first. Set your username via 'git config user.name "your username"'.`,
  [ErrorCode.ShouldSetUserEmail]: `${extensionPrefix}You should set user.email in git config first. Set your email via 'git config user.email "your email"'.`,
  [ErrorCode.GitGetCtimeFail]: `${extensionPrefix}Failed to get commit time.`,
  [ErrorCode.CustomFileheaderConfigFail]: `${extensionPrefix}Failed to generate custom fileheader config.`,
  [ErrorCode.VariableBuilderFail]: `${extensionPrefix}${extensionPrefix}Failed to build variable.`,
  [ErrorCode.WorkspaceFolderNotFound]: `${extensionPrefix}Your workspace is not contain any folder.`,
  [ErrorCode.LanguageNotSupport]: `${extensionPrefix}This language is not supported.`,
};
