#!/usr/bin/env node
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const Module = require('node:module');
const { createJiti } = require('jiti');
const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveProjectAlias(request, parent, isMain, options) {
  if (typeof request === 'string' && request.startsWith('@/')) {
    const mapped = path.join(rootDir, 'src', request.slice(2));
    return originalResolveFilename.call(this, mapped, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const jiti = createJiti(fileURLToPath(import.meta.url), { interopDefault: true });

const { generateQuestion } = jiti('../src/engine/index.ts');
const { buildAdvanceSlots } = jiti('../src/engine/advance.ts');
const { pickQuestionsForGame } = jiti('../src/engine/rank-match/question-picker.ts');
const { DEDUPE_RETRY_LIMIT, getDuplicateSignature } = jiti('../src/engine/question-dedupe.ts');
const { CAMPAIGN_MAPS } = jiti('../src/constants/campaign.ts');
const { PLAYER_TOPICS } = jiti('../src/constants/index.ts');
const { RANK_BEST_OF } = jiti('../src/constants/rank-match.ts');

const SEED = 20260425;
const A03_MUL_SAMPLE = 500;
const OPTION_SAMPLE_PER_BUCKET = 250;
const CAMPAIGN_SESSIONS_PER_LEVEL = 30;
const ADVANCE_SESSIONS = 80;
const RANK_GAMES_PER_TIER = 30;

function mulberry32(seed) {
  return function nextRandom() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function digitsOf(value) {
  const n = Math.trunc(Math.abs(Number(value)));
  return String(n).length;
}

function getOptions(question) {
  const options = question?.data?.options;
  return Array.isArray(options) ? options : [];
}

function getSubtypeLabel(question) {
  const data = question?.data ?? {};
  return data.subtype ?? data.knowledgePoint ?? data.kind ?? 'unknown';
}

function summarizeDuplicateSession(questions) {
  const seen = new Map();
  for (const q of questions) {
    const sig = getDuplicateSignature(q);
    seen.set(sig, (seen.get(sig) ?? 0) + 1);
  }
  let duplicateItems = 0;
  let duplicateExtra = 0;
  let example = '';
  for (const [sig, count] of seen) {
    if (count <= 1) continue;
    duplicateItems++;
    duplicateExtra += count - 1;
    if (!example) example = sig.split('::')[2] ?? sig;
  }
  return { duplicateItems, duplicateExtra, example };
}

function acceptOrRetry(firstQuestion, generateMore, seen, context) {
  let question = firstQuestion;
  let signature = getDuplicateSignature(question);
  if (!seen.has(signature)) {
    seen.add(signature);
    return { question, retryExhausted: false };
  }

  for (let retryCount = 1; retryCount <= DEDUPE_RETRY_LIMIT; retryCount++) {
    question = generateMore();
    signature = getDuplicateSignature(question);
    if (!seen.has(signature)) {
      seen.add(signature);
      return { question, retryExhausted: false };
    }
  }

  return { question, retryExhausted: true, context };
}

function classifyVerticalMultiplication(question) {
  const data = question.data;
  if (data?.kind !== 'vertical-calc' || data.operation !== '×') return null;
  const [a, b] = data.operands ?? [];
  if (typeof a !== 'number' || typeof b !== 'number') return 'unknown';
  return `${digitsOf(a)}d×${digitsOf(b)}d`;
}

function classifyVerticalDivision(question) {
  const data = question.data;
  if (data?.kind !== 'vertical-calc' || data.operation !== '÷') return null;
  const [a, b] = data.operands ?? [];
  if (typeof a !== 'number' || typeof b !== 'number') {
    return { shortCandidate: false, label: 'unknown' };
  }
  return {
    shortCandidate: Number.isInteger(a)
      && Number.isInteger(b)
      && digitsOf(a) === 2
      && digitsOf(b) === 1,
    label: `${a} ÷ ${b}`,
  };
}

function sampleA03MultiplicationDistribution() {
  const rows = [];
  for (const difficulty of [4, 5]) {
    const counts = new Map();
    let withBoard = 0;
    const examples = [];
    for (let i = 0; i < A03_MUL_SAMPLE; i++) {
      const q = generateQuestion('vertical-calc', difficulty, ['int-mul']);
      const shape = classifyVerticalMultiplication(q) ?? 'not-mul';
      counts.set(shape, (counts.get(shape) ?? 0) + 1);
      if (q.data?.multiplicationBoard) withBoard++;
      if (examples.length < 5) examples.push(q.prompt.replace('用竖式计算: ', ''));
    }
    rows.push({ difficulty, counts, withBoard, examples });
  }
  return rows;
}

function sampleA03AdvanceDivisions() {
  let totalQuestions = 0;
  let divisionQuestions = 0;
  let shortDivisionCandidates = 0;
  const examples = [];

  for (let session = 0; session < ADVANCE_SESSIONS; session++) {
    const slots = buildAdvanceSlots('vertical-calc', 38);
    for (const slot of slots) {
      totalQuestions++;
      const q = generateQuestion('vertical-calc', slot.difficulty, [slot.subtypeTag]);
      const division = classifyVerticalDivision(q);
      if (!division) continue;
      divisionQuestions++;
      if (division.shortCandidate) {
        shortDivisionCandidates++;
        if (examples.length < 8) examples.push(division.label);
      }
    }
  }

  return { totalQuestions, divisionQuestions, shortDivisionCandidates, examples };
}

function sampleOptionIssues() {
  const visibleTopicIds = PLAYER_TOPICS.map(topic => topic.id);
  const issues = [];
  const summary = new Map();

  for (const topicId of visibleTopicIds) {
    for (const difficulty of [2, 4, 6, 8]) {
      for (let i = 0; i < OPTION_SAMPLE_PER_BUCKET; i++) {
        const q = generateQuestion(topicId, difficulty);
        const options = getOptions(q);
        const hasTwoChoiceShape = q.type === 'true-false' || (options.length > 0 && options.length < 3);
        const isAcceptedA02CompareJudge = topicId === 'number-sense'
          && difficulty >= 8
          && getSubtypeLabel(q) === 'compare'
          && options.length === 2
          && options[0] === '对'
          && options[1] === '错';
        const key = `${topicId} d=${difficulty}`;
        const entry = summary.get(key) ?? { total: 0, optionQuestions: 0, twoChoice: 0 };
        entry.total++;
        if (options.length > 0 || q.type === 'true-false') entry.optionQuestions++;
        if (hasTwoChoiceShape && !isAcceptedA02CompareJudge) {
          entry.twoChoice++;
          if (issues.length < 20) {
            issues.push({
              topicId,
              difficulty,
              type: q.type,
              subtype: getSubtypeLabel(q),
              optionCount: q.type === 'true-false' ? 2 : options.length,
              prompt: q.prompt,
            });
          }
        }
        summary.set(key, entry);
      }
    }
  }

  return { summary, issues };
}

function classifyCompareAdvanced(question) {
  const explanation = String(question?.solution?.explanation ?? '');
  if (explanation.includes('等价')) return 'equivalent-transform';
  if (explanation.includes('整体倍率')) return 'net-multiplier';
  if (explanation.includes('合并')) return 'combine-like-terms';
  return 'unknown';
}

function sampleA02CompareQuality() {
  const d7Patterns = new Map();
  const d7Answers = new Map();
  for (let i = 0; i < OPTION_SAMPLE_PER_BUCKET; i++) {
    const q = generateQuestion('number-sense', 7, ['compare']);
    const pattern = classifyCompareAdvanced(q);
    d7Patterns.set(pattern, (d7Patterns.get(pattern) ?? 0) + 1);
    const answer = String(q.solution.answer);
    d7Answers.set(answer, (d7Answers.get(answer) ?? 0) + 1);
  }

  const d8Statements = new Set();
  let d8SingleChoice = 0;
  let d8Truth = 0;
  let d8False = 0;
  let d8ExplanationOk = 0;
  const examples = [];
  for (let i = 0; i < OPTION_SAMPLE_PER_BUCKET * 2; i++) {
    const q = generateQuestion('number-sense', 8, ['compare']);
    const options = getOptions(q);
    if (q.type !== 'multiple-choice' || options.join('|') !== '对|错') continue;
    d8SingleChoice++;
    if (String(q.solution.answer) === '对') d8Truth++;
    if (String(q.solution.answer) === '错') d8False++;
    const promptMatch = q.prompt.match(/判断正误："(.+)"$/);
    if (promptMatch) d8Statements.add(promptMatch[1]);
    const explanation = String(q.solution.explanation ?? '');
    if (/规则|反例|条件|边界|因为|当|如果|必须|不能|非零/.test(explanation)) {
      d8ExplanationOk++;
    }
    if (examples.length < 6) examples.push(`${q.prompt} -> ${q.solution.answer}：${explanation}`);
  }

  return {
    d7Patterns,
    d7Answers,
    d8SingleChoice,
    d8UniqueStatements: d8Statements.size,
    d8Truth,
    d8False,
    d8ExplanationOk,
    examples,
  };
}

function sampleCampaignDuplicates() {
  const visibleTopicIds = PLAYER_TOPICS.map(topic => topic.id);
  const rows = [];

  for (const topicId of visibleTopicIds) {
    const map = CAMPAIGN_MAPS[topicId];
    if (!map) continue;
    for (const stage of map.stages) {
      for (const lane of stage.lanes) {
        for (const level of lane.levels) {
          let sessionsWithDuplicates = 0;
          let duplicateExtraTotal = 0;
          let retrySessionsWithDuplicates = 0;
          let retryDuplicateExtraTotal = 0;
          let retryExhausted = 0;
          let example = '';
          for (let session = 0; session < CAMPAIGN_SESSIONS_PER_LEVEL; session++) {
            const questions = [];
            const retryQuestions = [];
            const retrySeen = new Set();
            for (let i = 0; i < level.questionCount; i++) {
              const first = generateQuestion(topicId, level.difficulty, lane.subtypeFilter);
              questions.push(first);
              const retry = acceptOrRetry(
                first,
                () => generateQuestion(topicId, level.difficulty, lane.subtypeFilter),
                retrySeen,
                {
                  sessionMode: 'campaign',
                  topicId,
                  difficulty: level.difficulty,
                  subtypeTag: lane.subtypeFilter?.join('|'),
                },
              );
              retryQuestions.push(retry.question);
              if (retry.retryExhausted) retryExhausted++;
            }
            const dup = summarizeDuplicateSession(questions);
            const retryDup = summarizeDuplicateSession(retryQuestions);
            if (dup.duplicateExtra > 0) {
              sessionsWithDuplicates++;
              duplicateExtraTotal += dup.duplicateExtra;
              if (!example) example = dup.example;
            }
            if (retryDup.duplicateExtra > 0) {
              retrySessionsWithDuplicates++;
              retryDuplicateExtraTotal += retryDup.duplicateExtra;
            }
          }
          if (sessionsWithDuplicates > 0) {
            rows.push({
              topicId,
              levelId: level.levelId,
              sessionsWithDuplicates,
              baselineAvgDuplicateExtra: duplicateExtraTotal / CAMPAIGN_SESSIONS_PER_LEVEL,
              retrySessionsWithDuplicates,
              simulatedRetryAvgDuplicateExtra: retryDuplicateExtraTotal / CAMPAIGN_SESSIONS_PER_LEVEL,
              retryExhausted,
              example,
            });
          }
        }
      }
    }
  }

  rows.sort((a, b) => b.sessionsWithDuplicates - a.sessionsWithDuplicates || b.baselineAvgDuplicateExtra - a.baselineAvgDuplicateExtra);
  return rows;
}

function makeRankSession(tier, gameIndex) {
  const bestOf = RANK_BEST_OF[tier];
  const winsToAdvance = Math.floor(bestOf / 2) + 1;
  const games = [];
  for (let i = 1; i < gameIndex; i++) {
    games.push({
      gameIndex: i,
      finished: true,
      won: true,
      practiceSessionId: `diagnostic-${tier}-${i}`,
      startedAt: 0,
      endedAt: 1,
    });
  }
  games.push({
    gameIndex,
    finished: false,
    practiceSessionId: `diagnostic-${tier}-${gameIndex}`,
    startedAt: 0,
  });
  return {
    id: `diagnostic-${tier}-${gameIndex}`,
    userId: 'diagnostic-user',
    targetTier: tier,
    bestOf,
    winsToAdvance,
    games,
    status: 'active',
    startedAt: 0,
  };
}

function sampleRankDuplicates() {
  const advanceProgress = Object.fromEntries(
    PLAYER_TOPICS.map(topic => [topic.id, {
      topicId: topic.id,
      heartsAccumulated: 999,
      sessionsPlayed: 0,
      sessionsWhite: 0,
      unlockedAt: 0,
    }]),
  );
  const rows = [];
  for (const tier of ['rookie', 'pro', 'expert', 'master']) {
    let sessionsWithDuplicates = 0;
    let duplicateExtraTotal = 0;
    let example = '';
    const bestOf = RANK_BEST_OF[tier];
    for (let i = 0; i < RANK_GAMES_PER_TIER; i++) {
      const gameIndex = (i % bestOf) + 1;
      const session = makeRankSession(tier, gameIndex);
      const { questions } = pickQuestionsForGame({ session, gameIndex, advanceProgress, wrongQuestions: [] });
      const dup = summarizeDuplicateSession(questions);
      if (dup.duplicateExtra > 0) {
        sessionsWithDuplicates++;
        duplicateExtraTotal += dup.duplicateExtra;
        if (!example) example = dup.example;
      }
    }
    rows.push({
      tier,
      sessionsWithDuplicates,
      avgDuplicateExtra: duplicateExtraTotal / RANK_GAMES_PER_TIER,
      example,
    });
  }
  return rows;
}

function printA03Multiplication(rows) {
  console.log('\n## A03 multiplication distribution');
  for (const row of rows) {
    const countText = [...row.counts.entries()]
      .map(([shape, count]) => `${shape}: ${count}`)
      .join(', ');
    console.log(`- d=${row.difficulty}: ${countText}; multiplicationBoard=${row.withBoard}/${A03_MUL_SAMPLE}; examples=${row.examples.join(' / ')}`);
  }
}

function printA03Advance(result) {
  console.log('\n## A03 advance 3-star division sample');
  console.log(`- totalQuestions=${result.totalQuestions}`);
  console.log(`- divisionQuestions=${result.divisionQuestions}`);
  console.log(`- shortDivisionCandidates=${result.shortDivisionCandidates}`);
  console.log(`- examples=${result.examples.join(' / ') || 'N/A'}`);
}

function printOptions(result) {
  console.log('\n## Two-choice option candidates (excluding accepted A02 compare judges)');
  for (const [key, value] of result.summary.entries()) {
    if (value.twoChoice === 0) continue;
    console.log(`- ${key}: ${value.twoChoice}/${value.optionQuestions} option questions are two-choice candidates`);
  }
  if (result.issues.length === 0) {
    console.log('- none');
    return;
  }
  console.log('\n### Examples');
  for (const issue of result.issues.slice(0, 10)) {
    console.log(`- ${issue.topicId} d=${issue.difficulty} ${issue.subtype} ${issue.type} options=${issue.optionCount}: ${issue.prompt}`);
  }
}

function printA02CompareQuality(result) {
  console.log('\n## A02 compare quality summary');
  console.log(`- d=7 patterns: ${[...result.d7Patterns.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`- d=7 answers: ${[...result.d7Answers.entries()].map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`- d=8 single-choice samples=${result.d8SingleChoice}, uniqueStatements=${result.d8UniqueStatements}, 对=${result.d8Truth}, 错=${result.d8False}, explanationOk=${result.d8ExplanationOk}/${result.d8SingleChoice}`);
  for (const example of result.examples) {
    console.log(`  - ${example}`);
  }
}

function printCampaignDuplicates(rows) {
  console.log('\n## Campaign duplicate hotspots (baseline vs simulated retry)');
  if (rows.length === 0) {
    console.log('- none');
    return;
  }
  for (const row of rows.slice(0, 12)) {
    const absoluteDrop = row.baselineAvgDuplicateExtra - row.simulatedRetryAvgDuplicateExtra;
    const relativeDrop = row.baselineAvgDuplicateExtra > 0
      ? absoluteDrop / row.baselineAvgDuplicateExtra
      : 0;
    console.log(`- ${row.levelId}: baseline=${row.sessionsWithDuplicates}/${CAMPAIGN_SESSIONS_PER_LEVEL} avgExtra=${row.baselineAvgDuplicateExtra.toFixed(2)}; simulatedRetry=${row.retrySessionsWithDuplicates}/${CAMPAIGN_SESSIONS_PER_LEVEL} avgExtra=${row.simulatedRetryAvgDuplicateExtra.toFixed(2)}; absoluteDrop=${absoluteDrop.toFixed(2)}; relativeDrop=${(relativeDrop * 100).toFixed(1)}%; retryExhausted=${row.retryExhausted}; example=${row.example}`);
  }
}

function printRankDuplicates(rows) {
  console.log('\n## Rank match duplicate summary (production retry)');
  for (const row of rows) {
    console.log(`- ${row.tier}: ${row.sessionsWithDuplicates}/${RANK_GAMES_PER_TIER} games, avgExtra=${row.avgDuplicateExtra.toFixed(2)}, example=${row.example || 'N/A'}`);
  }
}

function main() {
  const originalRandom = Math.random;
  Math.random = mulberry32(SEED);
  try {
    console.log(`# Phase 3 question quality diagnostic`);
    console.log(`seed=${SEED}`);
    console.log(`generatedAt=${new Date().toISOString()}`);
    printA03Multiplication(sampleA03MultiplicationDistribution());
    printA03Advance(sampleA03AdvanceDivisions());
    printOptions(sampleOptionIssues());
    printA02CompareQuality(sampleA02CompareQuality());
    printCampaignDuplicates(sampleCampaignDuplicates());
    printRankDuplicates(sampleRankDuplicates());
  } finally {
    Math.random = originalRandom;
  }
}

main();
