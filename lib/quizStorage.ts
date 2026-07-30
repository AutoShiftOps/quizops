const STORAGE_PREFIX = 'quizops_progress_';
const STALE_MS = 90 * 60 * 1000; // 90 minutes

export type QuizCheckpoint = {
  current: number;
  selected: (number | null)[];
  revealed: boolean[];
  timeLeft: number;
  savedAt: number;
};

function storageKey(bankSlug: string): string {
  return `${STORAGE_PREFIX}${bankSlug}`;
}

export function loadCheckpoint(bankSlug: string): QuizCheckpoint | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(storageKey(bankSlug));
  if (!raw) return null;

  let checkpoint: QuizCheckpoint;
  try {
    checkpoint = JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(storageKey(bankSlug));
    return null;
  }

  if (!checkpoint.savedAt || Date.now() - checkpoint.savedAt > STALE_MS) {
    window.localStorage.removeItem(storageKey(bankSlug));
    return null;
  }

  return checkpoint;
}

export function saveCheckpoint(
  bankSlug: string,
  checkpoint: Omit<QuizCheckpoint, 'savedAt'>
): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    storageKey(bankSlug),
    JSON.stringify({ ...checkpoint, savedAt: Date.now() })
  );
}

export function clearCheckpoint(bankSlug: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey(bankSlug));
}
