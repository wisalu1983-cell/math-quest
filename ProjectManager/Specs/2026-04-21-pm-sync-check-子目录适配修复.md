# pm-sync-check 子目录适配修复

> 创建：2026-04-21
> 所属版本：跨版本工具性
> 状态：📋 待实施
> 目标文件：`scripts/pm-sync-check.ts`
> 验证命令：`npx tsx scripts/pm-sync-check.ts`

---

## 一、背景

`pm-sync-check` 是项目管理文档的静态一致性校验脚本（L1 层），在 2026-04-17 首次落地。2026-04-20 项目管理体系引入了两条新规则：

1. **功能设计文档子目录规则**（Plan/README.md §功能设计文档子目录规则）：新 Spec 按功能收进 `Specs/<feature-slug>/` 子目录
2. **子计划 Plan 文件位置规则**（Plan/README.md §子计划 Plan 文件位置规则）：Plan 头部引用 Spec 时可用相对 `Specs/` 的路径（如 `dev-tool-panel/2026-04-20-research-findings.md`）

脚本的多处逻辑仍按"Specs/ 下全部扁平"的旧假设编写，导致：
- 子目录里的 Spec 文件不被扫描（漏报）
- 子目录路径格式的引用不被识别（静默跳过）

另有一条已写入管理规则但从未实现的机械检查：Backlog ↔ ISSUE_LIST ID 互斥。

### 已修复项（本文不再覆盖）

`checkIndexIntegrity()` 的反向检查（L125-148）已于 2026-04-21 修复——去掉 `path.basename()` 截断，增加占位符和跨目录引用过滤。修复后 `npx tsx scripts/pm-sync-check.ts` 全绿。

---

## 二、待修复清单

### 修复 A：Check 1a 正向扫描覆盖 Specs 子目录

**位置**：`checkIndexIntegrity()` L110-123

**现状**：
```typescript
const specFiles = listMd(SPECS_DIR).filter(f => path.basename(f) !== '_index.md');

for (const f of specFiles) {
  const base = path.basename(f);
  if (!indexContent.includes(base)) {
    report({ ... message: `Spec 文件未在 _index.md 登记：${base}` ... });
  }
}
```

**问题**：`listMd()` 只读根目录。`Specs/dev-tool-panel/2026-04-20-research-findings.md` 等子目录文件永远不会被检查是否已在 `_index.md` 登记。

**修复要点**：
1. `listMd(SPECS_DIR)` → `listMdRecursive(SPECS_DIR)`（该函数已存在于 L68-81）
2. 身份标识从 `path.basename(f)` 改为 `path.relative(SPECS_DIR, f).replace(/\\/g, '/')`（即相对 `Specs/` 的路径）
3. `_index.md` 中的比对也用相对路径——根目录文件是纯文件名（如 `2026-04-17-generator-redesign-v2.md`），子目录文件是含路径的（如 `dev-tool-panel/2026-04-20-research-findings.md`）；两种格式都能匹配
4. 报告和 hint 里展示相对路径而非 basename

**预期行为**：
- `Specs/dev-tool-panel/` 下未登记的文件 → 报 error
- `Specs/` 根下未登记的文件 → 仍报 error（不退化）

---

### 修复 B：Check 2 版本号一致性覆盖 Specs 子目录

**位置**：`checkSpecVersionConsistency()` L175-179 + `extractSpecVersion()` L163-173

**现状**：
```typescript
const specs = listMd(SPECS_DIR)             // ← 只扫根
  .filter(f => path.basename(f) !== '_index.md')
  .map(extractSpecVersion)
  .filter(s => s.version !== null);
```
且 `extractSpecVersion` 返回的 `name` 字段是 `path.basename(filePath)`，后续在 Plan 文本中按 `name` 做字符串匹配。

**问题**：子目录 Spec 不被扫描；即使扫到，Plan 中如果用子目录路径引用（`dev-tool-panel/2026-04-20-research-findings.md`），按 basename 匹配会命中错误位置或漏掉。

**修复要点**：
1. `listMd(SPECS_DIR)` → `listMdRecursive(SPECS_DIR)`
2. `extractSpecVersion` 增加 `relPath` 字段（相对 `SPECS_DIR` 的路径），保留 `name`（basename）用于兼容旧引用
3. L196-217 的 consumer 匹配逻辑：对每行同时检查 `spec.relPath` 和 `spec.name` 是否出现，优先匹配 `relPath`（更精确）

**预期行为**：
- 子目录 Spec 声明了版本号 → Plan 中引用该 Spec 并标注了不同版本 → 报 error

---

### 修复 C：Check 4 Plan→Spec 引用解析支持子目录路径

**位置**：`checkPlanSpecRefs()` L398-425

**现状**：
```typescript
// 解析逻辑的分支覆盖（L404-425）：
if (name.startsWith('Specs/'))           → path.join(PM_DIR, name)        // ✅
else if (name.startsWith('Plan/'))       → path.join(PM_DIR, name)        // ✅
else if (name.startsWith('ProjectManager/')) → path.join(REPO_ROOT, name) // ✅
else if (/^20\d{2}-\d{2}-\d{2}/.test(name)) → 多级兜底                    // ✅ 但只匹配日期开头
else → continue;                                                          // ← 盲区
```

**问题**：当 Plan 头部写 `` `dev-tool-panel/2026-04-20-research-findings.md` ``（相对 `Specs/` 的路径，不以 `Specs/` 或日期开头）时，走到 `else → continue`，静默跳过——比误报更危险。

**修复要点**：

在 L408 的 `else if (/^20\d{2}-\d{2}-\d{2}/.test(name))` **之前**插入一个分支：

```typescript
else if (name.includes('/') && !name.startsWith('.')) {
  // 含路径分隔符、非 Specs/Plan/PM 前缀 → 当作相对 Specs/ 的子目录路径
  resolved = path.join(SPECS_DIR, name);
}
```

这样 `dev-tool-panel/2026-04-20-research-findings.md` 会被解析为 `Specs/dev-tool-panel/2026-04-20-research-findings.md` 并验证存在性。

**预期行为**：
- Plan 头部引用子目录 Spec 路径 → 文件存在则通过，不存在则报 error
- 不影响已有的 `Specs/`、`Plan/`、纯文件名分支

---

### 修复 D：新增 Check 6 — Backlog ↔ ISSUE_LIST ID 互斥

**位置**：新函数 `checkIssueIdExclusive()`，在 `main()` 中 `checkIssueStatusConsistency()` 之后调用

**规则来源**：
- Plan/README.md §Backlog vs ISSUE_LIST 边界："同一条目不同时在两边"
- ISSUE_LIST.md §操作规范 第 4 点："同一条目不同时在两边"

**逻辑**：
1. 从 `ISSUE_LIST.md` 提取所有 `### ISSUE-XXX` 的 ID 集合
2. 从 `Backlog.md` 提取所有 `### ISSUE-XXX` 的 ID 集合（注意 Backlog 也有非 ISSUE 条目如 `BL-001`，只取 `ISSUE-` 前缀的）
3. 求交集；交集非空 → 每个重复 ID 报 warn，附带两侧行号

**参考实现**：

```typescript
function checkIssueIdExclusive() {
  const issueContent = readFileSafe(ISSUE_LIST);
  const backlogContent = readFileSafe(BACKLOG_FILE);
  if (!issueContent || !backlogContent) return;

  const extractIds = (content: string): Map<string, number> => {
    const ids = new Map<string, number>();
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^###\s+(ISSUE-\d+)/);
      if (m) ids.set(m[1], i + 1);
    }
    return ids;
  };

  const issueIds = extractIds(issueContent);
  const backlogIds = extractIds(backlogContent);

  for (const [id, issueLine] of issueIds) {
    const backlogLine = backlogIds.get(id);
    if (backlogLine !== undefined) {
      report({
        check: 'issue-id-exclusive',
        severity: 'warn',
        message: `${id} 同时出现在 ISSUE_LIST.md（L${issueLine}）和 Backlog.md（L${backlogLine}）`,
        file: relRepo(ISSUE_LIST),
        line: issueLine,
        hint: '同一条目不应同时在两个文件中；确认其当前归属后从另一侧移除',
      });
    }
  }
}
```

**预期行为**：
- 同一 ISSUE ID 出现在两个文件 → 报 warn
- 仅 ISSUE-xxx 格式的 ID 参与校验（BL-xxx 天然只在 Backlog，不需要互斥检查）
- 当前两个文件没有重叠（ISSUE_LIST 为空），所以修复后仍全绿

---

## 三、不做的事

| 项目 | 理由 |
|------|------|
| Overview 版本轴 ↔ Plan/README 版本索引交叉校验 | 收益低，两处通常由 agent 同步更新 |
| Plan 头部"所属版本"字段存在性检查 | 模板格式纠偏，不值得机械化 |
| 重构脚本架构 | 架构没问题，差距都是局部修补 |

---

## 四、实施顺序与验证

| 步骤 | 修复项 | 改动量 | 验证 |
|------|--------|--------|------|
| 1 | 修复 A：Check 1a 子目录扫描 | ~10 行 | 在 `Specs/dev-tool-panel/` 下新建一个临时 `.md`，跑脚本应报 error；删除后应全绿 |
| 2 | 修复 B：Check 2 子目录版本号 | ~10 行 | 在子目录 Spec 头部加 `版本：v9.9`，在任一 Plan 中引用并标 `v1.0`，跑脚本应报 error；还原后全绿 |
| 3 | 修复 C：Check 4 引用解析 | ~5 行 | 在任一 Plan 头部 `设计规格：` 行加 `` `dev-tool-panel/2026-04-20-research-findings.md` ``，跑脚本应不报 error（文件存在）；改为不存在的路径应报 error |
| 4 | 修复 D：新增 ID 互斥 | ~25 行 | 临时在 ISSUE_LIST 和 Backlog 里都写 `### ISSUE-059`，跑脚本应报 warn；还原后全绿 |
| 5 | 全量回归 | 0 | `npx tsx scripts/pm-sync-check.ts` 全绿，无新增误报 |

每步修完单独验证再进下一步。最终全量跑一次确认全绿。

---

## 五、关联文件

| 文件 | 角色 |
|------|------|
| `scripts/pm-sync-check.ts` | 修改目标 |
| `ProjectManager/Specs/_index.md` | Check 1 的校验对象 |
| `ProjectManager/ISSUE_LIST.md` | Check 3/6 的校验对象 |
| `ProjectManager/Backlog.md` | Check 6 的校验对象 |
| `ProjectManager/Plan/README.md` | 规则来源（§子目录规则 / §Backlog 边界） |
