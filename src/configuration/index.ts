import { getConfigurationFlatten } from './configuration';
import { onDidChange, registerEvent as activate, unregisterEvent as deactivate } from './event';

const configuration = {
  getConfigurationFlatten,
  onDidChange,
  activate,
  deactivate,
};

export default configuration;
