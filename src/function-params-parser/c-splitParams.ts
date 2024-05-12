import { LanguageFunctionCommentSettings } from '@/typings/types';

import { ParamsInfo } from './types';

export function splitParams(
  paramsStr: string,
  languageSettings: LanguageFunctionCommentSettings,
): ParamsInfo {
  const { defaultParamType = 'any', defaultReturnName = 'default' } = languageSettings;
  let bracketCount = 0;
  let paramStartIndex = 0;
  let defaultCount = 0;
  const params: ParamsInfo = {};
  for (let i = 0; i < paramsStr?.length; i++) {
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

      const lastNonSpaceIndex = paramStr.search(/\S\s*$/);
      let name, type;
      if (lastNonSpaceIndex !== -1) {
        name = paramStr.slice(lastNonSpaceIndex).trim();
        type = paramStr.slice(0, lastNonSpaceIndex).trim() || defaultParamType;
      } else {
        name = defaultCount > 0 ? `${defaultReturnName}${defaultCount++}` : defaultReturnName;
        type = paramStr.trim() || defaultParamType;
      }
      params[name] = { type, description: '' };
      paramStartIndex = i + 1;
    }
  }
  return params;
}
