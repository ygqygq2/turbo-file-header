import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
// import * as vscode from 'vscode';
import { CUSTOM_CONFIG_FILE_NAME } from '@/constants';
import { ConfigYaml } from '@/typings/types';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';

export class ConfigReader {
  private static instance: ConfigReader;
  private configYaml: ConfigYaml;

  private constructor() {
    this.configYaml = this.getConfigYaml() as unknown as ConfigYaml;
  }

  public static getInstance(): ConfigReader {
    return ConfigReader?.instance || new ConfigReader();
  }

  public getConfigYaml = async (): Promise<ConfigYaml> => {
    const defaultConfig: ConfigYaml = {
      providers: [],
      findFilesConfig: {
        include: '**/tmp/*.{ts,js}',
        exclude: '**/{node_modules,dist}/**',
      },
    };

    const activeWorkspace = await getActiveDocumentWorkspace();
    if (!activeWorkspace) {
      return defaultConfig;
    }

    const configPath = path.join(activeWorkspace.uri.fsPath, '.vscode', CUSTOM_CONFIG_FILE_NAME);
    if (!fs.existsSync(configPath)) {
      return defaultConfig;
    }

    // 读取 yaml 配置
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config: ConfigYaml = YAML.parse(configContent);
    return { ...defaultConfig, ...config };
  };

  public getAllLanguages = (): string[] => {
    return this.configYaml?.providers.flatMap((provider) => provider.languages) || [];
  };
}