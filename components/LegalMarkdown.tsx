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
    <h1 className="font-heading text-3xl font-bold mb-2" style={{ color: '#F1F5F9' }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-heading text-xl font-semibold mt-10 mb-3" style={{ color: '#F1F5F9' }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-heading text-base font-semibold mt-6 mb-2" style={{ color: '#F1F5F9' }}>
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="leading-relaxed mb-4" style={{ color: '#94A3B8' }}>
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 space-y-1.5 mb-4" style={{ color: '#94A3B8' }}>
      {children}
    </ul>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold" style={{ color: '#F1F5F9' }}>
      {children}
    </strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="hover:underline"
      style={{ color: '#3E7BFA' }}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead style={{ borderBottom: '1px solid #1E2D45' }}>{children}</thead>,
  th: ({ children }) => (
    <th className="text-left font-semibold py-2 pr-4" style={{ color: '#F1F5F9' }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="py-2 pr-4" style={{ color: '#94A3B8', borderBottom: '1px solid #161D2E' }}>
      {children}
    </td>
  ),
  hr: () => <hr className="my-8" style={{ borderColor: '#1E2D45' }} />,
};

export default function LegalMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
