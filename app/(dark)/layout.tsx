import DarkNavBar from '@/components/DarkNavBar';

// Quiz/exam/reader/edit pages keep the dark theme intentionally (M1-01) —
// focus/exam feel, deliberate contrast with the light marketing pages. This
// route group re-establishes the old dark background for its whole subtree
// since the root layout now defaults to light.
export default function DarkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-white">
      <DarkNavBar />
      <main>{children}</main>
    </div>
  );
}
