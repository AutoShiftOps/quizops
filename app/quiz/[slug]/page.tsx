import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllBankSlugs, getBank, getQuestions } from '@/lib/loadBanks';
import QuizEngine from '@/components/QuizEngine';

export function generateStaticParams() {
  return getAllBankSlugs().map((slug) => ({ slug }));
}

export default function QuizPage({ params }: { params: { slug: string } }) {
  const bank = getBank(params.slug);
  const questions = getQuestions(params.slug);

  if (!bank || questions.length === 0) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link
        href="/"
        className="text-sm text-gray-400 hover:text-accent transition-colors"
      >
        ← Back to home
      </Link>
      <QuizEngine bank={bank!} questions={questions} />
    </div>
  );
}
