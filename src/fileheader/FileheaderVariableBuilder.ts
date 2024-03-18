import vscode from 'vscode';
import { basename, dirname, relative } from 'path';
import dayjs, { Dayjs } from 'dayjs';
import upath from 'upath';
import { Config, HeaderLine } from '../typings/types';
import { stat } from 'fs/promises';
import { ConfigSection, WILDCARD_ACCESS_VARIABLES } from '../constants';
import { initVCSProvider } from '@/init';
import { ConfigManager } from '@/configuration/ConfigManager';
import { errorHandler } from '@/extension';
import { CustomError, ErrorCode } from '@/error';
import { workspace } from 'vscode';
import {LanguageProvider} from '@/language-providers';


export class FileheaderVariableBuilder {
  private config: Config;
  private variableBuilders: { [key: string]: () => Promise<string | undefined> };
  private configManager: ConfigManager;
  private workspace;
  private vcsProvider;
  private variableRegex = /{{(.*?)}}/g;
  private fileUri;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.config = configManager.getConfiguration();

    this.variableBuilders = {
      ...Object.keys(WILDCARD_ACCESS_VARIABLES).reduce((obj, key) => {
        const methodName = `build${key.charAt(0).toUpperCase() + key.slice(1)}`;
        if (typeof this[methodName] === 'function') {
          obj[key] = this[methodName].bind(this);
        }
        return obj;
      }, {}),
    };
  }

  private build = async (fileUri: vscode.Uri, provider: LanguageProvider, ) => {
    const { isCustomProvider, accessVariableFields } = provider;
    const workspace = vscode.workspace.getWorkspaceFolder(fileUri);
    this.workspace = workspace;
    const vcsProvider = await initVCSProvider();
    try {
      await vcsProvider.validate(dirname(fsPath));
    } catch (error) {
      errorHandler.handle(new CustomError(ErrorCode.VCSInvalid, error));
    }
    this.vcsProvider = vcsProvider;

    // 获取文件头配置中需要的变量，用 {{}} 包裹，可能含自定义变量
    const { fileheader, disableLabels } = this.config;
    const newFileheader: HeaderLine[] = [];

    fileheader.forEach((item: HeaderLine) => {
      if (!disableLabels.includes(item.label)) {
        const matches = item.value.match(this.variableRegex);
        // 含有引用的变量名
        if (matches) {
          matches.forEach(async (match) => {
            // 去除两边的 {{ 和 }}，只保留变量名
            const variable = match.slice(2, -2);
            // 把 variable 转成字符串
            const builder = this.variableBuilders[variable];
            if (builder) {
              // 内置变量
              const result = (await builder()) || '';
              newFileheader.push({
                label: item.label,
                value: result,
                ...(item.wholeLine !== undefined && { wholeLine: item.wholeLine }),
              });
            } else {
              // 自定义变量
              const result = (await this.buildCustomVariable(variable)) || '';
              newFileheader.push({
                label: item.label,
                value: result,
                ...(item.wholeLine !== undefined && { wholeLine: item.wholeLine }),
              });
            }
          });
        } else {
          newFileheader.push(item);
        }
      }
    });

    return newFileheader;
  };

  private buildCustomVariable = async (variable: string) => {
    const { customVariables } = this.config;
    const customVariable = customVariables.find((item) => item.name === variable);
    let { value = '' } = customVariable || {};
    const matches = value.match(this.variableRegex);

    // 含有引用的变量名
    if (matches) {
      for (const match of matches) {
        // 去除两边的 {{ 和 }}，只保留变量名
        const variableName = match.slice(2, -2);
        // 把 variable 转成字符串
        const builder = this.variableBuilders[variableName];
        if (builder) {
          // 内置变量
          const result = (await builder()) || '';
          value = value.replace(match, result);
        } else {
          // 示知变量
          errorHandler.handle(new CustomError(ErrorCode.UnknownVariable));
        }
      }
    }
    return value;
  };

  private buildAuthorInfo = async () => {
    const userName = await vcsProvider.getUserName(dirname(fsPath));
    const userEmail = await vcsProvider.getUserEmail(dirname(fsPath));
    return {
      userName,
      userEmail,
    };
  };

  private buildBirthtime = async () => {
    const fsPath = this.fileUri.fsPath;
     const fileStat = await stat(fsPath);
        const isTracked = await this.vcsProvider.isTracked(fsPath);
    const dateFormat = this.config.get(ConfigSection.dateFormat, 'YYYY-MM-DD HH:mm:ss');
    const birthtime = isTracked ? this.vcsProvider.getBirthtime(fsPath) : dayjs(fileStat.birthtime);
    let tmpBirthtime = birthtime;

    let originBirthtime: Dayjs | undefined = dayjs(originVariable?.birthtime, dateFormat);
    if (!originBirthtime.isValid()) {
      originBirthtime = undefined;
    } else {
      if (originBirthtime.isBefore(birthtime)) {
        tmpBirthtime = originBirthtime;
      }
    }

    return birthtime;
  };

  private buildMtime = () => {
    return dayjs(fileStat.mtime);
  };

  private buildAuthorName = () => {};
  private buildAuthorEmail = () => {};

  private buildUserName = async () => {
    return this.config.get<string | null>(ConfigSection.userName, null);
  };

  private buildUserEmail = async () => {
    const fixedUserEmail = this.config.get<string | null>(ConfigSection.userEmail, null);



   

  };

  private buildCompanyName = () => {
    return this.config.get<string>(ConfigSection.companyName)!;
  };

  private buildProjectName = () => {
  const projectName = upath.normalize(basename(workspace.uri.path));
  return projectName;
};

  private buildFilePath = () => {
  const filePath = upath.normalize(relative(workspace.uri.path, fileUri.path));
  return filePath;
  };
  private buildDirPath = () => {
  const dirPath = upath.normalize(relative(workspace.uri.path, dirname(fileUri.path))) || '';
  return dirPath;
};

  private buildFileName = () => {
    return basename(this.fileUri.path);
  };

  private buildNow = () => {};
}
