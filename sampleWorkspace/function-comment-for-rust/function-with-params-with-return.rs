fn foo(bar: Option<i32>) -> i32 {
  let bar = bar.unwrap_or(42);
  println!("{}", bar);
  bar
}
