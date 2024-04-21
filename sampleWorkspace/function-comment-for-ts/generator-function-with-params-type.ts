export function* func(a: string, b: string): Generator<string> {
  console.log(a + b);
  yield a + b;
}
