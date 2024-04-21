/**
 * @description 
 * @return default {Generator<string>} 
 * @param a {string} 
 * @param b {string} 
 */
export function* func(a: string, b: string): Generator<string> {
  console.log(a + b);
  yield a + b;
}
