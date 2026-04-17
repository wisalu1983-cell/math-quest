import { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  /** 纯文本题干（可能已包含 LaTeX 片段 $...$） */
  text?: string;
  /** 显式 LaTeX 题干；若提供，优先渲染 */
  latex?: string;
  /** 可选的自定义 className */
  className?: string;
}

/**
 * 把题干中 $...$ 包围的 LaTeX 片段渲染成书面数学格式，其余仍用纯文本。
 * 用于：分数、根号等需要书面格式的题干。
 *
 * 规范：
 * - 生成器填 promptLatex 时，如 `把 $\\frac{3}{5}$ 化成小数`
 * - 若 promptLatex 为 LaTeX 全式（无 `$` 分隔），直接整体 KaTeX 渲染
 */
export default function MathText({ text, latex, className }: MathTextProps) {
  const html = useMemo(() => {
    if (latex) {
      try {
        return katex.renderToString(latex, { throwOnError: false, displayMode: false });
      } catch {
        return latex;
      }
    }
    if (!text) return '';
    if (!text.includes('$')) return escapeHtml(text);

    // 拆分 $...$ 片段
    const parts = text.split(/(\$[^$]+\$)/g);
    return parts
      .map(p => {
        if (p.startsWith('$') && p.endsWith('$')) {
          const expr = p.slice(1, -1);
          try {
            return katex.renderToString(expr, { throwOnError: false, displayMode: false });
          } catch {
            return escapeHtml(expr);
          }
        }
        return escapeHtml(p);
      })
      .join('');
  }, [text, latex]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
