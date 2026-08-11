import { getAllBanks } from '@/lib/loadBanks';
import BankGrid from '@/components/BankGrid';

// Community banks are contributor-submitted and expected to keep growing —
// paginated server-side (via ?page=) rather than client-side, so the page's
// initial HTML/hydration payload only ever contains one page's worth of
// bank metadata. A client-side slice would still ship every bank to the
// browser on every load regardless of how many render at once, meaning
// rendering cost would grow with the total bank count — this keeps it flat.
const BANKS_PER_PAGE = 6;

// No max-w wrapper here — Hero, BentoGrid, and PublisherCTA inside BankGrid
// are full-bleed sections that need to own their own width; the quiz-bank
// grid constrains itself to the shared 1080px container internally instead.
export default function HomePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const allBanks = getAllBanks();
  const totalPages = Math.max(Math.ceil(allBanks.length / BANKS_PER_PAGE), 1);
  const requestedPage = Number(searchParams.page) || 1;
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const pageBanks = allBanks.slice(
    (currentPage - 1) * BANKS_PER_PAGE,
    currentPage * BANKS_PER_PAGE
  );

  return allBanks.length > 0 ? (
    <BankGrid
      banks={pageBanks}
      totalBankCount={allBanks.length}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  ) : (
    <p className="text-center py-16" style={{ color: '#94A3B8' }}>
      No quiz banks found yet.
    </p>
  );
}
