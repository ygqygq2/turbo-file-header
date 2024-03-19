import vscode, { WorkspaceFolder } from 'vscode';
import { basename, dirname, relative } from 'path';
import dayjs from 'dayjs';
import upath from 'upath';
import { Config, HeaderLine, IFileheaderVariables } from '../typings/types';
import { stat } from 'fs/promises';
import { WILDCARD_ACCESS_VARIABLES } from '../constants';
import { initVCSProvider } from '@/init';
import { ConfigManager } from '@/configuration/ConfigManager';
import { errorHandler } from '@/extension';
import { CustomError, ErrorCode } from '@/error';
import { LanguageProvider } from '@/language-providers';
import { BaseVCSProvider } from '@/vcs-provider/BaseVCSProvider';

export class FileheaderVariableBuilder {
  private config: Config;
  private variableBuilders: { [key: string]: () => Promise<string | undefined> };
  private workspace?: WorkspaceFolder;
  private vcsProvider?: BaseVCSProvider;
  private variableRegex = /{{(.*?)}}/g;
  private fileUri?: vscode.Uri;
  private dateFormat: string;

  constructor(private configManager: ConfigManager) {
    this.config = configManager.getConfiguration();
    this.dateFormat = this.config.dateFormat || 'YYYY-MM-DD HH:mm:ss';

    this.variableBuilders = {
      ...Object.keys(WILDCARD_ACCESS_VARIABLES).reduce(
        (obj, key) => {
          const methodName =
            `build${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof FileheaderVariableBuilder;
          if (typeof this[methodName] === 'function') {
            obj[key] = (this[methodName] as unknown as () => Promise<string | undefined>).bind(this);
          }
          return obj;
        },
        {} as { [key: string]: () => Promise<string | undefined> },
      ),
    };
  }

  public async build(
    fileUri: vscode.Uri,
    provider: LanguageProvider,
    variables: IFileheaderVariables,
  ): Promise<HeaderLine[]> {
    console.log('🚀 ~ file: FileheaderVariableBuilder.ts:48 ~ variables:', variables);
    const { isCustomProvider, accessVariableFields } = provider;
    console.log(
    '🚀 ~ file: FileheaderVariableBuilder.ts:51 ~ isCustomProvider, accessVariableFields:',
    isCustomProvider,
    accessVariableFields,
    );
    this.fileUri = fileUri;
    const fsPath = fileUri.fsPath;
    this.workspace = vscode.workspace.getWorkspaceFolder(fileUri);
    try {
      this.vcsProvider = await initVCSProvider();
      if (!this.vcsProvider) {
        errorHandler.throw(new CustomError(ErrorCode.VCSInvalid));
      }
      await this.vcsProvider.validate(dirname(fsPath));
    } catch (error) {
      errorHandler.throw(new CustomError(ErrorCode.VCSInvalid, error));
    }

    const { fileheader, disableLabels } = this.config;
    const newFileheader: HeaderLine[] = [];

    for (const item of fileheader) {
      if (!disableLabels.includes(item.label)) {
        const matches = item.value.match(this.variableRegex);
        if (matches) {
          for (const match of matches) {
            // Remove the {{ and }} on both sides, leaving only the variable name
            const variable = match.slice(2, -2);
            const builder = this.variableBuilders[variable];
            const result = builder
              ? (await builder()) || ''
              : (await this.buildCustomVariable(variable)) || '';
            newFileheader.push({
              label: item.label,
              value: result,
              ...(item.wholeLine !== undefined && { wholeLine: item.wholeLine }),
            });
          }
        } else {
          newFileheader.push(item);
        }
      }
    }

    return newFileheader;
  }

  private async buildCustomVariable(variable: string): Promise<string> {
    const { customVariables } = this.config;
    const customVariable = customVariables.find((item) => item.name === variable);
    let { value = '' } = customVariable || {};
    const matches = value.match(this.variableRegex);

    if (matches) {
      for (const match of matches) {
        // Remove the {{ and }} on both sides, leaving only the variable name
        const variableName = match.slice(2, -2);
        const builder = this.variableBuilders[variableName];
        if (builder) {
          const result = (await builder()) || '';
          value = value.replace(match, result);
        } else {
          errorHandler.handle(new CustomError(ErrorCode.UnknownVariable, variableName));
        }
      }
    }
    return value;
  }

  private buildAuthorInfo = async () => {
    const fsPath = this.fileUri!.fsPath;
    const userName = this.vcsProvider ? await this.vcsProvider.getUserName(dirname(fsPath)) : '';
    const userEmail = this.vcsProvider ? await this.vcsProvider.getUserEmail(dirname(fsPath)) : '';
    return {
      userName,
      userEmail,
    };
  };

  private buildBirthtime = async () => {
    const fsPath = this.fileUri!.fsPath;
    const fileStat = await stat(fsPath);
    const isTracked = await this.vcsProvider!.isTracked(fsPath);
    const birthtime = isTracked
      ? this.vcsProvider?.getBirthtime(fsPath) ?? dayjs(fileStat.birthtime, this.dateFormat)
      : dayjs(fileStat.birthtime, this.dateFormat);
    // let tmpBirthtime = birthtime;

    // let originBirthtime: Dayjs | undefined = dayjs(originVariable?.birthtime, dateFormat);
    // if (!originBirthtime.isValid()) {
    //   originBirthtime = undefined;
    // } else {
    //   if (originBirthtime.isBefore(birthtime)) {
    //     tmpBirthtime = originBirthtime;
    //   }
    // }

    return birthtime;
  };

  private async buildMtime() {
    const fsPath = this.fileUri!.fsPath;
    const fileStat = await stat(fsPath);
    return dayjs(fileStat.mtime, this.dateFormat);
  }

  private async buildUserName() {
    return this.config?.userName || '';
  }

  private async buildUserEmail() {
    return this.config?.userEmail || '';
  }

  private buildCompanyName() {
    return this.config?.companyName || this.config?.userName || '';
  }

  private buildProjectName() {
    const projectName = upath.normalize(basename(this.workspace!.uri.path));
    return projectName;
  }

  private buildFilePath() {
    const filePath = upath.normalize(relative(this.workspace!.uri.path, this.fileUri!.path));
    return filePath;
  }

  private buildDirPath() {
    const dirPath =
      upath.normalize(relative(this.workspace!.uri.path, dirname(this.fileUri!.path))) || '';
    return dirPath;
  }

  private buildFileName() {
    return basename(this.fileUri!.path);
  }
}
