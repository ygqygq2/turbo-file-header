export function* func(a: string, b = 'b', c?: string): Generator<string> {
  console.log(a + b);
  yield a + b;
}
