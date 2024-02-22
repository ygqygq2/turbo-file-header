import vscode from 'vscode';
import { basename, dirname } from 'path';
import { relative } from 'path';
import dayjs, { Dayjs } from 'dayjs';
import { IFileheaderVariables } from '../typings/types';
import { vscProvider } from '../vsc-provider';
import { stat } from 'fs/promises';
import { ConfigSection, TEMPLATE_VARIABLE_KEYS } from '../constants';
import { difference } from 'lodash';
import { LanguageProvider } from '../language-providers';
import upath from 'upath';
import { Configuration } from '@/configuration/types';

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
  constructor() {}

  // TODO: slow code. need optimize performance
  public async build(
    config: vscode.WorkspaceConfiguration & Configuration,
    fileUri: vscode.Uri,
    provider: LanguageProvider,
    originVariable?: IFileheaderVariables,
  ): Promise<IFileheaderVariables> {
    const workspace = vscode.workspace.getWorkspaceFolder(fileUri);

    const { isCustomProvider, accessVariableFields } = provider;
    // disable fields should not works on custom provider.
    // because it is meaningless

    const disableFieldSet = new Set(
      !isCustomProvider
        ? difference(config.get<(keyof IFileheaderVariables)[]>(ConfigSection.disableFields, []))
        : difference(TEMPLATE_VARIABLE_KEYS, Array.from(accessVariableFields)),
    );

    const dateFormat = config.get(ConfigSection.dateFormat, 'YYYY-MM-DD HH:mm:ss');

    workspace?.uri.path;
    const fsPath = fileUri.fsPath;

    const fixedUserName = config.get<string | null>(ConfigSection.userName, null);
    const fixedUserEmail = config.get<string | null>(ConfigSection.userEmail, null);
    const currentTime = dayjs();
    if (!fixedUserEmail || !fixedUserName) {
      await vscProvider.validate(dirname(fsPath));
    }

    const deferredCompanyName = queryFieldsExceptDisable(disableFieldSet.has('companyName'), () => {
      return config.get<string>(ConfigSection.companyName)!;
    });

    const fileStat = await stat(fsPath);
    const isTracked = await vscProvider.isTracked(fsPath);

    // authorName and authorEmail depends on username and userEmail in VCS
    const deferredUserName = queryFieldsExceptDisable(
      disableFieldSet.has('userName') && disableFieldSet.has('authorName'),
      () => vscProvider.getUserName(dirname(fsPath)),
      fixedUserName!,
    );

    const deferredUserEmail = queryFieldsExceptDisable(
      disableFieldSet.has('userEmail') && disableFieldSet.has('authorEmail'),
      () => vscProvider.getUserEmail(dirname(fsPath)),
      fixedUserEmail!,
    );

    const deferredCtime = queryFieldsExceptDisable(
      disableFieldSet.has('ctime'),
      () => {
        return isTracked ? vscProvider.getCtime(fsPath) : dayjs(fileStat.ctime);
      },
      dayjs(fileStat.ctime),
    );
    const deferredMtime = queryFieldsExceptDisable(disableFieldSet.has('mtime'), () => currentTime);

    const [companyName, userName, userEmail, _ctime, mtime] = await Promise.all([
      deferredCompanyName,
      deferredUserName,
      deferredUserEmail,
      deferredCtime,
      deferredMtime,
    ] as const);

    const deferredAuthorName = queryFieldsExceptDisable(
      disableFieldSet.has('authorName'),
      () => {
        return isTracked ? vscProvider.getAuthorName(fsPath) : userName;
      },
      userName,
    );

    const deferredAuthorEmail = queryFieldsExceptDisable(
      disableFieldSet.has('authorEmail'),
      () => {
        return isTracked ? vscProvider.getAuthorEmail(fsPath) : userEmail;
      },
      userEmail,
    );

    const [authorName, authorEmail] = await Promise.all([
      deferredAuthorName,
      deferredAuthorEmail,
    ] as const);

    let ctime = _ctime;

    let originCtime: Dayjs | undefined = dayjs(originVariable?.ctime, dateFormat);
    if (!originCtime.isValid()) {
      originCtime = undefined;
    } else {
      if (originCtime.isBefore(ctime)) {
        ctime = originCtime;
      }
    }

    let projectName: string | undefined = undefined;
    let filePath: string | undefined = undefined;
    let dirPath: string | undefined = undefined;
    const fileName = basename(fileUri.path);

    if (workspace) {
      [projectName, filePath, dirPath] = await Promise.all([
        queryFieldsExceptDisable(disableFieldSet.has('projectName'), () =>
          upath.normalize(basename(workspace.uri.path)),
        ),
        queryFieldsExceptDisable(disableFieldSet.has('filePath'), () =>
          upath.normalize(relative(workspace.uri.path, fileUri.path)),
        ),
        await queryFieldsExceptDisable(
          disableFieldSet.has('dirPath'),
          () => upath.normalize(relative(workspace.uri.path, dirname(fileUri.path))) || '',
        ),
      ] as const);
    }

    return {
      ctime: ctime?.format(dateFormat),
      mtime: mtime?.format(dateFormat),
      authorName,
      authorEmail,
      userName: !disableFieldSet.has('userName') ? userName : undefined,
      userEmail: !disableFieldSet.has('userEmail') ? userEmail : undefined,
      companyName,

      projectName,
      filePath,
      dirPath,
      fileName,
    };
  }
}
