/**
 * @description 
 * @return default {i32} 
 * @param bar {Option<i32>} 
 */
fn foo(bar: Option<i32>) -> i32 {
  let bar = bar.unwrap_or(42);
  println!("{}", bar);
  bar
}
