import fs from 'fs';
import path from 'path';
import { QuizBank, Question } from './types';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export function getAllBankSlugs(): string[] {
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== '_template')
    .map((entry) => entry.name);
}

export function getBank(slug: string): QuizBank | null {
  const bankPath = path.join(CONTENT_DIR, slug, 'bank.json');
  if (!fs.existsSync(bankPath)) return null;
  return JSON.parse(fs.readFileSync(bankPath, 'utf-8')) as QuizBank;
}

export function getAllBanks(): QuizBank[] {
  return getAllBankSlugs()
    .map((slug) => getBank(slug))
    .filter((bank): bank is QuizBank => bank !== null);
}

export function getQuestions(slug: string): Question[] {
  const questionsPath = path.join(CONTENT_DIR, slug, 'questions.json');
  if (!fs.existsSync(questionsPath)) return [];
  return JSON.parse(fs.readFileSync(questionsPath, 'utf-8')) as Question[];
}
