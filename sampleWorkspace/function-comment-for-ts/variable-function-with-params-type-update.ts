/**
 * @description test
 * @return default {string} returnValue
 * @param a {string} stringA
 * @param b {string} stringB
 */
const func = function(a: string, b: {key: string}): string {
  console.log(a + b);
  return a + b;
}
