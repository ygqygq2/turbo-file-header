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
    }

    if (
      (char === ',' && bracketCount === 0) ||
      (i === paramsStr.length - 1 && bracketCount === 0)
    ) {
      const paramStr = paramsStr
        .slice(paramStartIndex, i === paramsStr.length - 1 ? i + 1 : i)
        .trim();
      const normalParamPattern = /^(\w+)\s*:\s*([^,\s]*)$/;
      const defaultParamPattern = /^(\w+)(?:\s*:\s*(.*?))?\s*=\s*([^,\s]*)$/;
      const optionalParamPattern = /^(\w+)\?\s*:\s*([^,\s]*)$/;
      const noTypeParamPattern = /^(\w+)$/;
      let match;
      if ((match = normalParamPattern.exec(paramStr))) {
        const type = match[2].trim() || defaultParamType;
        params[match[1]] = { type, description: '' };
      } else if ((match = defaultParamPattern.exec(paramStr))) {
        const type = match[2] ? match[2].trim() : defaultParamType;
        params[match[1]] = { type, defaultValue: match[3].trim(), description: '' };
      } else if ((match = optionalParamPattern.exec(paramStr))) {
        const type = match[2].trim() || defaultParamType;
        params[match[1]] = { type, optional: true, description: '' };
      } else if ((match = noTypeParamPattern.exec(paramStr))) {
        params[match[1]] = { type: defaultParamType, description: '' };
      }
      paramStartIndex = i + 1;
    }
  }
  return params;
}
