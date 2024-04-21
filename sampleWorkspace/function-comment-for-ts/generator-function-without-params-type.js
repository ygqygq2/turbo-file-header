export function* func(a, b) {
  console.log(a + b);
  yield a + b;
}
