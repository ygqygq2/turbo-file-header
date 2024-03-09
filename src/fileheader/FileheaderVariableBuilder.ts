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
    const workspace = vscode.workspace.getWorkspaceFolder(fileUri);
    const vcsProvider = await initVCSProvider();

    const { isCustomProvider, accessVariableFields } = provider;
    const disableFieldSet = new Set(
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
      disableFieldSet.has('userName') && disableFieldSet.has('authorName'),
      () => vcsProvider.getUserName(dirname(fsPath)),
      fixedUserName!,
    );

    const deferredUserEmail = queryFieldsExceptDisable(
      disableFieldSet.has('userEmail') && disableFieldSet.has('authorEmail'),
      () => vcsProvider.getUserEmail(dirname(fsPath)),
      fixedUserEmail!,
    );

    const deferredBirthtime = queryFieldsExceptDisable(
      disableFieldSet.has('birthtime'),
      () => (isTracked ? vcsProvider.getBirthtime(fsPath) : dayjs(fileStat.birthtime)),
      dayjs(fileStat.birthtime),
    );
    const deferredMtime = queryFieldsExceptDisable(disableFieldSet.has('mtime'), () =>
      dayjs(fileStat.mtime),
    );

    const deferredCompanyName = queryFieldsExceptDisable(
      disableFieldSet.has('companyName'),
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
        disableFieldSet.has('authorName'),
        () => (isTracked ? vcsProvider.getAuthorName(fsPath) : userName),
        userName,
      ),
      queryFieldsExceptDisable(
        disableFieldSet.has('authorEmail'),
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
        queryFieldsExceptDisable(disableFieldSet.has('projectName'), () =>
          upath.normalize(basename(workspace.uri.path)),
        ),
        queryFieldsExceptDisable(disableFieldSet.has('filePath'), () =>
          upath.normalize(relative(workspace.uri.path, fileUri.path)),
        ),
        queryFieldsExceptDisable(
          disableFieldSet.has('dirPath'),
          () => upath.normalize(relative(workspace.uri.path, dirname(fileUri.path))) || '',
        ),
      ] as const);
    }

    return {
      birthtime: tmpBirthtime?.format(dateFormat),
      mtime: mtime?.format(dateFormat),
      authorName,
      authorEmail,
      userName: !disableFieldSet.has('userName') ? userName : undefined,
      userEmail: !disableFieldSet.has('userEmail') ? userEmail : undefined,
      companyName: companyName ? companyName : userName ? userName : undefined,

      projectName,
      filePath,
      dirPath,
      fileName,
    };
  }
}
