/**
 * @description 
 * @return default {Generator<string>} 
 * @param a {string} 
 * @param [b='b'] {any}  
 * @param [c] {string} 
 */
export function* func(a: string, b = 'b', c?: string): Generator<string> {
  console.log(a + b);
  yield a + b;
}
