import { ExamState } from './types';

const STORAGE_PREFIX = 'quizops_exam_';
const STALE_MS = 90 * 60 * 1000; // 90 minutes

function storageKey(bankSlug: string): string {
  return `${STORAGE_PREFIX}${bankSlug}`;
}

export function loadExamProgress(bankSlug: string): ExamState | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(storageKey(bankSlug));
  if (!raw) return null;

  let state: ExamState;
  try {
    state = JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(storageKey(bankSlug));
    return null;
  }

  if (!state.savedAt || Date.now() - state.savedAt > STALE_MS) {
    window.localStorage.removeItem(storageKey(bankSlug));
    return null;
  }

  return state;
}

export function saveExamProgress(bankSlug: string, state: Omit<ExamState, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    storageKey(bankSlug),
    JSON.stringify({ ...state, savedAt: Date.now() })
  );
}

export function clearExamProgress(bankSlug: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey(bankSlug));
}
