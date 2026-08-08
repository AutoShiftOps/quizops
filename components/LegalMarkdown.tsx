import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

// Shared rendering + typography for the legal pages. remark-gfm is required
// here (not just "react-markdown" alone) because privacy-policy.md includes
// a GFM table (Section 6, third-party services) — without it, the table
// syntax renders as a garbled paragraph of pipe characters instead of an
// actual table.
const components: Components = {
  h1: ({ children }) => (
    <h1 className="font-heading text-3xl font-bold text-[#18181B] mb-2">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-heading text-xl font-semibold text-[#18181B] mt-10 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-heading text-base font-semibold text-[#18181B] mt-6 mb-2">{children}</h3>
  ),
  p: ({ children }) => <p className="text-[#3F3F46] leading-relaxed mb-4">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc pl-5 space-y-1.5 text-[#3F3F46] mb-4">{children}</ul>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[#18181B]">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-[#E4E4E7]">{children}</thead>,
  th: ({ children }) => (
    <th className="text-left font-semibold text-[#18181B] py-2 pr-4">{children}</th>
  ),
  td: ({ children }) => (
    <td className="text-[#3F3F46] py-2 pr-4 border-b border-[#F4F4F5]">{children}</td>
  ),
  hr: () => <hr className="border-[#E4E4E7] my-8" />,
};

export default function LegalMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
