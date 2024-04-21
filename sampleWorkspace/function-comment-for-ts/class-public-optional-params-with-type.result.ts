class classA {
/**
 * @description 
 * @return default {string} 
 * @param a {string} 
 * @param [b='b'] {any}  
 * @param [c] {string} 
 */
  public func(a: string, b = 'b', c?: string): string {
    return a + b + c;
  }
}
