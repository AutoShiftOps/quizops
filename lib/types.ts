export type Question = {
  id: string;
  text: string;
  code: string | null;
  options: string[];
  answer: number; // 0-based index
  explanation: string;
  tags?: string[]; // optional topic tags
};

export type QuizBank = {
  slug: string;
  name: string;
  description: string;
  topic: string;
  emoji: string;
  source_url: string | null; // link back to original post
  duration_seconds: number;
  pass_mark: number;
  question_count: number;
};

export type Attempt = {
  user_id: string;
  bank_slug: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, number>;
  time_taken_s: number;
  completed_at: string;
};

export type ExamState = {
  current: number;
  selected: (number | null)[];
  flagged: boolean[];
  timeLeft: number;
  violationCount: number;
  savedAt: number;
};

export type ExamAttempt = Attempt & {
  mode: 'exam';
  violation_count: number;
  auto_submitted: boolean;
  flagged_questions: number[];
};
