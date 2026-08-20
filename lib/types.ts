export type Question = {
  id: string;
  text: string;
  code: string | null;
  options: string[];
  answer: number; // 0-based index
  explanation: string;
  tags?: string[]; // optional topic tags
  type?: 'mcq' | 'true_false'; // defaults to 'mcq' when absent
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

export type Publisher = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  website_url: string | null;
  tier: 'free' | 'pro' | 'team';
  quiz_count: number;
  created_at: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  cancel_at_period_end?: boolean;
  period_end_date?: string | null;
};

export type PublishedQuiz = {
  id: string;
  publisher_id: string;
  slug: string;
  title: string;
  description: string | null;
  source_url: string | null;
  topic: string | null;
  tags: string[];
  emoji: string;
  duration_s: number;
  pass_mark: number;
  questions: Question[];
  status: 'draft' | 'published';
  attempt_count: number;
  created_at: string;
  updated_at: string;
};

export type PublisherAttempt = {
  id: string;
  quiz_id: string;
  publisher_id: string;
  user_id: string | null;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, number>;
  time_taken_s: number;
  attempted_at: string;
};
