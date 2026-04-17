/**
 * 表达式与等式等价验证工具
 *
 * 用于 A06 括号变换、A07 简便计算、A08 方程移项 等"填写式子/等式"题型。
 * 基础库：mathjs。
 *
 * 设计原则：
 * - 预处理先做 Unicode/全角/中文符号 → 标准 ASCII 转换
 * - 用 mathjs.parse + simplify 做数学等价比较
 * - 对表达式：两侧相减 simplify 后等于 0 即等价
 * - 对方程：分别对两侧做上述比较；或把方程转成"左 - 右 = 0"形式再比
 */

import { parse, simplify, type MathNode } from 'mathjs';

// ==================== 预处理 ====================

/**
 * 把用户输入的数学表达式规范化为 mathjs 能解析的 ASCII 形式。
 * 处理：
 * - 全角数字、标点 -> 半角
 * - 中文数学符号 -> ASCII
 * - 中文括号 -> ASCII
 * - 小数点 -> .
 * - 去空白和肉眼不可见字符
 */
export function normalizeInput(raw: string): string {
  if (!raw) return '';
  let s = raw;

  // 全角转半角（数字 + 标点 + 字母）
  s = s.replace(/[\uff01-\uff5e]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );

  // 中文数学符号 → ASCII
  s = s
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-') // Unicode minus
    .replace(/–/g, '-') // en-dash
    .replace(/—/g, '-') // em-dash
    .replace(/·/g, '*')
    .replace(/[。]/g, '.')
    .replace(/．/g, '.');

  // 中文括号 → ASCII
  s = s.replace(/（/g, '(').replace(/）/g, ')');

  // 中括号 [ ] 转小括号（mathjs 支持，但简化比较统一用小括号）
  s = s.replace(/\[/g, '(').replace(/\]/g, ')');

  // 省略号 / 奇怪空格
  s = s.replace(/\u2026/g, '').replace(/\s+/g, '');

  return s;
}

// ==================== 表达式等价 ====================

/**
 * 判断两个表达式（不含等号）是否数学等价。
 * 如 `72 - 55 + 10` 与 `-55 + 72 + 10` 算等价。
 * 不要求形式相同，只要求数学意义相同。
 */
export function isExpressionEquivalent(userExpr: string, standardExpr: string): boolean {
  const u = normalizeInput(userExpr);
  const s = normalizeInput(standardExpr);
  if (!u || !s) return false;

  try {
    const diff = parse(`(${u}) - (${s})`);
    const simplified = simplify(diff);
    const str = simplified.toString().replace(/\s+/g, '');
    // simplify 后应为 0 或形如 "0"
    return str === '0';
  } catch {
    return false;
  }
}

// ==================== 等式等价 ====================

/**
 * 把 "a = b" 形式的等式拆成左右两个表达式。
 * 返回 null 表示格式不合法（没有唯一等号）。
 */
export function splitEquation(raw: string): { left: string; right: string } | null {
  const s = normalizeInput(raw);
  const parts = s.split('=');
  if (parts.length !== 2) return null;
  if (!parts[0] || !parts[1]) return null;
  return { left: parts[0], right: parts[1] };
}

/**
 * 把一个一次方程 "L = R" 转换成关于 variable 的线性系数 { a, b }：
 *   L - R = a * variable + b  （a 为系数，b 为常数项）
 * 用代入法：
 *   b = f(variable=0) = L(0) - R(0)
 *   a = f(1) - f(0)
 * 对一次方程结果唯一，对含二次以上项返回 null。
 */
function toLinearForm(
  eq: { left: string; right: string },
  variable: string = 'x'
): { a: number; b: number } | null {
  try {
    const diffExpr = `(${eq.left}) - (${eq.right})`;
    const node = parse(diffExpr);
    const f = (v: number) => node.evaluate({ [variable]: v });
    const v0 = f(0);
    const v1 = f(1);
    const v2 = f(2);
    if (typeof v0 !== 'number' || typeof v1 !== 'number' || typeof v2 !== 'number') return null;
    const a = v1 - v0;
    const b = v0;
    // 验证线性（f(2) 应等于 2a + b）
    if (Math.abs(2 * a + b - v2) > 1e-8) return null;
    return { a, b };
  } catch {
    return null;
  }
}

/**
 * 判断两个方程是否描述同一个解集。
 * 对一次方程而言，等价 iff 两个线性式 `a1 x + b1 = 0` 与 `a2 x + b2 = 0`
 *   成比例，即 a1 * b2 === a2 * b1 且 a1、a2 同时为 0 或同时不为 0。
 * 这是 A08 方程移项填写题的核心判分方法。
 */
export function isEquationEquivalent(
  userEq: string,
  standardEq: string,
  variable: string = 'x'
): boolean {
  const u = splitEquation(userEq);
  const s = splitEquation(standardEq);
  if (!u || !s) return false;

  const uLinear = toLinearForm(u, variable);
  const sLinear = toLinearForm(s, variable);
  if (!uLinear || !sLinear) return false;

  const EPS = 1e-8;
  // 两个方程 a1 x + b1 = 0 和 a2 x + b2 = 0 等价
  // iff 存在 k != 0 使得 a1 = k*a2 且 b1 = k*b2
  // iff a1*b2 === a2*b1 且 a1、a2 不能一个为 0 一个不为 0（除非 b 也都为 0）

  // 特殊情况：两个方程都是恒等式 0 = 0（a=0, b=0）
  if (
    Math.abs(uLinear.a) < EPS && Math.abs(uLinear.b) < EPS &&
    Math.abs(sLinear.a) < EPS && Math.abs(sLinear.b) < EPS
  ) return true;

  // 特殊情况：一个恒成立一个不恒成立 -> 不等价
  if (Math.abs(uLinear.a) < EPS && Math.abs(sLinear.a) >= EPS) return false;
  if (Math.abs(sLinear.a) < EPS && Math.abs(uLinear.a) >= EPS) return false;

  // 一般情况：比较交叉乘积
  const cross = uLinear.a * sLinear.b - sLinear.a * uLinear.b;
  if (Math.abs(cross) > EPS) return false;

  // 额外保证：系数方向一致（不是恒为 false 的无解方程）
  // 对一次方程，上面 cross = 0 已足够。
  return true;
}

// ==================== 额外校验：不得直接给出 x 的解 ====================

/**
 * 判断一个方程形如 "x = <具体数值>"，即学生偷懒直接写答案。
 * A08 明确要求"不要算出 x 的值"，此类输入应被判为格式不符。
 */
export function isTrivialSolution(raw: string, variable: string = 'x'): boolean {
  const s = normalizeInput(raw);
  const re = new RegExp(`^${variable}=-?\\d+(\\.\\d+)?$`);
  return re.test(s);
}

// ==================== 不允许括号（用于 A06 去括号题） ====================

export function hasAnyBracket(raw: string): boolean {
  const s = normalizeInput(raw);
  return /[()]/.test(s);
}

// ==================== 必须包含指定结构的括号（用于 A06 添括号题） ====================

/**
 * 简单结构检查：用户表达式必须含括号且去括号后与标准等价。
 * 用于添括号题：学生必须真的"加上"括号，不能只写 flat 等价式。
 */
export function hasBracketAndEquivalent(userExpr: string, standardExpr: string): boolean {
  if (!hasAnyBracket(userExpr)) return false;
  return isExpressionEquivalent(userExpr, standardExpr);
}

// ==================== 数值答案（保留原有规则，向下兼容） ====================

/**
 * 数值答案归一化（兼容原 store/index.ts 中的 normalize 规则）。
 * 保留这里是为了让所有答案比较都走同一套入口。
 */
export function normalizeNumericAnswer(s: string): string {
  let r = s.trim().replace(/\s+/g, '').replace(/\u2026/g, '...');
  if (r.includes('.')) {
    r = r.replace(/0+$/, '').replace(/\.$/, '');
  }
  return r;
}

export function isNumericEqual(userAnswer: string, standard: string | number): boolean {
  return normalizeNumericAnswer(userAnswer) === normalizeNumericAnswer(String(standard));
}

// ==================== 多选答案（A、B、C、D 集合相等） ====================

/**
 * 多选答案按字母集合比较，忽略顺序和分隔符。
 * 用户可能输入 "A,C" / "AC" / "A C" / "A、C" 等形式。
 */
export function isMultiChoiceEqual(userAnswer: string, standard: string | string[]): boolean {
  const parseLetters = (s: string): Set<string> => {
    const matches = s.toUpperCase().match(/[A-F]/g) || [];
    return new Set(matches);
  };
  const u = parseLetters(userAnswer);
  const s = parseLetters(Array.isArray(standard) ? standard.join('') : standard);
  if (u.size !== s.size) return false;
  for (const c of u) if (!s.has(c)) return false;
  return true;
}

// ==================== 多步填空答案（数组按序匹配） ====================

/**
 * 多步填空的答案是数组，按顺序逐项匹配（允许每项为数字或表达式）。
 * 每一项都走 isNumericEqual 或 isExpressionEquivalent 判断。
 */
export function isMultiBlankEqual(
  userAnswers: string[],
  standardAnswers: Array<string | number>
): boolean {
  if (userAnswers.length !== standardAnswers.length) return false;
  for (let i = 0; i < userAnswers.length; i++) {
    const u = String(userAnswers[i]).trim();
    const s = String(standardAnswers[i]).trim();
    // 先尝试数值比较（最常见），失败再尝试表达式等价
    if (isNumericEqual(u, s)) continue;
    if (isExpressionEquivalent(u, s)) continue;
    return false;
  }
  return true;
}

// 在 mathjs 中类型别名转出，方便调用方统一引用
export type { MathNode };
