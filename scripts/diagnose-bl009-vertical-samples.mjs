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
const { getSubtypeEntries } = jiti('../src/engine/generators/vertical-calc.ts');
const { CAMPAIGN_MAPS } = jiti('../src/constants/campaign.ts');

const SEED = 20260428;
const CAMPAIGN_SESSIONS_PER_LEVEL = 80;
const FOCUSED_SAMPLE_PER_BUCKET = 500;

function mulberry32(seed) {
  return function nextRandom() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isInteger(value) {
  return Number.isInteger(Number(value));
}

function digitCount(value) {
  const n = Math.trunc(Math.abs(Number(value)));
  return String(n).length;
}

function decimalPlaces(value) {
  if (isInteger(value)) return 0;
  const text = String(value);
  const [, decimal = ''] = text.split('.');
  return decimal.length;
}

function operandShape(value) {
  if (isInteger(value)) return `${digitCount(value)}d`;
  return `${digitCount(value)}i${decimalPlaces(value)}dp`;
}

function digitsRev(value) {
  return String(Math.trunc(Math.abs(Number(value))))
    .split('')
    .reverse()
    .map(Number);
}

function hasAdditionCarry(a, b) {
  const da = digitsRev(a);
  const db = digitsRev(b);
  const max = Math.max(da.length, db.length);
  let carry = 0;
  for (let i = 0; i < max; i++) {
    const sum = (da[i] ?? 0) + (db[i] ?? 0) + carry;
    if (sum >= 10) return true;
    carry = Math.floor(sum / 10);
  }
  return false;
}

function hasSubtractionBorrow(a, b) {
  const top = Math.max(Number(a), Number(b));
  const bottom = Math.min(Number(a), Number(b));
  const da = digitsRev(top);
  const db = digitsRev(bottom);
  let borrow = 0;
  for (let i = 0; i < da.length; i++) {
    const current = da[i] - borrow;
    const sub = db[i] ?? 0;
    if (current < sub) return true;
    borrow = current < sub ? 1 : 0;
  }
  return false;
}

function addCount(map, key, delta = 1) {
  map.set(key, (map.get(key) ?? 0) + delta);
}

function formatTop(map, limit = 3) {
  const entries = [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
  return entries.length
    ? entries.map(([key, count]) => `${key}=${count}`).join(', ')
    : 'none';
}

function pct(part, total) {
  return total === 0 ? '0.0%' : `${((part / total) * 100).toFixed(1)}%`;
}

function getVerticalData(question) {
  const data = question?.data ?? {};
  if (data.kind !== 'vertical-calc') return null;
  const operands = Array.isArray(data.operands) ? data.operands : [];
  if (operands.length < 2) return null;
  return {
    operation: data.operation,
    a: Number(operands[0]),
    b: Number(operands[1]),
  };
}

function classifyShape(operation, a, b, answer) {
  const left = operandShape(a);
  const right = operandShape(b);
  if (operation === '+') return `${left}+${right}${hasAdditionCarry(a, b) ? '-carry' : '-no-carry'}`;
  if (operation === '-') return `${left}-${right}${hasSubtractionBorrow(a, b) ? '-borrow' : '-no-borrow'}`;
  if (operation === '×') return `${left}×${right}`;
  if (operation === '÷') {
    const resultKind = isInteger(answer) ? 'int' : 'decimal';
    return `${left}÷${right}=${resultKind}`;
  }
  return String(operation ?? 'unknown');
}

function classifyMentalCandidates(question) {
  const vertical = getVerticalData(question);
  if (!vertical) {
    return { shape: 'not-vertical-calc', candidateReasons: [], reviewReasons: [] };
  }

  const { operation, a, b } = vertical;
  const answer = question.solution?.answer;
  const shape = classifyShape(operation, a, b, answer);
  const candidateReasons = [];
  const reviewReasons = [];

  if (operation === '×' && isInteger(a) && isInteger(b)) {
    const da = digitCount(a);
    const db = digitCount(b);
    const minDigits = Math.min(da, db);
    const maxDigits = Math.max(da, db);
    if (minDigits === 1 && maxDigits === 2) {
      candidateReasons.push('mul-2d-by-1d');
    } else if (minDigits === 1 && maxDigits === 3) {
      reviewReasons.push('mul-3d-by-1d');
    }
  }

  if (operation === '÷' && isInteger(a) && isInteger(b) && digitCount(b) === 1 && isInteger(answer)) {
    const da = digitCount(a);
    if (da <= 3) {
      candidateReasons.push('div-3d-by-1d-integer');
    } else if (da === 4) {
      reviewReasons.push('div-4d-by-1d-integer');
    }
  }

  if (operation === '+' && isInteger(a) && isInteger(b)) {
    if (Math.min(digitCount(a), digitCount(b)) <= 2 && !hasAdditionCarry(a, b)) {
      reviewReasons.push('add-low-load-no-carry');
    }
  }

  if (operation === '-' && isInteger(a) && isInteger(b)) {
    if (Math.min(digitCount(a), digitCount(b)) <= 2 && !hasSubtractionBorrow(a, b)) {
      reviewReasons.push('sub-low-load-no-borrow');
    }
  }

  return { shape, candidateReasons, reviewReasons };
}

function makeStats() {
  return {
    total: 0,
    candidates: 0,
    review: 0,
    shapes: new Map(),
    candidateReasons: new Map(),
    reviewReasons: new Map(),
    candidateExamples: [],
    reviewExamples: [],
  };
}

function addQuestion(stats, question, context) {
  const classified = classifyMentalCandidates(question);
  stats.total++;
  addCount(stats.shapes, classified.shape);

  if (classified.candidateReasons.length > 0) {
    stats.candidates++;
    for (const reason of classified.candidateReasons) addCount(stats.candidateReasons, reason);
    if (stats.candidateExamples.length < 8) {
      stats.candidateExamples.push(`${context}: ${question.prompt} -> ${question.solution?.answer} [${classified.candidateReasons.join('|')}]`);
    }
  }

  if (classified.reviewReasons.length > 0) {
    stats.review++;
    for (const reason of classified.reviewReasons) addCount(stats.reviewReasons, reason);
    if (stats.reviewExamples.length < 8) {
      stats.reviewExamples.push(`${context}: ${question.prompt} -> ${question.solution?.answer} [${classified.reviewReasons.join('|')}]`);
    }
  }
}

function sampleCampaign() {
  const map = CAMPAIGN_MAPS['vertical-calc'];
  const rows = [];
  for (const stage of map.stages) {
    for (const lane of stage.lanes) {
      for (const level of lane.levels) {
        const stats = makeStats();
        for (let session = 0; session < CAMPAIGN_SESSIONS_PER_LEVEL; session++) {
          for (let i = 0; i < level.questionCount; i++) {
            const q = generateQuestion('vertical-calc', level.difficulty, lane.subtypeFilter);
            addQuestion(stats, q, `${level.levelId} s${session + 1}q${i + 1}`);
          }
        }
        rows.push({
          levelId: level.levelId,
          laneLabel: lane.laneLabel,
          difficulty: level.difficulty,
          subtypeFilter: lane.subtypeFilter?.join('|') ?? 'boss',
          stats,
        });
      }
    }
  }
  return rows;
}

function sampleFocusedBuckets() {
  const focusTags = new Set(['int-add', 'int-sub', 'int-mul', 'int-div', 'dec-div', 'approximate']);
  const rows = [];
  for (const difficulty of [2, 3, 4, 5, 6, 7, 8, 9]) {
    const tags = getSubtypeEntries(difficulty)
      .map(entry => entry.tag)
      .filter(tag => focusTags.has(tag));
    for (const tag of tags) {
      const stats = makeStats();
      for (let i = 0; i < FOCUSED_SAMPLE_PER_BUCKET; i++) {
        const q = generateQuestion('vertical-calc', difficulty, [tag]);
        addQuestion(stats, q, `d${difficulty}/${tag}#${i + 1}`);
      }
      rows.push({ difficulty, tag, stats });
    }
  }
  return rows;
}

function printStats(label, stats) {
  console.log(`- ${label}: total=${stats.total}; candidates=${stats.candidates} (${pct(stats.candidates, stats.total)}); review=${stats.review} (${pct(stats.review, stats.total)}); topCandidates=${formatTop(stats.candidateReasons)}; topReview=${formatTop(stats.reviewReasons)}; topShapes=${formatTop(stats.shapes, 4)}`);
}

function mergeStats(rows) {
  const merged = makeStats();
  for (const row of rows) {
    const stats = row.stats;
    merged.total += stats.total;
    merged.candidates += stats.candidates;
    merged.review += stats.review;
    for (const [key, value] of stats.shapes.entries()) addCount(merged.shapes, key, value);
    for (const [key, value] of stats.candidateReasons.entries()) addCount(merged.candidateReasons, key, value);
    for (const [key, value] of stats.reviewReasons.entries()) addCount(merged.reviewReasons, key, value);
    for (const example of stats.candidateExamples) {
      if (merged.candidateExamples.length < 12) merged.candidateExamples.push(example);
    }
    for (const example of stats.reviewExamples) {
      if (merged.reviewExamples.length < 12) merged.reviewExamples.push(example);
    }
  }
  return merged;
}

function printExamples(title, examples) {
  console.log(`\n## ${title}`);
  if (examples.length === 0) {
    console.log('- none');
    return;
  }
  for (const example of examples) console.log(`- ${example}`);
}

function main() {
  const originalRandom = Math.random;
  Math.random = mulberry32(SEED);
  try {
    const campaignRows = sampleCampaign();
    const focusedRows = sampleFocusedBuckets();
    const campaignMerged = mergeStats(campaignRows);
    const focusedMerged = mergeStats(focusedRows);

    console.log('# BL-009 vertical sample quality diagnostic');
    console.log(`seed=${SEED}`);
    console.log(`campaignSessionsPerLevel=${CAMPAIGN_SESSIONS_PER_LEVEL}`);
    console.log(`focusedSamplePerBucket=${FOCUSED_SAMPLE_PER_BUCKET}`);
    console.log(`generatedAt=${new Date().toISOString()}`);

    console.log('\n## Campaign A03 lane summary');
    for (const row of campaignRows) {
      printStats(`${row.levelId} d=${row.difficulty} lane=${row.laneLabel} filter=${row.subtypeFilter}`, row.stats);
    }

    console.log('\n## Focused generator bucket summary');
    for (const row of focusedRows) {
      printStats(`d=${row.difficulty} subtype=${row.tag}`, row.stats);
    }

    console.log('\n## Totals');
    printStats('campaign-total', campaignMerged);
    printStats('focused-total', focusedMerged);

    printExamples('Candidate examples', campaignMerged.candidateExamples.concat(focusedMerged.candidateExamples).slice(0, 12));
    printExamples('Review examples', campaignMerged.reviewExamples.concat(focusedMerged.reviewExamples).slice(0, 12));
  } finally {
    Math.random = originalRandom;
  }
}

main();
