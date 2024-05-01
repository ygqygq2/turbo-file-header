class ClassA {
/**
 * @description 
 * @return default {auto} 
 * @param a {string} 
 * @param [b='b'] {string} 
 * @param [c] {string} 
 */
  get func(a: string, b:string = 'b', c?: string) {
    return a + b + c;
  }
}
