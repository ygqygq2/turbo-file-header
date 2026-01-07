/**
 * 简单的数学表达式计算器
 * 用于替代 mathjs，仅支持基础算术运算
 *
 * @example
 * simpleEval('2024 + 1') // '2025'
 * simpleEval('100 * 2') // '200'
 * simpleEval('10 / 2') // '5'
 */

/**
 * 安全地计算简单的数学表达式
 * @param expr 数学表达式字符串，仅支持数字和 +-* / () 运算符
 * @returns 计算结果字符串，如果表达式无效则返回原始输入
 */
export function simpleEval(expr: string): string {
  try {
    // 移除空格
    const cleanExpr = expr.trim();

    // 安全检查：只允许数字、空格和基本运算符
    if (!/^[\d\s+\-*/().]+$/.test(cleanExpr)) {
      return expr;
    }

    // 检查是否包含危险模式
    if (cleanExpr.includes('..') || cleanExpr.includes('__')) {
      return expr;
    }

    // 使用 Function 构造器计算（比 eval 稍安全，且已做输入验证）
    const result = new Function(`'use strict'; return (${cleanExpr})`)();

    // 验证结果是有效数字
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return String(result);
    }

    return expr;
  } catch {
    // 任何错误都返回原始表达式
    return expr;
  }
}

/**
 * 计算带有基础数值的表达式
 * @param base 基础值（通常是日期或数字字符串）
 * @param operation 操作符和数值，如 "+1", "-5", "*2"
 * @returns 计算结果字符串
 */
export function calculateWithBase(base: string, operation: string): string {
  const baseNum = parseFloat(base);

  if (isNaN(baseNum)) {
    return base;
  }

  return simpleEval(`${baseNum}${operation}`);
}
