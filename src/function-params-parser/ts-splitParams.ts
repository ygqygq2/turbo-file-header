import { LanguageFunctionCommentSettings } from '@/typings/types';
import { ParamsInfo } from './types';

export function splitParams(
  paramsStr: string,
  languageSettings: LanguageFunctionCommentSettings,
): ParamsInfo {
  const { defaultParamType = 'any' } = languageSettings;
  let bracketCount = 0;
  let paramStartIndex = 0;
  const params: ParamsInfo = {};
  for (let i = 0; i < paramsStr.length; i++) {
    const char = paramsStr[i];
    if (char === '(' || char === '[' || char === '{' || char === '<') {
      bracketCount++;
    } else if (char === ')' || char === ']' || char === '}' || char === '>') {
      bracketCount--;
    } else if (char === ',' && bracketCount === 0) {
      const paramStr = paramsStr.slice(paramStartIndex, i);
      const colonIndex = paramStr.indexOf(':');
      const name = paramStr.slice(0, colonIndex !== -1 ? colonIndex : paramStr.length).trim();
      const type = colonIndex !== -1 ? paramStr.slice(colonIndex + 1).trim() : defaultParamType;
      params[name] = { type, description: '' };
      paramStartIndex = i + 1;
    }
  }
  const paramStr = paramsStr.slice(paramStartIndex);
  const colonIndex = paramStr.indexOf(':');
  const name = paramStr.slice(0, colonIndex !== -1 ? colonIndex : paramStr.length).trim();
  const type = colonIndex !== -1 ? paramStr.slice(colonIndex + 1).trim() : defaultParamType;
  params[name] = { type, description: '' };
  return params;
}
