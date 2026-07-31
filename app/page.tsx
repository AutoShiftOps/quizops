import { getAllBanks } from '@/lib/loadBanks';
import BankGrid from '@/components/BankGrid';

export default function HomePage() {
  const banks = getAllBanks();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <section className="text-center mb-16">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          Test your technical knowledge
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Bite-sized quizzes on DevOps, cloud, and engineering fundamentals — sign
          in to track your progress, or jump in as a guest.
        </p>
      </section>

      {banks.length > 0 ? (
        <BankGrid banks={banks} />
      ) : (
        <p className="text-center text-gray-500">No quiz banks found yet.</p>
      )}

      <section className="mt-20 text-center border-t border-border pt-10">
        <h2 className="font-heading text-2xl font-semibold mb-2">
          Have a topic to test?
        </h2>
        <p className="text-gray-400">
          Anyone can contribute a new quiz bank — no coding required. See{' '}
          <span className="text-accent">CONTRIBUTING.md</span> in the repo to get
          started.
        </p>
      </section>
    </div>
  );
}
