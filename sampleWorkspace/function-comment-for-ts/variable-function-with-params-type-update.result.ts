/**
 * @description 
 * @return default {string} 
 * @param a {string} 
 * @param b {{key: string}} 
 */
const func = function(a: string, b: {key: string}): string {
  console.log(a + b);
  return a + b;
}
