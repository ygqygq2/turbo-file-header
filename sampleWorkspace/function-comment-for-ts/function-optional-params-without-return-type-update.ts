/**
 * @description 
 * @return default {string} 
 * @param a {string} 
 * @param [b='b'] {string}  
 * @param [c] {string} 
 */
function func(a: string, b = 'b', c?: string): string {
  return a + b + c;
}
