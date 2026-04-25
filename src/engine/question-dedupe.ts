import type { Question, TopicId } from '@/types';
import type { GameSessionMode } from '@/types/gamification';

export const DEDUPE_RETRY_LIMIT = 5;

type DuplicateSignaturePolicy = 'closed-prompt' | 'open-options';

interface DedupeContext {
  sessionMode: GameSessionMode;
  topicId?: TopicId;
  difficulty?: number;
  subtypeTag?: string;
}

const OPEN_OPTIONS_PROMPTS = new Set([
  '下面哪个式子能先凑整？',
  '以下哪些说法正确？',
  '下面哪个算式的积比 300 大？',
]);

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function canonicalizeOptions(question: Question): string {
  const data = question.data as { options?: string[] };
  const options = Array.isArray(data.options) ? data.options : [];
  return options
    .map(normalizeText)
    .sort()
    .join('|');
}

function getSignaturePolicy(question: Question): DuplicateSignaturePolicy {
  const prompt = normalizeText(question.prompt);
  if (OPEN_OPTIONS_PROMPTS.has(prompt)) return 'open-options';
  return 'closed-prompt';
}

export function getDuplicateSignature(question: Question): string {
  const prompt = normalizeText(question.prompt);
  const policy = getSignaturePolicy(question);
  if (policy === 'open-options') {
    return `${prompt}::options=${canonicalizeOptions(question)}`;
  }
  return prompt;
}

export function generateUniqueQuestion(params: {
  generate: () => Question;
  seen: Set<string>;
  context: DedupeContext;
  retryLimit?: number;
}): Question {
  const retryLimit = params.retryLimit ?? DEDUPE_RETRY_LIMIT;

  for (let retryCount = 0; retryCount <= retryLimit; retryCount++) {
    const question = params.generate();
    const signature = getDuplicateSignature(question);

    if (!params.seen.has(signature)) {
      params.seen.add(signature);
      return question;
    }

    if (retryCount === retryLimit) {
      if (import.meta.env.DEV) {
        console.debug('[question-dedupe] retry exhausted', {
          ...params.context,
          signature,
          retryCount,
        });
      }
      return question;
    }
  }

  throw new Error('unreachable question dedupe state');
}
