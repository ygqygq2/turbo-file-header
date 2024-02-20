import vscode from 'vscode';
import { ConfigSection } from '../constants';

export class ExtensionConfigManager {
  private get _config() {
    return vscode.workspace.getConfiguration();
  }

  get<T>(section: ConfigSection): T | undefined {
    return this._config.get<T>(section);
  }

  async set<T>(section: ConfigSection, value: T) {
    await this._config.update(section, value);
  }
}
