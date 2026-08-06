import { Question } from './types';

export function validateTitle(title: unknown): title is string {
  return typeof title === 'string' && title.trim().length > 0 && title.length <= 100;
}

export function validateQuestions(questions: unknown, minCount = 3): questions is Question[] {
  if (!Array.isArray(questions)) return false;
  if (questions.length < minCount || questions.length > 50) return false;
  return questions.every((q) => {
    if (!q || typeof q !== 'object') return false;
    const question = q as Record<string, unknown>;
    return (
      typeof question.text === 'string' &&
      question.text.trim().length > 0 &&
      Array.isArray(question.options) &&
      question.options.length === 4 &&
      typeof question.answer === 'number' &&
      question.answer >= 0 &&
      question.answer <= 3 &&
      typeof question.explanation === 'string' &&
      question.explanation.trim().length > 0
    );
  });
}
