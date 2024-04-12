import * as vscode from 'vscode';

import { CustomError, ErrorCode } from '@/error';
import { logger } from '@/extension';
import { ConfigYaml } from '@/typings/types';
import { escapeRegexString } from '@/utils/str';

import { CONFIG_TAG, ConfigSection } from '../constants';
import { Config, ConfigurationFlatten, Tag, TagFlatten } from '../typings/types';
import { ConfigReader } from './ConfigReader';

export class ConfigManager {
  private static instance: ConfigManager;
  private configReader: ConfigReader;
  private configuration: Config;
  private configFlatten: ConfigurationFlatten;
  private configYaml: ConfigYaml | undefined;

  private constructor(configReader: ConfigReader) {
    this.configReader = configReader;
    this.configuration = this.getConfiguration();
    this.configFlatten = this.getConfigurationFlatten();
  }

  // 用于执行实例初始化的异步方法
  private async initialize() {
    this.configYaml = await this.configReader.getConfigYaml();
  }

  // 静态异步初始化方法
  public static async createInstance(configReader: ConfigReader): Promise<ConfigManager> {
    const manager = new ConfigManager(configReader);
    await manager.initialize();
    return manager;
  }

  public static getInstance(configReader: ConfigReader): ConfigManager {
    return ConfigManager?.instance || new ConfigManager(configReader);
  }

  private get _config() {
    return vscode.workspace.getConfiguration();
  }

  get<T>(section: ConfigSection): T | undefined {
    return this._config.get<T>(section);
  }

  async set<T>(section: ConfigSection, value: T) {
    await this._config.update(section, value);
  }

  public getConfiguration(forceRefresh = false): Config {
    if (this.configuration && !forceRefresh) {
      return this.configuration;
    }

    const config = vscode.workspace.getConfiguration(CONFIG_TAG) as Config;
    if (!config) {
      logger.handleError(new CustomError(ErrorCode.GetConfigurationFail));
    }
    this.configuration = config;
    return this.configuration;
  }

  public getConfigurationFlatten(forceRefresh = false): ConfigurationFlatten {
    if (this.configFlatten && !forceRefresh) {
      return this.configFlatten;
    }
    const orig = this.getConfiguration();

    this.configFlatten = {
      ...orig,
      tags: this.flattenTags(orig?.tags || []),
      tagsLight: this.flattenTags(orig?.tagsLight || []),
      tagsDark: this.flattenTags(orig?.tagsDark || []),
    };
    return this.configFlatten;
  }

  private flattenTags(tags: Tag[]): TagFlatten[] {
    const flatTags: TagFlatten[] = [];
    for (const tag of tags) {
      if (!Array.isArray(tag.tag)) {
        flatTags.push({ ...tag, tagEscaped: escapeRegexString(tag.tag) } as TagFlatten);
        continue;
      }
      for (const tagName of tag.tag) {
        flatTags.push({
          ...tag,
          tag: tagName,
          tagEscaped: escapeRegexString(tagName),
        });
      }
    }
    return flatTags;
  }

  public async getConfigurationFromCustomConfig(forceRefresh = false) {
    if (!this.configYaml || forceRefresh) {
      this.configYaml = await this.configReader.getConfigYaml();
    }
    return this.configYaml;
  }
}
