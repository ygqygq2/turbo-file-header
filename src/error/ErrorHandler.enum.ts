type ErrorCodeMessage = {
  [key in ErrorCode]: string;
};

export enum ErrorCode {
  MissingUserNameEmail = 101,
  NoVCSProvider = 102,
  VCSProviderCreateFail = 103,
  GitNotInit = 104,
  GetUserNameFail = 105,
  ShouldSetUserName = 106,
}

export const errorCodeMessages: ErrorCodeMessage = {
  [ErrorCode.MissingUserNameEmail]: 'Missing user name and email',
  [ErrorCode.NoVCSProvider]: 'No VCS provider available',
  [ErrorCode.VCSProviderCreateFail]: 'Failed to create VCS provider',
  [ErrorCode.GitNotInit]: 'Git repository not initialized, please init git via `git init` first.',
  [ErrorCode.GetUserNameFail]: 'Get git user name fail',
  [ErrorCode.ShouldSetUserName]: `You should set user.name in git config first. Set your username via 'git config user.name "your username"'`,
};
