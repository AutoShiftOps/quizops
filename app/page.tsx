import { getAllBanks } from '@/lib/loadBanks';
import BankGrid from '@/components/BankGrid';

// No max-w wrapper here — Hero, BentoGrid, and PublisherCTA inside BankGrid
// are full-bleed sections that need to own their own width; the quiz-bank
// grid constrains itself to the shared 1080px container internally instead.
export default function HomePage() {
  const banks = getAllBanks();

  return banks.length > 0 ? (
    <BankGrid banks={banks} />
  ) : (
    <p className="text-center py-16" style={{ color: '#94A3B8' }}>
      No quiz banks found yet.
    </p>
  );
}
