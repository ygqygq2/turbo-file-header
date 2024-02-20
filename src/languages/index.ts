import { initDefinitions, updateDefinitions, getAvailableCommentRules } from './languages';
import { onDidChange, registerEvent as activate, unregisterEvent as deactivate } from './event';

export { AvailableCommentRules, Languages } from './languages';

const languages = {
  initDefinitions,
  updateDefinitions,
  getAvailableCommentRules,
  onDidChange,
  activate,
  deactivate,
};

export default languages;
