/**
 * pm-sync-check: 项目管理文档静态一致性校验（L1 层）
 *
 * 用途：在 session 开工前 / 收尾时兜底检查"本该一起变的文档"是否一起变了。
 * 用法：npx tsx scripts/pm-sync-check.ts [--verbose]
 *
 * 父计划：ProjectManager/Plan/2026-04-17-pm-document-sync-mechanism.md
 *
 * 设计原则：
 * - 只做机械可验证的检查（文件存在、字段一致、版本号一致、档数一致）
 * - 不做语义/LLM 判断
 * - 宁可漏报不误报；每条报警都要指向具体文件+行号+建议动作
 * - 退出码 0 = 全绿；>0 = 有不一致（数字 = 不一致总数，上限 255）
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const PM_DIR = path.join(REPO_ROOT, 'ProjectManager');
const SPECS_DIR = path.join(PM_DIR, 'Specs');
const PLAN_DIR = path.join(PM_DIR, 'Plan');
const ISSUE_LIST = path.join(PM_DIR, 'ISSUE_LIST.md');
const PLAN_README = path.join(PLAN_DIR, 'README.md');
const INDEX_FILE = path.join(SPECS_DIR, '_index.md');

const VERBOSE = process.argv.includes('--verbose');

// ─── 工具 ──────────────────────────────────────────────

type Severity = 'error' | 'warn' | 'info';
interface Issue {
  check: string;
  severity: Severity;
  message: string;
  hint?: string;
  file?: string;
  line?: number;
}

const issues: Issue[] = [];
function report(i: Issue) {
  issues.push(i);
}

function readFileSafe(p: string): string | null {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function listMd(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(dir, f));
}

function relRepo(p: string): string {
  return path.relative(REPO_ROOT, p).replace(/\\/g, '/');
}

function findLine(content: string, needle: string): number {
  const idx = content.indexOf(needle);
  if (idx < 0) return 0;
  return content.slice(0, idx).split('\n').length;
}

// ─── 检查 1：Specs/_index.md 完整性 ────────────────────
// 规则：
//   a. Specs/*.md（除 _index.md）中的每个文件名都应出现在 _index.md 里
//   b. _index.md 里通过反引号或 markdown 链接引用的 Specs 文件名都应真实存在

function checkIndexIntegrity() {
  const indexContent = readFileSafe(INDEX_FILE);
  if (!indexContent) {
    report({
      check: 'index-integrity',
      severity: 'error',
      message: `Specs/_index.md 缺失`,
      hint: '这是规格矩阵入口文件，不能缺失',
    });
    return;
  }

  const specFiles = listMd(SPECS_DIR).filter(f => path.basename(f) !== '_index.md');

  for (const f of specFiles) {
    const base = path.basename(f);
    if (!indexContent.includes(base)) {
      report({
        check: 'index-integrity',
        severity: 'error',
        message: `Spec 文件未在 _index.md 登记：${base}`,
        file: relRepo(f),
        hint: `在 ProjectManager/Specs/_index.md 对应维度下加一行引用 \`${base}\``,
      });
    }
  }

  // 从 _index.md 中提取所有反引号内的 *.md 文件名（粗粒度）
  const referenced = new Set<string>();
  const re = /`([^`]+\.md)`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(indexContent)) !== null) {
    referenced.add(path.basename(m[1]));
  }
  for (const name of referenced) {
    if (name === '_index.md') continue;
    if (!fs.existsSync(path.join(SPECS_DIR, name))) {
      report({
        check: 'index-integrity',
        severity: 'warn',
        message: `_index.md 引用了不存在的 Spec 文件：${name}`,
        file: relRepo(INDEX_FILE),
        line: findLine(indexContent, name),
        hint: '检查文件是否被改名/删除，更新 _index.md 对应行',
      });
    }
  }
}

// ─── 检查 2：Specs 版本号一致性 ─────────────────────────
// 规则：
//   a. 若 Specs/foo.md 头部声明了版本号 vX.Y，则引用 foo.md 的 Plan/*.md
//      和 Plan/README.md 若同时标注了版本，应与 foo.md 头部一致
//   b. 只检查"被显式标注了版本"的引用点，没标注的不报（避免误报）

interface SpecVersion {
  file: string;
  name: string;
  version: string | null;
}

function extractSpecVersion(filePath: string): SpecVersion {
  const content = readFileSafe(filePath) ?? '';
  const head = content.split('\n').slice(0, 15).join('\n');
  // 匹配首个 vX.Y 或 vX.Y.Z
  const m = head.match(/(?:版本|Version)\s*[:：]\s*v(\d+(?:\.\d+){1,2})/i);
  return {
    file: filePath,
    name: path.basename(filePath),
    version: m ? `v${m[1]}` : null,
  };
}

function checkSpecVersionConsistency() {
  const specs = listMd(SPECS_DIR)
    .filter(f => path.basename(f) !== '_index.md')
    .map(extractSpecVersion)
    .filter(s => s.version !== null);

  const planFiles = listMd(PLAN_DIR);
  const allConsumers: { file: string; content: string }[] = [];
  for (const p of planFiles) {
    const c = readFileSafe(p);
    if (c) allConsumers.push({ file: p, content: c });
  }
  const readmeContent = readFileSafe(PLAN_README);
  if (readmeContent) {
    allConsumers.push({ file: PLAN_README, content: readmeContent });
  }

  for (const spec of specs) {
    for (const consumer of allConsumers) {
      const lines = consumer.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.includes(spec.name)) continue;
        // 同一行出现两个及以上不同 vX.Y，视为"升级描述/过渡/对比"语境，跳过（如"v2.1 → v2.2"）
        const allVers = Array.from(new Set((line.match(/\bv\d+(?:\.\d+){1,2}\b/g) ?? [])));
        if (allVers.length >= 2) continue;
        // 仅当这一行显式带了 vX.Y 版本号标签时才比对
        const vm = line.match(/\bv(\d+(?:\.\d+){1,2})\b/);
        if (!vm) continue;
        const cited = `v${vm[1]}`;
        if (cited !== spec.version) {
          report({
            check: 'spec-version',
            severity: 'error',
            message: `${path.basename(consumer.file)} 引用 ${spec.name} 标注为 ${cited}，但该 Spec 最新版本为 ${spec.version}`,
            file: relRepo(consumer.file),
            line: i + 1,
            hint: `把该行的版本标签从 ${cited} 改为 ${spec.version}`,
          });
        }
      }
    }
  }
}

// ─── 检查 3：ISSUE 状态一致性（启发式）───────────────────
// 规则（宁可漏报不误报）：
//   a. 从 ISSUE_LIST.md 解析每个 ISSUE-XXX 的权威状态（✅ / 🟡 / ⬜）
//   b. 在 Plan/*.md 中找到提到 "ISSUE-XXX" 的行，检查该行或其邻近 1 行
//      是否出现与权威状态直接冲突的关键词/emoji
//   c. 冲突关键词集：
//      - ✅ 完成 权威时，冲突 = {⬜, 🟡, 待排期, 进行中}
//      - ⬜ 未开工 权威时，冲突 = {✅, 已完成, 已关闭}
//      - 🟡 进行中 权威时，冲突 = {✅, 已完成, 已关闭, ⬜ 待}

type IssueStatus = 'done' | 'in-progress' | 'pending' | 'unknown';

function parseIssueStatus(line: string): IssueStatus {
  // 典型行："- **状态**: ✅ 已完成（...）"
  if (/✅|已完成|完全关闭|已关闭|已修复|已落地|按产品决策接受|降级关闭/.test(line)) return 'done';
  if (/🟡|进行中/.test(line)) return 'in-progress';
  if (/⬜|待排期|待评估|待修复|待启动|未启动/.test(line)) return 'pending';
  return 'unknown';
}

interface IssueRecord {
  id: string;
  status: IssueStatus;
  rawStatusLine: string;
  declLine: number;
}

function parseIssueList(): IssueRecord[] {
  const content = readFileSafe(ISSUE_LIST);
  if (!content) return [];
  const lines = content.split('\n');
  const records: IssueRecord[] = [];
  let currentId: string | null = null;
  let currentDeclLine = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^###\s+(ISSUE-\d+)/);
    if (m) {
      currentId = m[1];
      currentDeclLine = i + 1;
      continue;
    }
    if (currentId && /^-\s*\*\*状态\*\*/.test(lines[i])) {
      records.push({
        id: currentId,
        status: parseIssueStatus(lines[i]),
        rawStatusLine: lines[i].trim(),
        declLine: currentDeclLine,
      });
      currentId = null;
    }
  }
  return records;
}

function checkIssueStatusConsistency() {
  const records = parseIssueList();
  if (records.length === 0) return;
  const authoritativeById = new Map<string, IssueRecord>();
  for (const r of records) authoritativeById.set(r.id, r);

  const planFiles = listMd(PLAN_DIR);
  for (const pf of planFiles) {
    const content = readFileSafe(pf);
    if (!content) continue;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const matches = lines[i].match(/ISSUE-\d+/g);
      if (!matches) continue;
      // 若同一行提及多个 ISSUE，很可能是"类别汇总"语境，跳过以避免误报
      if (matches.length >= 2) continue;
      // 先剥掉行中所有圆括号/中文括号里的排除描述（如"（不含已关闭 021、027）"）
      const stripped = lines[i]
        .replace(/（[^（）]*）/g, '')
        .replace(/\([^()]*\)/g, '');
      for (const id of matches) {
        const auth = authoritativeById.get(id);
        if (!auth || auth.status === 'unknown') continue;
        const planStatus = parseIssueStatus(stripped);
        if (planStatus === 'unknown') continue;
        if (planStatus === auth.status) continue;
        // 允许 ISSUE_LIST 内部引用自身（避免当前 issue 的"关联"段误报）
        if (pf === ISSUE_LIST) continue;
        report({
          check: 'issue-status',
          severity: 'warn',
          message: `${path.basename(pf)} 提到 ${id} 的上下文暗示状态=${planStatus}，但 ISSUE_LIST.md 权威状态=${auth.status}`,
          file: relRepo(pf),
          line: i + 1,
          hint: `确认该行描述是否仍反映最新 ISSUE_LIST.md 状态；若已过期，更新此处描述或状态字段`,
        });
      }
    }
  }
}

// ─── 检查 4：Plan 引用的 Specs 都存在 ───────────────────
// 规则：扫 Plan/*.md 头部 "> 设计规格：..." 行，提取引用的 Specs/*.md，验证存在

function checkPlanSpecRefs() {
  const planFiles = listMd(PLAN_DIR).filter(f => path.basename(f) !== 'README.md');
  for (const pf of planFiles) {
    const content = readFileSafe(pf);
    if (!content) continue;
    const head = content.split('\n').slice(0, 20);
    for (let i = 0; i < head.length; i++) {
      const line = head[i];
      if (!/^>\s*(设计规格|父计划)/.test(line)) continue;
      const refs = line.match(/`([^`]+\.md)`/g) ?? [];
      for (const ref of refs) {
        const name = ref.replace(/`/g, '');
        // 解析相对路径：支持 Specs/foo.md 或 foo.md 或 Plan/foo.md
        let resolved: string;
        if (name.startsWith('Specs/')) resolved = path.join(PM_DIR, name);
        else if (name.startsWith('Plan/')) resolved = path.join(PM_DIR, name);
        else if (name.startsWith('ProjectManager/')) resolved = path.join(REPO_ROOT, name);
        else if (/^20\d{2}-\d{2}-\d{2}/.test(name)) {
          // 裸文件名，猜 Specs/ 或 Plan/
          const asSpec = path.join(SPECS_DIR, name);
          const asPlan = path.join(PLAN_DIR, name);
          if (fs.existsSync(asSpec)) resolved = asSpec;
          else if (fs.existsSync(asPlan)) resolved = asPlan;
          else resolved = asSpec; // 用于报错显示
        } else {
          continue;
        }
        if (!fs.existsSync(resolved)) {
          report({
            check: 'plan-spec-refs',
            severity: 'error',
            message: `${path.basename(pf)} 头部引用了不存在的文档：${name}`,
            file: relRepo(pf),
            line: i + 1,
            hint: '更新引用路径，或补回被删除的文档',
          });
        }
      }
    }
  }
}

// ─── 检查 5：TOPIC_STAR_CAP 一致性 ────────────────────
// 规则：
//   a. 读 src/constants/advance.ts 的 TOPIC_STAR_CAP 权威表
//   b. 读 scripts/generate-human-bank.ts 的 topics[].tiers 档数
//   c. 规则映射：CAP=3 → tiers.length==2；CAP=5 → tiers.length==3

const TOPIC_BY_ID: Record<string, string> = {
  'mental-arithmetic': 'A01',
  'number-sense': 'A02',
  'vertical-calc': 'A03',
  'operation-laws': 'A04',
  'decimal-ops': 'A05',
  'bracket-ops': 'A06',
  'multi-step': 'A07',
  'equation-transpose': 'A08',
};

function parseTopicStarCap(): Record<string, number> | null {
  const file = path.join(REPO_ROOT, 'src', 'constants', 'advance.ts');
  const content = readFileSafe(file);
  if (!content) return null;
  const m = content.match(/TOPIC_STAR_CAP\s*:[^=]*=\s*\{([\s\S]*?)\}/);
  if (!m) return null;
  const body = m[1];
  const result: Record<string, number> = {};
  const re = /['"]([\w-]+)['"]\s*:\s*(\d+)/g;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(body)) !== null) {
    result[mm[1]] = parseInt(mm[2], 10);
  }
  return result;
}

function parseHumanBankTiers(): Record<string, number> | null {
  const file = path.join(REPO_ROOT, 'scripts', 'generate-human-bank.ts');
  const content = readFileSafe(file);
  if (!content) return null;
  // 从 const topics: TopicConfig[] = [ ... ]; 中按顺序解析 id + tiers 数组长度
  const m = content.match(/const\s+topics\s*:\s*TopicConfig\[\]\s*=\s*\[([\s\S]*?)\n\];/);
  if (!m) return null;
  const body = m[1];
  // 按每个 "{" 顶层块切开
  const result: Record<string, number> = {};
  const blockRe = /\{\s*name:[\s\S]*?tiers:\s*\[([\s\S]*?)\]\s*,?\s*\}/g;
  const idRe = /id\s*:\s*['"]([\w-]+)['"]/;
  let bm: RegExpExecArray | null;
  while ((bm = blockRe.exec(body)) !== null) {
    const block = bm[0];
    const idMatch = block.match(idRe);
    if (!idMatch) continue;
    const id = idMatch[1];
    // 数 tiers 数组里的 { label: ... 个数
    const tiersBlock = bm[1];
    const tierCount = (tiersBlock.match(/\{\s*label:/g) ?? []).length;
    result[id] = tierCount;
  }
  return result;
}

function checkTopicStarCap() {
  const cap = parseTopicStarCap();
  const bank = parseHumanBankTiers();

  if (!cap) {
    report({
      check: 'topic-star-cap',
      severity: 'warn',
      message: '无法解析 src/constants/advance.ts 中的 TOPIC_STAR_CAP',
      hint: '若文件结构重构，请同步更新 pm-sync-check 的解析器',
    });
    return;
  }
  if (!bank) {
    report({
      check: 'topic-star-cap',
      severity: 'warn',
      message: '无法解析 scripts/generate-human-bank.ts 的 topics tiers',
      hint: '若 human-bank 脚本重构，请同步更新 pm-sync-check 的解析器',
    });
    return;
  }

  for (const [id, capVal] of Object.entries(cap)) {
    const expectedTiers = capVal === 3 ? 2 : capVal === 5 ? 3 : null;
    if (expectedTiers === null) {
      report({
        check: 'topic-star-cap',
        severity: 'warn',
        message: `TOPIC_STAR_CAP[${id}]=${capVal} 不在预期的 {3,5} 内`,
        hint: '确认数值；或更新本脚本的映射规则',
      });
      continue;
    }
    const actualTiers = bank[id];
    if (actualTiers === undefined) {
      report({
        check: 'topic-star-cap',
        severity: 'warn',
        message: `scripts/generate-human-bank.ts 未配置题型 ${id}（${TOPIC_BY_ID[id] ?? '?'}）`,
        hint: '在 topics 数组里补上该题型的 tiers 配置',
      });
      continue;
    }
    if (actualTiers !== expectedTiers) {
      report({
        check: 'topic-star-cap',
        severity: 'error',
        message: `${TOPIC_BY_ID[id] ?? id} TOPIC_STAR_CAP=${capVal} 应产出 ${expectedTiers} 档，但 human-bank 脚本配置了 ${actualTiers} 档`,
        file: 'scripts/generate-human-bank.ts',
        hint: capVal === 3
          ? `把该题型的 tiers 压到 2 档（如 [d=3, d=8]）`
          : `把该题型的 tiers 展开到 3 档（低/中/高）`,
      });
    }
  }
}

// ─── 检查 6：_index.md "生效" Spec 都有可追溯的 Plan（信息级）──
// 目前只输出信息，不算错误

function checkIndexSpecHasPlan() {
  if (!VERBOSE) return;
  // 先留空，未来可扩展
}

// ─── 主流程 ──────────────────────────────────────────

function formatIssue(i: Issue, idx: number): string {
  const icon = i.severity === 'error' ? '❌' : i.severity === 'warn' ? '⚠️ ' : 'ℹ️ ';
  const loc = i.file ? ` [${i.file}${i.line ? ':' + i.line : ''}]` : '';
  const lines: string[] = [`${icon} ${idx}. [${i.check}] ${i.message}${loc}`];
  if (i.hint) lines.push(`   ↳ 建议：${i.hint}`);
  return lines.join('\n');
}

function main() {
  console.log('─────────────────────────────────────────');
  console.log(' pm-sync-check — 项目文档静态一致性校验（L1）');
  console.log('─────────────────────────────────────────');

  checkIndexIntegrity();
  checkSpecVersionConsistency();
  checkIssueStatusConsistency();
  checkPlanSpecRefs();
  checkTopicStarCap();
  checkIndexSpecHasPlan();

  // 按 severity + check 归类输出
  const errors = issues.filter(i => i.severity === 'error');
  const warns = issues.filter(i => i.severity === 'warn');
  const infos = issues.filter(i => i.severity === 'info');

  if (issues.length === 0) {
    console.log('\n✅ 全绿：未发现不一致。\n');
    process.exit(0);
  }

  console.log('');
  if (errors.length > 0) {
    console.log(`❌ 错误（${errors.length}）：`);
    errors.forEach((it, i) => console.log(formatIssue(it, i + 1)));
    console.log('');
  }
  if (warns.length > 0) {
    console.log(`⚠️  警告（${warns.length}）：`);
    warns.forEach((it, i) => console.log(formatIssue(it, i + 1)));
    console.log('');
  }
  if (infos.length > 0 && VERBOSE) {
    console.log(`ℹ️  信息（${infos.length}）：`);
    infos.forEach((it, i) => console.log(formatIssue(it, i + 1)));
    console.log('');
  }

  console.log('─────────────────────────────────────────');
  console.log(` 合计：错误 ${errors.length} / 警告 ${warns.length} / 信息 ${infos.length}`);
  console.log(' 说明：错误 = 机械确信的不一致；警告 = 启发式疑似；信息 = 供参考');
  console.log('─────────────────────────────────────────');

  process.exit(Math.min(255, errors.length + warns.length));
}

main();
