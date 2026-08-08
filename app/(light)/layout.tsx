import LightNavBar from '@/components/LightNavBar';

// Marketing + dashboard pages (M1-01). The root layout already defaults to
// the light background/text, so this layout just adds the light navbar.
export default function LightLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <LightNavBar />
      <main>{children}</main>
    </div>
  );
}
