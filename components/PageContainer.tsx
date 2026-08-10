// Shared layout constraint (UI polish pass) — every marketing page's content
// centers within this same max-width so the NavBar, page content, and
// Footer all align to one consistent edge instead of each page inventing
// its own container width.
export default function PageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto px-6 md:px-10 ${className}`} style={{ maxWidth: 1080 }}>
      {children}
    </div>
  );
}
