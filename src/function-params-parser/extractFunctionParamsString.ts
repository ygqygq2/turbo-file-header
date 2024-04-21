export function extractFunctionParamsString(functionDefinition: string): string {
  let bracketCount = 0;
  let paramsStartIndex = 0;
  let paramsEndIndex = 0;

  for (let i = 0; i < functionDefinition.length; i++) {
    const char = functionDefinition[i];
    if (char === '(') {
      if (bracketCount === 0) {
        paramsStartIndex = i + 1;
      }
      bracketCount++;
    } else if (char === ')') {
      bracketCount--;
      if (bracketCount === 0) {
        paramsEndIndex = i;
        break;
      }
    }
  }

  return functionDefinition.slice(paramsStartIndex, paramsEndIndex);
}
