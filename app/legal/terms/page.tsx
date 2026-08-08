import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import LegalMarkdown from '@/components/LegalMarkdown';

export const metadata: Metadata = {
  title: 'Terms of Service | QuizOps',
};

export default function TermsOfServicePage() {
  const raw = fs.readFileSync(
    path.join(process.cwd(), 'app/legal/terms/terms-of-service.md'),
    'utf-8'
  );

  // The source doc's own "Effective Date" / "Last Updated" lines are pulled
  // out and shown as a prominent badge below the heading, rather than left
  // to blend in as ordinary bold text a few lines into the document.
  const effectiveMatch = raw.match(/\*\*Effective Date:\*\*\s*(.+)/);
  const updatedMatch = raw.match(/\*\*Last Updated:\*\*\s*(.+)/);
  const body = raw
    .replace(/^#\s+Terms of Service\s*$/m, '')
    .replace(/\*\*Effective Date:\*\*.*$/m, '')
    .replace(/\*\*Last Updated:\*\*.*$/m, '')
    .trim();

  return (
    <>
      <h1 className="font-heading text-3xl font-bold text-[#18181B] mb-3">Terms of Service</h1>
      <div className="inline-flex flex-wrap items-center gap-3 text-sm text-[#71717A] bg-[#F4F4F5] rounded-md px-3 py-2 mb-8">
        {effectiveMatch && (
          <span>
            <span className="font-semibold text-[#18181B]">Effective:</span> {effectiveMatch[1]}
          </span>
        )}
        {updatedMatch && (
          <span>
            <span className="font-semibold text-[#18181B]">Last updated:</span> {updatedMatch[1]}
          </span>
        )}
      </div>
      <LegalMarkdown content={body} />
    </>
  );
}
