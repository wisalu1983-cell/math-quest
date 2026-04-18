import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type ScenarioId = 'partial-product' | 'division-trial' | 'long-division-feel';
type SchemeId = 'overloaded-board' | 'split-boards' | 'hybrid-flow';
type Tone = 'primary' | 'success' | 'warning';

interface Scenario {
  id: ScenarioId;
  label: string;
  prompt: string;
  summary: string;
  focus: string;
}

interface Scheme {
  id: SchemeId;
  label: string;
  shortLabel: string;
  pitch: string;
  lookFor: string;
  signature: string;
  complexity: number;
  teaching: number;
  extensibility: number;
  implementation: string[];
  strengths: string[];
  caution: string;
  verdict: string;
  recommended?: boolean;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'partial-product',
    label: '乘法部分积',
    prompt: '36 × 45',
    summary: '看三种方案如何让学生显式填写部分积，而不只是直接写答数。',
    focus: '重点比较：版式清晰度 / 部分积错位表达 / 结果汇总是否自然。',
  },
  {
    id: 'division-trial',
    label: '简化试商',
    prompt: '156 ÷ 24',
    summary: '看三种方案如何让“试商 -> 乘回 -> 相减 -> 继续”变成可见动作。',
    focus: '重点比较：试商过程是否显式 / 是否容易和旧竖式板混在一起 / 学生负担是否可控。',
  },
  {
    id: 'long-division-feel',
    label: '标准长除感',
    prompt: '15.6 ÷ 0.24',
    summary: '看三种方案处理“小数扩倍 + 长除感”时，谁更接近未来可扩展形态。',
    focus: '重点比较：转化步骤表达 / 长除版式潜力 / 是否会把首版复杂度推爆。',
  },
];

const SCHEMES: Scheme[] = [
  {
    id: 'overloaded-board',
    label: '方案 1 · 单组件重载',
    shortLabel: '单组件重载',
    pitch: '继续把所有竖式都塞进一个增强版 VerticalCalcBoard。',
    lookFor: '先看它是不是把所有语义都塞进了同一块板。',
    signature: '一块巨板里同时出现 mode / 结果 / 过程 / 转化',
    complexity: 5,
    teaching: 3,
    extensibility: 2,
    implementation: [
      '保留一个超级 `VerticalCalcBoard`',
      '用 `mode` 分支兼容部分积 / 试商 / 小数点 / 结果格',
      '同一文件持续膨胀',
    ],
    strengths: ['入口统一', '复用现有键盘与格子状态', '短期看起来代码文件数最少'],
    caution: '乘法和除法版式差异太大，后续极容易演变成巨石组件。',
    verdict: '更像“先省文件数”，不太像“先省长期成本”。',
  },
  {
    id: 'split-boards',
    label: '方案 2 · 双组件并列 + 共享输入协议',
    shortLabel: '双组件并列',
    pitch: '乘法与除法各自有专用板，但共享统一的输入、校验和反馈语言。',
    lookFor: '先看它有没有把“主板”和“共享协议”清楚分层。',
    signature: '主板独立成立，旁边再挂共享协议或动作链',
    complexity: 4,
    teaching: 5,
    extensibility: 5,
    implementation: [
      '保留旧 `VerticalCalcBoard` 处理已落地块 B',
      '新增 `PartialProductBoard` + `DivisionTrialBoard`',
      '抽共享 primitives：格子状态 / 键盘输入 / 提交反馈',
    ],
    strengths: ['最容易保持结构清晰', '最适合“先做首版，再逐步深化”', '对未来小数试商与长除版式最友好'],
    caution: '组件数会变多，首版设计阶段需要把共享协议先想清楚。',
    verdict: '这是我当前推荐的方案：页面和代码结构都最稳。',
    recommended: true,
  },
  {
    id: 'hybrid-flow',
    label: '方案 3 · 乘法真交互 + 除法半交互',
    shortLabel: '混合流程',
    pitch: '乘法做成真正的部分积板，除法则做成过程卡片式引导器。',
    lookFor: '先看它是不是已经不再执着“都做成板”，而开始分流。',
    signature: '乘法像板，除法像答数区 + 步骤卡流',
    complexity: 3,
    teaching: 4,
    extensibility: 3,
    implementation: [
      '乘法单独做板式交互',
      '除法保留答数输入，外加试商流程卡片',
      '实现最快，但乘除两边语言不统一',
    ],
    strengths: ['首版风险最低', '最容易快速把“乘法部分积”拉起来', '除法比现在强但不重做全布局'],
    caution: '除法更像训练器，不像真正竖式板；长期容易形成两套交互语言。',
    verdict: '如果目标是快上第一版，它有吸引力；如果目标是长期 A03+，它偏过渡。',
  },
];

const RECOMMENDATION_COPY: Record<ScenarioId, string> = {
  'partial-product': '在“乘法部分积”场景里，方案 2 最明显的优势是：它既能让部分积板干净成立，又不会把“除法试商”那套异构布局硬塞回同一个旧组件。',
  'division-trial': '在“简化试商”场景里，方案 2 能把“试商 -> 乘回 -> 相减 -> 落位”做成显式动作，同时保留未来继续长成真正除法板的空间。',
  'long-division-feel': '在“标准长除感”场景里，方案 2 最平衡：它已经有专门的除法板承载转化与试商，但首版又不会直接背上完整长除法版式的成本。',
};

function ToneBadge({ children, tone = 'primary' }: { children: ReactNode; tone?: Tone }) {
  const palette = {
    primary: 'bg-primary-lt text-primary border-primary/30',
    success: 'bg-success-lt text-success border-success/30',
    warning: 'bg-warning-lt text-text border-warning/40',
  } as const;

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black tracking-[0.12em] uppercase ${palette[tone]}`}>
      {children}
    </span>
  );
}

function ScoreBars({ value, tone = 'primary' }: { value: number; tone?: Tone }) {
  const filledClass =
    tone === 'success'
      ? 'bg-success'
      : tone === 'warning'
        ? 'bg-warning'
        : 'bg-primary';

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`h-2 w-7 rounded-full border border-border-2 ${index < value ? filledClass : 'bg-card-2'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="text-[12px] font-black uppercase tracking-[0.18em] text-text-2">{title}</div>
      {subtitle ? <div className="mt-1 text-[13px] font-semibold text-text">{subtitle}</div> : null}
    </div>
  );
}

function LookForPanel({
  title,
  signature,
  recommended = false,
}: {
  title: string;
  signature: string;
  recommended?: boolean;
}) {
  return (
    <div className={`mt-4 rounded-[24px] border-2 p-4 ${recommended ? 'border-primary/35 bg-primary-lt/55' : 'border-warning/35 bg-warning-lt/70'}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-text-2">先看这里</div>
      <div className="mt-2 text-[14px] font-black leading-7 text-text">{title}</div>
      <div className="mt-2 rounded-2xl border border-border bg-white/80 px-3 py-2 text-[12px] font-semibold text-text-2">
        识别信号：{signature}
      </div>
    </div>
  );
}

function MiniCell({
  children,
  tone = 'default',
  compact = false,
}: {
  children?: ReactNode;
  tone?: 'default' | 'accent' | 'subtle' | 'success';
  compact?: boolean;
}) {
  const toneClass = {
    default: 'border-border bg-card text-text',
    accent: 'border-primary bg-primary-lt text-primary',
    subtle: 'border-border-2 bg-card-2 text-text-2',
    success: 'border-success bg-success-lt text-success',
  } as const;

  return (
    <div
      className={`flex items-center justify-center rounded-xl border-2 font-black ${compact ? 'h-9 min-w-[36px] px-2 text-[12px]' : 'h-11 min-w-[42px] px-2 text-[13px]'} ${toneClass[tone]}`}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-2 h-[2px] rounded-full bg-border-2" />;
}

function BoardChrome({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border-2 border-border bg-card p-4 shadow-[0_10px_25px_rgba(0,0,0,0.06)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-black text-text">{title}</div>
          <div className="mt-1 text-[12px] font-semibold text-text-2">{subtitle}</div>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning" />
          <span className="h-2.5 w-2.5 rounded-full bg-success" />
        </div>
      </div>
      {children}
      {footer ? <div className="mt-3 rounded-2xl border border-border-2 bg-card-2 px-3 py-2 text-[12px] font-semibold text-text-2">{footer}</div> : null}
    </div>
  );
}

function MultiplicationBoard({ clean = false, overloaded = false }: { clean?: boolean; overloaded?: boolean }) {
  return (
    <BoardChrome
      title={clean ? 'PartialProductBoard' : 'VerticalCalcBoard'}
      subtitle={clean ? '专用部分积板：主板天然成立，再挂共享协议区' : '一个组件里同时承载进位 / 部分积 / 合计 / mode'}
      footer={clean ? '一眼能分出“主板”和“共享协议”两层。' : '视觉上越像“控制台”，越说明它正在承担过多职责。'}
    >
      <div className={`grid gap-3 ${clean ? 'lg:grid-cols-[1.25fr_0.75fr]' : 'lg:grid-cols-[1.1fr_0.9fr]'}`}>
        <div className={`rounded-[24px] border-2 p-3 ${clean ? 'border-success/30 bg-success-lt/35' : 'border-warning/35 bg-warning-lt/45'}`}>
          {overloaded ? (
            <div className="mb-3 flex flex-wrap gap-2">
              <ToneBadge tone="warning">carry</ToneBadge>
              <ToneBadge>partial</ToneBadge>
              <ToneBadge tone="success">result</ToneBadge>
              <ToneBadge tone="warning">mode=int/partial</ToneBadge>
            </div>
          ) : (
            <div className="mb-3 flex flex-wrap gap-2">
              <ToneBadge tone="success">乘法主板</ToneBadge>
              <ToneBadge>只处理部分积</ToneBadge>
            </div>
          )}

          <div className="space-y-2">
            <div className="grid grid-cols-[66px_repeat(4,minmax(0,1fr))] gap-2">
              <div className="text-[12px] font-black text-text-2">被乘数</div>
              <MiniCell tone="subtle">3</MiniCell>
              <MiniCell tone="subtle">6</MiniCell>
              <MiniCell tone="subtle">{clean ? '' : '.'}</MiniCell>
              <MiniCell tone="subtle" />
            </div>
            <div className="grid grid-cols-[66px_repeat(4,minmax(0,1fr))] gap-2">
              <div className="text-[12px] font-black text-text-2">乘数</div>
              <MiniCell tone="subtle">4</MiniCell>
              <MiniCell tone="subtle">5</MiniCell>
              <MiniCell tone="subtle" />
              <MiniCell tone="subtle" />
            </div>
            <Divider />
            <div className="grid grid-cols-[66px_repeat(4,minmax(0,1fr))] gap-2">
              <div className="text-[12px] font-black text-text-2">个位积</div>
              <MiniCell tone="accent">1</MiniCell>
              <MiniCell tone="accent">8</MiniCell>
              <MiniCell tone="accent">0</MiniCell>
              <MiniCell tone="subtle" />
            </div>
            <div className="grid grid-cols-[66px_repeat(4,minmax(0,1fr))] gap-2">
              <div className="text-[12px] font-black text-text-2">十位积</div>
              <MiniCell tone={clean ? 'accent' : 'success'}>1</MiniCell>
              <MiniCell tone={clean ? 'accent' : 'success'}>4</MiniCell>
              <MiniCell tone={clean ? 'accent' : 'success'}>4</MiniCell>
              <MiniCell tone="subtle">0</MiniCell>
            </div>
            <Divider />
            <div className="grid grid-cols-[66px_repeat(4,minmax(0,1fr))] gap-2">
              <div className="text-[12px] font-black text-text-2">总积</div>
              <MiniCell tone="success">1</MiniCell>
              <MiniCell tone="success">6</MiniCell>
              <MiniCell tone="success">2</MiniCell>
              <MiniCell tone="success">0</MiniCell>
            </div>
          </div>
        </div>

        <div className={`grid gap-3 rounded-[24px] border-2 p-3 ${clean ? 'border-border bg-card-2' : 'border-warning/35 bg-card-2'}`}>
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">
            {clean ? '共享协议区' : '同组件附属区'}
          </div>

          {clean ? (
            <>
              <div className="rounded-2xl border border-border bg-card px-3 py-3">
                <div className="text-[12px] font-black text-text">Shared Input Protocol</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <ToneBadge>focus</ToneBadge>
                  <ToneBadge tone="success">submit</ToneBadge>
                  <ToneBadge tone="warning">feedback</ToneBadge>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card px-3 py-3 text-[12px] font-semibold leading-6 text-text-2">
                这里不碰部分积版式，只负责：键盘输入、格子状态、提交反馈。
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-warning/35 bg-card px-3 py-3">
                <div className="text-[12px] font-black text-text">Mode Stack</div>
                <div className="mt-2 grid gap-2">
                  <div className="rounded-xl border border-border px-2 py-2 text-[12px] font-semibold text-text">standard-board</div>
                  <div className="rounded-xl border border-border px-2 py-2 text-[12px] font-semibold text-text">partial-product</div>
                  <div className="rounded-xl border border-border px-2 py-2 text-[12px] font-semibold text-text">future-division</div>
                </div>
              </div>
              <div className="rounded-2xl border border-warning/35 bg-card px-3 py-3 text-[12px] font-semibold leading-6 text-text-2">
                同一组件里继续叠：小数点、部分积、结果格、未来试商。看起来统一，长期会越叠越重。
              </div>
            </>
          )}
        </div>
      </div>
    </BoardChrome>
  );
}

function OverloadedDivisionBoard({ scenario }: { scenario: ScenarioId }) {
  const isLongFeel = scenario === 'long-division-feel';

  return (
    <BoardChrome
      title="VerticalCalcBoard"
      subtitle={isLongFeel ? '继续把扩倍、小数位、试商和商位都挂在同一板里' : '试商链条也继续压回同一个旧组件'}
      footer={isLongFeel ? '重点看：它几乎像一个“操作台”，而不是清晰分层的专用除法板。' : '重点看：它为了保留单组件，会把除法专属语义继续混回旧板。'}
    >
      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[24px] border-2 border-warning/35 bg-warning-lt/50 p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            <ToneBadge tone="warning">mode=division-trial</ToneBadge>
            {isLongFeel ? <ToneBadge>decimal-shift</ToneBadge> : null}
            <ToneBadge tone="success">quotient-row</ToneBadge>
            <ToneBadge tone="warning">borrow old board shell</ToneBadge>
          </div>
          {isLongFeel ? (
            <div className="mb-3 rounded-2xl border border-primary/30 bg-primary-lt px-3 py-2 text-[12px] font-bold text-primary">
              15.6 ÷ 0.24 → 同倍扩大 → 1560 ÷ 24
            </div>
          ) : null}
          <div className="grid gap-2">
            <div className="grid grid-cols-[62px_repeat(4,minmax(0,1fr))] gap-2">
              <div className="text-[12px] font-black text-text-2">商</div>
              <MiniCell tone="success">6</MiniCell>
              <MiniCell tone="success">{isLongFeel ? '5' : '.'}</MiniCell>
              <MiniCell tone="subtle" />
              <MiniCell tone="subtle" />
            </div>
            <div className="grid grid-cols-[62px_repeat(4,minmax(0,1fr))] gap-2">
              <div className="text-[12px] font-black text-text-2">试商</div>
              <MiniCell tone="accent">6</MiniCell>
              <MiniCell tone="accent">×24</MiniCell>
              <MiniCell tone="subtle">=144</MiniCell>
              <MiniCell tone="subtle" />
            </div>
            <div className="grid grid-cols-[62px_repeat(4,minmax(0,1fr))] gap-2">
              <div className="text-[12px] font-black text-text-2">相减</div>
              <MiniCell tone="accent">156</MiniCell>
              <MiniCell tone="accent">-144</MiniCell>
              <MiniCell tone="accent">12</MiniCell>
              <MiniCell tone="subtle" />
            </div>
            <div className="grid grid-cols-[62px_repeat(4,minmax(0,1fr))] gap-2">
              <div className="text-[12px] font-black text-text-2">落位</div>
              <MiniCell tone="subtle">→</MiniCell>
              <MiniCell tone="subtle">{isLongFeel ? '120' : '继续'}</MiniCell>
              <MiniCell tone="subtle">{isLongFeel ? '再试商' : ''}</MiniCell>
              <MiniCell tone="subtle" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-[24px] border-2 border-warning/35 bg-card-2 p-3">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">组件控制面</div>
          <div className="rounded-2xl border border-border bg-card px-3 py-3">
            <div className="text-[12px] font-black text-text">State switches</div>
            <div className="mt-2 grid gap-2">
              <div className="rounded-xl border border-border px-2 py-2 text-[12px] font-semibold text-text">show quotient row</div>
              <div className="rounded-xl border border-border px-2 py-2 text-[12px] font-semibold text-text">enable decimal shift</div>
              <div className="rounded-xl border border-border px-2 py-2 text-[12px] font-semibold text-text">enable trial loop</div>
            </div>
          </div>
          <div className="rounded-2xl border border-warning/35 bg-card px-3 py-3 text-[12px] font-semibold leading-6 text-text-2">
            你现在看到的不是“除法专板”，而是“旧板 + 越来越多开关”。这就是方案 1 应该一眼传达的感觉。
          </div>
        </div>
      </div>
    </BoardChrome>
  );
}

function DedicatedDivisionBoard({ longFeel = false }: { longFeel?: boolean }) {
  return (
    <BoardChrome
      title="DivisionTrialBoard"
      subtitle={longFeel ? '专用除法板：主板负责长除感，右侧只挂动作链' : '专用除法板：主板负责版式，动作链负责显式思维步骤'}
      footer={longFeel ? '重点看：它已经有专门承接“长除感”的外形骨架。' : '重点看：主板与动作链清楚分开，但仍然属于同一种语言。'}
    >
      {longFeel ? (
        <div className="mb-3 rounded-2xl border border-primary/30 bg-primary-lt px-3 py-2 text-[12px] font-bold text-primary">
          转化带：15.6 ÷ 0.24 → 1560 ÷ 24
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border-2 bg-card-2 p-3">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">主视图</div>
          <div className="mt-2 grid grid-cols-[54px_repeat(3,minmax(0,1fr))] gap-2">
            <div className="text-[12px] font-black text-text-2">商位</div>
            <MiniCell tone="success">6</MiniCell>
            <MiniCell tone="subtle">{longFeel ? '5' : ''}</MiniCell>
            <MiniCell tone="subtle" />
            <div className="text-[12px] font-black text-text-2">被除数</div>
            <MiniCell tone="subtle">{longFeel ? '1560' : '156'}</MiniCell>
            <MiniCell tone="subtle" />
            <MiniCell tone="subtle">{longFeel ? '÷24' : '÷24'}</MiniCell>
          </div>
        </div>
        <div className="rounded-2xl border border-border-2 bg-card-2 p-3">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">动作链</div>
          <div className="mt-2 grid gap-2">
            <div className="grid grid-cols-[44px_1fr] gap-2">
              <MiniCell compact tone="accent">1</MiniCell>
              <MiniCell tone="accent">试商 6</MiniCell>
            </div>
            <div className="grid grid-cols-[44px_1fr] gap-2">
              <MiniCell compact tone="accent">2</MiniCell>
              <MiniCell tone="accent">6 × 24 = 144</MiniCell>
            </div>
            <div className="grid grid-cols-[44px_1fr] gap-2">
              <MiniCell compact tone="accent">3</MiniCell>
              <MiniCell tone="accent">156 - 144 = 12</MiniCell>
            </div>
            <div className="grid grid-cols-[44px_1fr] gap-2">
              <MiniCell compact tone="success">4</MiniCell>
              <MiniCell tone="success">{longFeel ? '补 0 继续：120' : '落下一位继续'}</MiniCell>
            </div>
          </div>
        </div>
      </div>
    </BoardChrome>
  );
}

function GuidedDivisionFlow({ longFeel = false }: { longFeel?: boolean }) {
  return (
    <BoardChrome
      title="DivisionGuideFlow"
      subtitle={longFeel ? '明显更像步骤引导器，而不是专门的长除板' : '明显分成“答数区”和“流程卡”，骨架已经不再像板'}
      footer={longFeel ? '重点看：它已经彻底改走“流程器”路线，后续若要像长除板，仍需再做一次重构。' : '重点看：它故意不做成板，所以和方案 1/2 的骨架差异应该最大。'}
    >
      <div className="rounded-2xl border border-border-2 bg-card-2 p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">答数区</div>
        <div className="mt-2 flex gap-2">
          <MiniCell tone="success">答案</MiniCell>
          <MiniCell tone="success">{longFeel ? '65' : '6.5'}</MiniCell>
          <MiniCell tone="subtle">提交</MiniCell>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {[
          longFeel ? '先把除数变成整数：15.6 ÷ 0.24 → 1560 ÷ 24' : '先看 156 ÷ 24，首位试商 6',
          '乘回去，检查 6 × 24 = 144',
          '相减得到 12，再决定是否继续',
          longFeel ? '补 0 继续，直到达到需要的精度' : '如果还没结束，再落下一位继续',
        ].map((text, index) => (
          <div key={text} className="grid grid-cols-[44px_1fr] gap-2">
            <MiniCell compact tone={index === 3 ? 'success' : 'accent'}>{index + 1}</MiniCell>
            <div className="rounded-2xl border-2 border-border bg-card px-3 py-2 text-[12px] font-semibold text-text">
              {text}
            </div>
          </div>
        ))}
      </div>
    </BoardChrome>
  );
}

function PrototypePreview({ schemeId, scenarioId }: { schemeId: SchemeId; scenarioId: ScenarioId }) {
  if (scenarioId === 'partial-product') {
    if (schemeId === 'overloaded-board') return <MultiplicationBoard overloaded />;
    if (schemeId === 'split-boards') return <MultiplicationBoard clean />;
    return (
      <BoardChrome
        title="PartialProductBoard + GuideFlow"
        subtitle="乘法像板，但旁边已经出现流程卡语言"
        footer="重点看：这个方案的乘法侧很好看，但它已经隐含“除法不一定继续做成板”的分流。"
      >
        <div className="grid gap-3">
          <div className="rounded-[24px] border-2 border-success/30 bg-success-lt/35 p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              <ToneBadge tone="success">乘法专板</ToneBadge>
              <ToneBadge>只服务部分积</ToneBadge>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[66px_repeat(4,minmax(0,1fr))] gap-2">
                <div className="text-[12px] font-black text-text-2">被乘数</div>
                <MiniCell tone="subtle">3</MiniCell>
                <MiniCell tone="subtle">6</MiniCell>
                <MiniCell tone="subtle" />
                <MiniCell tone="subtle" />
              </div>
              <div className="grid grid-cols-[66px_repeat(4,minmax(0,1fr))] gap-2">
                <div className="text-[12px] font-black text-text-2">乘数</div>
                <MiniCell tone="subtle">4</MiniCell>
                <MiniCell tone="subtle">5</MiniCell>
                <MiniCell tone="subtle" />
                <MiniCell tone="subtle" />
              </div>
              <Divider />
              <div className="grid grid-cols-[66px_repeat(4,minmax(0,1fr))] gap-2">
                <div className="text-[12px] font-black text-text-2">部分积 A</div>
                <MiniCell tone="accent">1</MiniCell>
                <MiniCell tone="accent">8</MiniCell>
                <MiniCell tone="accent">0</MiniCell>
                <MiniCell tone="subtle" />
              </div>
              <div className="grid grid-cols-[66px_repeat(4,minmax(0,1fr))] gap-2">
                <div className="text-[12px] font-black text-text-2">部分积 B</div>
                <MiniCell tone="accent">1</MiniCell>
                <MiniCell tone="accent">4</MiniCell>
                <MiniCell tone="accent">4</MiniCell>
                <MiniCell tone="subtle">0</MiniCell>
              </div>
              <Divider />
              <div className="grid grid-cols-[66px_repeat(4,minmax(0,1fr))] gap-2">
                <div className="text-[12px] font-black text-text-2">总积</div>
                <MiniCell tone="success">1</MiniCell>
                <MiniCell tone="success">6</MiniCell>
                <MiniCell tone="success">2</MiniCell>
                <MiniCell tone="success">0</MiniCell>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border-2 border-border bg-card-2 p-3">
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">另一半交互语言</div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[0.72fr_1.28fr]">
              <div className="rounded-2xl border border-border bg-card px-3 py-3">
                <div className="text-[12px] font-black text-text">答数区</div>
                <div className="mt-2 flex gap-2">
                  <MiniCell tone="success">1620</MiniCell>
                  <MiniCell tone="subtle">提交</MiniCell>
                </div>
              </div>
              <div className="grid gap-2">
                {['先看个位积 36×5', '再看十位积 36×4', '最后把两行结果相加'].map((text, index) => (
                  <div key={text} className="grid grid-cols-[40px_1fr] gap-2">
                    <MiniCell compact tone={index === 2 ? 'success' : 'accent'}>{index + 1}</MiniCell>
                    <div className="rounded-2xl border border-border bg-card px-3 py-2 text-[12px] font-semibold text-text">{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </BoardChrome>
    );
  }

  if (scenarioId === 'division-trial') {
    if (schemeId === 'overloaded-board') return <OverloadedDivisionBoard scenario={scenarioId} />;
    if (schemeId === 'split-boards') return <DedicatedDivisionBoard />;
    return <GuidedDivisionFlow />;
  }

  if (schemeId === 'overloaded-board') return <OverloadedDivisionBoard scenario={scenarioId} />;
  if (schemeId === 'split-boards') return <DedicatedDivisionBoard longFeel />;
  return <GuidedDivisionFlow longFeel />;
}

export default function A03PlusComparisonPreview() {
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>('partial-product');

  useEffect(() => {
    document.title = 'A03+ 三方案对比预览';
  }, []);

  const activeScenario = useMemo(
    () => SCENARIOS.find(scenario => scenario.id === activeScenarioId) ?? SCENARIOS[0],
    [activeScenarioId],
  );

  return (
    <div
      className="min-h-dvh bg-bg text-text"
      style={{
        backgroundImage: `
          radial-gradient(circle at top left, rgba(255,107,53,0.14), transparent 24%),
          radial-gradient(circle at top right, rgba(255,212,59,0.16), transparent 22%),
          linear-gradient(to bottom, rgba(255,255,255,0.88), rgba(255,248,243,1))
        `,
      }}
    >
      <div className="mx-auto max-w-[1580px] px-4 py-6 sm:px-6 lg:px-8">
        <section
          className="relative overflow-hidden rounded-[32px] border-2 border-border bg-card px-5 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] sm:px-7"
          style={{
            backgroundImage: `
              linear-gradient(0deg, rgba(255,255,255,0.92), rgba(255,255,255,0.92)),
              repeating-linear-gradient(90deg, rgba(255,240,235,0.9) 0 1px, transparent 1px 28px),
              repeating-linear-gradient(0deg, rgba(255,240,235,0.7) 0 1px, transparent 1px 28px)
            `,
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <ToneBadge>dev-only prototype board</ToneBadge>
            <ToneBadge tone="success">当前推荐：方案 2</ToneBadge>
            <ToneBadge tone="warning">入口：`/?preview=a03plus`</ToneBadge>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-primary">A03+ Preview</p>
              <h1 className="mt-2 text-[30px] font-black leading-tight text-text sm:text-[40px]">
                A03 块 B Plus
                <br />
                三方案对比预览页
              </h1>
              <p className="mt-3 max-w-3xl text-[15px] font-semibold leading-7 text-text-2">
                用同一组 A03+ 核心场景，横向比较三个实现方向在“学生看到什么”和“工程会承担什么”上的差异。
                这不是最终业务页，而是一张专门帮你做架构判断的本地预览板。
              </p>
            </div>

            <div className="grid gap-3 self-start rounded-[28px] border-2 border-border bg-card-2 p-4">
              <div>
                <div className="text-[12px] font-black uppercase tracking-[0.16em] text-text-2">决策摘要</div>
                <div className="mt-2 text-[14px] font-bold leading-7 text-text">
                  这页要回答的问题只有一个：
                  <span className="text-primary"> 哪个方案最适合先承接 A03+ 的“部分积 + 试商”双目标？</span>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card px-3 py-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">你现在看什么</div>
                  <div className="mt-2 text-[14px] font-black text-text">{activeScenario.label}</div>
                  <div className="mt-1 text-[12px] font-semibold text-text-2">{activeScenario.prompt}</div>
                </div>
                <div className="rounded-2xl border border-border bg-card px-3 py-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">我在帮你判断什么</div>
                  <div className="mt-2 text-[14px] font-black text-text">学生视角 + 工程视角</div>
                  <div className="mt-1 text-[12px] font-semibold text-text-2">是否值得进入正式规格。</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sticky top-3 z-10 mt-5 rounded-[28px] border-2 border-border bg-card/90 p-4 shadow-[0_16px_34px_rgba(0,0,0,0.06)] backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[12px] font-black uppercase tracking-[0.16em] text-text-2">场景切换</div>
              <div className="mt-1 text-[14px] font-bold text-text">{activeScenario.summary}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((scenario) => {
                const active = scenario.id === activeScenarioId;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setActiveScenarioId(scenario.id)}
                    className={`rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                      active
                        ? 'border-primary bg-primary-lt text-primary shadow-[0_8px_18px_rgba(255,107,53,0.16)]'
                        : 'border-border bg-card-2 text-text hover:border-primary/40 hover:bg-primary-lt/40'
                    }`}
                  >
                    <div className="text-[13px] font-black">{scenario.label}</div>
                    <div className={`mt-1 text-[11px] font-semibold ${active ? 'text-primary' : 'text-text-2'}`}>
                      {scenario.prompt}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-border-2 bg-card-2 px-3 py-2 text-[12px] font-semibold text-text-2">
            {activeScenario.focus}
          </div>
          <div className="mt-3 grid gap-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-warning/35 bg-warning-lt/70 px-3 py-2">
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">方案 1 一眼信号</div>
              <div className="mt-1 text-[12px] font-semibold text-text">看它是不是像一个“什么都往里塞的巨石操作台”。</div>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary-lt/55 px-3 py-2">
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">方案 2 一眼信号</div>
              <div className="mt-1 text-[12px] font-semibold text-text">看它是否明显分成“主板”和“共享协议 / 动作链”。</div>
            </div>
            <div className="rounded-2xl border border-success/30 bg-success-lt px-3 py-2">
              <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">方案 3 一眼信号</div>
              <div className="mt-1 text-[12px] font-semibold text-text">看它是不是已经改走“答数区 + 步骤卡流”的流程器路线。</div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-3">
          {SCHEMES.map((scheme) => {
            const teachingTone: Tone = scheme.recommended ? 'success' : scheme.id === 'overloaded-board' ? 'warning' : 'primary';

            return (
              <article
                key={scheme.id}
                className={`flex h-full flex-col rounded-[30px] border-2 p-5 shadow-[0_18px_36px_rgba(0,0,0,0.06)] ${
                  scheme.recommended
                    ? 'border-primary bg-white'
                    : scheme.id === 'overloaded-board'
                      ? 'border-warning/35 bg-warning-lt/35'
                      : 'border-success/30 bg-success-lt/25'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-black uppercase tracking-[0.16em] text-text-2">{scheme.shortLabel}</div>
                    <h2 className="mt-1 text-[23px] font-black text-text">{scheme.label}</h2>
                  </div>
                  {scheme.recommended ? <ToneBadge tone="success">recommended</ToneBadge> : null}
                </div>

                <p className="mt-3 text-[14px] font-semibold leading-7 text-text-2">{scheme.pitch}</p>

                <LookForPanel
                  title={scheme.lookFor}
                  signature={scheme.signature}
                  recommended={scheme.recommended}
                />

                <div className="mt-4 grid gap-3 rounded-[24px] border border-border-2 bg-card-2 p-4">
                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">工程复杂度</div>
                      <div className="mt-2"><ScoreBars value={scheme.complexity} tone="warning" /></div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">教学还原</div>
                      <div className="mt-2"><ScoreBars value={scheme.teaching} tone={teachingTone} /></div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">后续扩展</div>
                      <div className="mt-2"><ScoreBars value={scheme.extensibility} tone="primary" /></div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex-1">
                  <SectionTitle title="学生视角预览" subtitle={`当前场景：${activeScenario.label} · ${activeScenario.prompt}`} />
                  <PrototypePreview schemeId={scheme.id} scenarioId={activeScenario.id} />
                </div>

                <div className="mt-5 grid gap-4">
                  <div className="rounded-[24px] border border-border-2 bg-card-2 p-4">
                    <SectionTitle title="工程视角" subtitle="如果真按这条线推进，代码结构大概会变成这样" />
                    <div className="flex flex-wrap gap-2">
                      {scheme.implementation.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-border bg-card px-3 py-2 text-[12px] font-semibold text-text"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-border-2 bg-card-2 p-4">
                    <SectionTitle title="优势" subtitle="为什么这个方案会吸引人" />
                    <ul className="grid gap-2">
                      {scheme.strengths.map((item) => (
                        <li key={item} className="rounded-2xl border border-border bg-card px-3 py-2 text-[12px] font-semibold leading-6 text-text">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`rounded-[24px] border p-4 ${scheme.recommended ? 'border-primary/30 bg-primary-lt/55' : 'border-warning/35 bg-warning-lt'}`}>
                    <div className="text-[11px] font-black uppercase tracking-[0.14em] text-text-2">关键提醒</div>
                    <p className="mt-2 text-[13px] font-bold leading-7 text-text">{scheme.caution}</p>
                    <p className="mt-2 text-[12px] font-semibold leading-6 text-text-2">{scheme.verdict}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 rounded-[30px] border-2 border-primary/20 bg-card p-5 shadow-[0_18px_36px_rgba(255,107,53,0.08)]">
          <div className="flex flex-wrap items-center gap-3">
            <ToneBadge tone="success">why scheme 2</ToneBadge>
            <div className="text-[22px] font-black text-text">为什么我当前推荐“方案 2”</div>
          </div>
          <p className="mt-3 max-w-5xl text-[15px] font-semibold leading-8 text-text-2">
            {RECOMMENDATION_COPY[activeScenario.id]}
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="rounded-[24px] border border-border-2 bg-card-2 p-4">
              <div className="text-[12px] font-black uppercase tracking-[0.14em] text-text-2">对学生</div>
              <div className="mt-2 text-[14px] font-bold leading-7 text-text">
                不会把乘法与除法混成一块，学生更容易形成稳定的竖式心智模型。
              </div>
            </div>
            <div className="rounded-[24px] border border-border-2 bg-card-2 p-4">
              <div className="text-[12px] font-black uppercase tracking-[0.14em] text-text-2">对实现</div>
              <div className="mt-2 text-[14px] font-bold leading-7 text-text">
                共享输入协议而不是共享一个超级组件，长期维护成本最低。
              </div>
            </div>
            <div className="rounded-[24px] border border-border-2 bg-card-2 p-4">
              <div className="text-[12px] font-black uppercase tracking-[0.14em] text-text-2">对后续规格</div>
              <div className="mt-2 text-[14px] font-bold leading-7 text-text">
                最容易直接转写成 A03+ 正式 Specs，不会因为首版偷懒把未来锁死。
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
