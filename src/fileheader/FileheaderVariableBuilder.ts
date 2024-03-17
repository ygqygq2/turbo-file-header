import vscode from 'vscode';
import { basename, dirname, relative } from 'path';
import dayjs, { Dayjs } from 'dayjs';
import upath from 'upath';
import { IFileheaderVariables } from '../typings/types';
import { stat } from 'fs/promises';
import { ConfigSection, TEMPLATE_VARIABLE_KEYS } from '../constants';
import { difference } from 'lodash';
import { LanguageProvider } from '../language-providers';
import { Configuration } from '@/configuration/types';
import { initVCSProvider } from '@/init';
import { errorHandler } from '@/extension';
import { CustomError, ErrorCode } from '@/error';

/**
 * query template variable fields when it is enabled
 * @param disabled if true this function will return undefined immediately
 * @param queryAction get variable operation
 * @param fallbackVal fallback value, if it is falsy, it will throw the origin error
 * @returns variable value or fallback value
 */
async function queryFieldsExceptDisable<T>(
  disabled: boolean,
  queryAction: () => Promise<T> | T,
  fallbackVal?: T,
): Promise<T | undefined> {
  if (disabled) {
    return undefined;
  }
  try {
    return await queryAction();
  } catch (e) {
    if (fallbackVal) {
      return fallbackVal;
    }
    throw e;
  }
}

export class FileheaderVariableBuilder {
  public async build(
    config: vscode.WorkspaceConfiguration & Configuration,
    fileUri: vscode.Uri,
    provider: LanguageProvider,
    originVariable?: IFileheaderVariables,
  ): Promise<IFileheaderVariables> {
    const { isCustomProvider, accessVariableFields } = provider;
    console.log(
      '🚀 ~ file: FileheaderVariableBuilder.ts:51 ~ accessVariableFields:',
      accessVariableFields,
    );
    const workspace = vscode.workspace.getWorkspaceFolder(fileUri);
    const vcsProvider = await initVCSProvider();

    // 获取文件头需要的变量，用 {{}} 包裹
    const { fileheader } = config;
    const variables: string[] = [];
    const regex = /{{(.*?)}}/g;

    fileheader.forEach((item) => {
      const matches = item.value.match(regex);
      if (matches) {
        matches.forEach((match) => {
          // 去除两边的 {{ 和 }}，只保留变量名
          const variable = match.slice(2, -2);
          variables.push(variable);
        });
      }
    });

    console.log(variables);

    const noNeedFieldSet = new Set(
      !isCustomProvider
        ? difference(config.get<(keyof IFileheaderVariables)[]>(ConfigSection.disableFields, []))
        : difference(TEMPLATE_VARIABLE_KEYS, Array.from(accessVariableFields)),
    );

    const dateFormat = config.get(ConfigSection.dateFormat, 'YYYY-MM-DD HH:mm:ss');
    const fsPath = fileUri.fsPath;

    const fixedUserName = config.get<string | null>(ConfigSection.userName, null);
    const fixedUserEmail = config.get<string | null>(ConfigSection.userEmail, null);
    if (!fixedUserEmail || !fixedUserName) {
      try {
        await vcsProvider.validate(dirname(fsPath));
      } catch (error) {
        errorHandler.handle(new CustomError(ErrorCode.VCSInvalid, error));
      }
    }

    const fileStat = await stat(fsPath);
    const isTracked = await vcsProvider.isTracked(fsPath);

    // authorName and authorEmail depends on username and userEmail in VCS
    const deferredUserName = queryFieldsExceptDisable(
      noNeedFieldSet.has('userName') && noNeedFieldSet.has('authorName'),
      () => vcsProvider.getUserName(dirname(fsPath)),
      fixedUserName!,
    );

    const deferredUserEmail = queryFieldsExceptDisable(
      noNeedFieldSet.has('userEmail') && noNeedFieldSet.has('authorEmail'),
      () => vcsProvider.getUserEmail(dirname(fsPath)),
      fixedUserEmail!,
    );

    const deferredBirthtime = queryFieldsExceptDisable(
      noNeedFieldSet.has('birthtime'),
      () => (isTracked ? vcsProvider.getBirthtime(fsPath) : dayjs(fileStat.birthtime)),
      dayjs(fileStat.birthtime),
    );
    const deferredMtime = queryFieldsExceptDisable(noNeedFieldSet.has('mtime'), () =>
      dayjs(fileStat.mtime),
    );

    const deferredCompanyName = queryFieldsExceptDisable(
      noNeedFieldSet.has('companyName'),
      () => config.get<string>(ConfigSection.companyName)!,
    );

    const [companyName, userName, userEmail, birthtime, mtime] = await Promise.all([
      deferredCompanyName,
      deferredUserName,
      deferredUserEmail,
      deferredBirthtime,
      deferredMtime,
    ] as const);

    const [authorName, authorEmail] = await Promise.all([
      queryFieldsExceptDisable(
        noNeedFieldSet.has('authorName'),
        () => (isTracked ? vcsProvider.getAuthorName(fsPath) : userName),
        userName,
      ),
      queryFieldsExceptDisable(
        noNeedFieldSet.has('authorEmail'),
        () => (isTracked ? vcsProvider.getAuthorEmail(fsPath) : userEmail),
        userEmail,
      ),
    ] as const);

    let tmpBirthtime = birthtime;

    let originBirthtime: Dayjs | undefined = dayjs(originVariable?.birthtime, dateFormat);
    if (!originBirthtime.isValid()) {
      originBirthtime = undefined;
    } else {
      if (originBirthtime.isBefore(birthtime)) {
        tmpBirthtime = originBirthtime;
      }
    }

    let projectName: string | undefined;
    let filePath: string | undefined;
    let dirPath: string | undefined;
    const fileName = basename(fileUri.path);

    if (workspace) {
      [projectName, filePath, dirPath] = await Promise.all([
        queryFieldsExceptDisable(noNeedFieldSet.has('projectName'), () =>
          upath.normalize(basename(workspace.uri.path)),
        ),
        queryFieldsExceptDisable(noNeedFieldSet.has('filePath'), () =>
          upath.normalize(relative(workspace.uri.path, fileUri.path)),
        ),
        queryFieldsExceptDisable(
          noNeedFieldSet.has('dirPath'),
          () => upath.normalize(relative(workspace.uri.path, dirname(fileUri.path))) || '',
        ),
      ] as const);
    }

    return {
      birthtime: tmpBirthtime?.format(dateFormat),
      mtime: mtime?.format(dateFormat),
      authorName,
      authorEmail,
      userName: !noNeedFieldSet.has('userName') ? userName : undefined,
      userEmail: !noNeedFieldSet.has('userEmail') ? userEmail : undefined,
      companyName: companyName ? companyName : userName ? userName : undefined,

      projectName,
      filePath,
      dirPath,
      fileName,
    };
  }
}
