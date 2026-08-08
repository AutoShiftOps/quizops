import { getAllBanks } from '@/lib/loadBanks';
import BankGrid from '@/components/BankGrid';

export default function HomePage() {
  const banks = getAllBanks();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {banks.length > 0 ? (
        <BankGrid banks={banks} />
      ) : (
        <p className="text-center text-[#71717A]">No quiz banks found yet.</p>
      )}
    </div>
  );
}
