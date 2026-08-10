import { getAllBanks } from '@/lib/loadBanks';
import BankGrid from '@/components/BankGrid';

// No max-w wrapper here (enterprise homepage redesign) — Hero, HowItWorks,
// and PublisherCTA inside BankGrid are full-bleed sections that need to own
// their own width; the quiz-bank grid constrains itself to max-w-6xl
// internally instead.
export default function HomePage() {
  const banks = getAllBanks();

  return banks.length > 0 ? (
    <BankGrid banks={banks} />
  ) : (
    <p className="text-center text-[#71717A] py-16">No quiz banks found yet.</p>
  );
}
