import { LanguageFunctionCommentSettings } from '@/typings/types';

import { ParamsInfo } from './types';

export function splitParams(
  paramsStr: string,
  languageSettings: LanguageFunctionCommentSettings,
): ParamsInfo {
  const { defaultParamType = 'mixed', defaultReturnName = 'default' } = languageSettings;
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

      const paramPattern = /^(\.\.\.)?(\w*\s*)?(\$\w+)\s*(=\s*(.*))?$/;
      const match = paramPattern.exec(paramStr);
      if (match) {
        const name =
          match[3] ||
          (defaultCount > 0 ? `${defaultReturnName}${defaultCount++}` : defaultReturnName);
        const type = match[2]?.trim() || defaultParamType;
        const optional = match[1] || match[4] ? { optional: true } : {};
        const defaultValue = match[5] ? { defaultValue: match[5] } : {};

        params[name] = { type, description: '', ...optional, ...defaultValue };
      }
      paramStartIndex = i + 1;
    }
  }

  return params;
}
