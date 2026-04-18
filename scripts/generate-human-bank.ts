/**
 * 生成人肉验证题库：每主题 × 三档各 5 题，输出 Markdown 文件。
 * 用法: npx tsx scripts/generate-human-bank.ts
 */
import { generateMentalArithmetic } from '../src/engine/generators/mental-arithmetic';
import { generateNumberSense } from '../src/engine/generators/number-sense';
import { generateVerticalCalc } from '../src/engine/generators/vertical-calc';
import { generateOperationLaws } from '../src/engine/generators/operation-laws';
import { generateDecimalOps } from '../src/engine/generators/decimal-ops';
import { generateBracketOps } from '../src/engine/generators/bracket-ops';
import { generateMultiStep } from '../src/engine/generators/multi-step';
import { generateEquationTranspose } from '../src/engine/generators/equation-transpose';
import type { Question } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type GenFn = (p: { difficulty: number; id: string; subtypeFilter?: string[] }) => Question;

interface TopicConfig {
  name: string;
  id: string;
  gen: GenFn;
  tiers: { label: string; difficulty: number; subtypes?: string[] }[];
}

const topics: TopicConfig[] = [
  {
    name: 'A01 口算速算',
    id: 'mental-arithmetic',
    gen: generateMentalArithmetic,
    // v2.2：2 档分布（TOPIC_STAR_CAP = 3★）
    tiers: [
      { label: '档 1 (d=3)', difficulty: 3 },
      { label: '档 2 (d=8)', difficulty: 8 },
    ],
  },
  {
    name: 'A02 数感估算',
    id: 'number-sense',
    gen: generateNumberSense,
    tiers: [
      { label: '低档 (d=3)', difficulty: 3 },
      { label: '中档 (d=7)', difficulty: 7 },
      { label: '高档 (d=9)', difficulty: 9 },
    ],
  },
  {
    name: 'A03 竖式笔算',
    id: 'vertical-calc',
    gen: generateVerticalCalc,
    tiers: [
      { label: '低档 (d=3)', difficulty: 3 },
      { label: '中档 (d=7)', difficulty: 7 },
      { label: '高档 (d=9)', difficulty: 9 },
    ],
  },
  {
    name: 'A04 运算律',
    id: 'operation-laws',
    gen: generateOperationLaws,
    // v2.2：2 档分布（TOPIC_STAR_CAP = 3★）
    tiers: [
      { label: '档 1 (d=3)', difficulty: 3 },
      { label: '档 2 (d=8)', difficulty: 8 },
    ],
  },
  {
    name: 'A05 小数运算',
    id: 'decimal-ops',
    gen: generateDecimalOps,
    tiers: [
      { label: '低档 (d=3)', difficulty: 3 },
      { label: '中档 (d=7)', difficulty: 7 },
      { label: '高档 (d=9)', difficulty: 9 },
    ],
  },
  {
    name: 'A06 括号变换',
    id: 'bracket-ops',
    gen: generateBracketOps,
    tiers: [
      { label: '低档 (d=3)', difficulty: 3 },
      { label: '中档 (d=7)', difficulty: 7 },
      { label: '高档 (d=9)', difficulty: 9 },
    ],
  },
  {
    name: 'A07 多步混合运算',
    id: 'multi-step',
    gen: generateMultiStep,
    tiers: [
      { label: '低档 (d=3)', difficulty: 3 },
      { label: '中档 (d=7)', difficulty: 7 },
      { label: '高档 (d=9)', difficulty: 9 },
    ],
  },
  {
    name: 'A08 方程移项',
    id: 'equation-transpose',
    gen: generateEquationTranspose,
    // v2.2：2 档分布（TOPIC_STAR_CAP = 3★）
    tiers: [
      { label: '档 1 (d=3)', difficulty: 3 },
      { label: '档 2 (d=8)', difficulty: 8 },
    ],
  },
];

function formatQuestion(q: Question, idx: number): string {
  // prompt/answer 中的换行和管道符会破坏 markdown 表格，需要转义
  const safePrompt = String(q.prompt).replace(/\|/g, '∣').replace(/\n/g, '<br>');
  const safeAnswer = String(q.solution.answer).replace(/\|/g, '∣').replace(/\n/g, ' ');
  return `| ${idx} | ${q.type} | ${safePrompt} | ${safeAnswer} |`;
}

function main() {
  const out: string[] = [];
  out.push('# 人肉验证题库（按 v2.2 档位分布）');
  out.push('');
  out.push('> 自动生成于 ' + new Date().toISOString().slice(0, 10));
  out.push('> 用途：你来做这些题，主观判断档位之间的难度梯度是否明显');
  out.push('> 说明：A01/A04/A08 为 2 档设计（对齐 TOPIC_STAR_CAP = 3★），其他为 3 档');
  out.push('');
  out.push('## 使用方法');
  out.push('');
  out.push('1. 按主题从上到下浏览，先做低档、再做中档、最后做高档');
  out.push('2. 每档做完后记录：');
  out.push('   - 你觉得难度上升明显吗？（明显 / 一般 / 没感觉）');
  out.push('   - 有没有哪道题的难度和它所在的档不匹配？');
  out.push('3. 做完后把主观评价告诉我');
  out.push('');
  out.push('---');
  out.push('');

  for (const topic of topics) {
    out.push(`## ${topic.name}`);
    out.push('');
    for (const tier of topic.tiers) {
      out.push(`### ${tier.label}`);
      out.push('');
      out.push('| # | 题型 | 题目 | 正确答案 |');
      out.push('|---|------|------|----------|');
      
      const count = 10;
      for (let i = 0; i < count; i++) {
        const q = topic.gen({
          difficulty: tier.difficulty,
          id: `human-${topic.id}-${tier.difficulty}-${i}`,
          subtypeFilter: tier.subtypes,
        });
        out.push(formatQuestion(q, i + 1));
      }
      out.push('');
      out.push('**你的评价**: ___');
      out.push('');
    }
    out.push('---');
    out.push('');
  }

  const outputPath = path.join(__dirname, '..', 'ProjectManager', 'human-verification-bank.md');
  fs.writeFileSync(outputPath, out.join('\n'), 'utf-8');
  console.log(`Generated: ${outputPath}`);
}

main();
