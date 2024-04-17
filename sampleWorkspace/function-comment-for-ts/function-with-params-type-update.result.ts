/**
 * @description test
 * @return default {string} returnValue
 * @param a {string} stringA
 * @param b {{key: string}} stringB
 */
export function a(a: string, b: {key: string}): string {
  console.log(a + b);
  return a + b;
};
