'use client';

import { useState } from 'react';
import Link from 'next/link';

type Props = {
  url: string;
  embedHtml: string;
  badgeMarkdown: string;
  onCreateAnother: () => void;
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-6">
      <p className="text-sm font-medium mb-2 text-[#F1F5F9]">{label}</p>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 px-3 py-2 rounded-md bg-[#161D2E] border border-[#1E2D45] text-xs text-[#94A3B8] overflow-x-auto whitespace-nowrap">
          {value}
        </code>
        <button
          onClick={handleCopy}
          className="px-4 py-2 rounded-md border border-[#1E2D45] text-[#F1F5F9] hover:border-[#253447] transition-colors text-sm shrink-0"
        >
          {copied ? 'Copied!' : `Copy ${label.split(' ')[0].toLowerCase()}`}
        </button>
      </div>
    </div>
  );
}

export default function SharePanel({ url, embedHtml, badgeMarkdown, onCreateAnother }: Props) {
  return (
    <div className="mt-8 max-w-xl mx-auto text-center">
      <p className="text-4xl mb-4">🎉</p>
      <h1 className="font-heading text-2xl font-semibold mb-8 text-[#F1F5F9]">Quiz published!</h1>

      <div className="text-left">
        <CopyRow label="Share link" value={url} />
        <CopyRow label="Embed in your article" value={embedHtml} />
        <CopyRow label="Badge (for READMEs)" value={badgeMarkdown} />
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity text-sm"
        >
          View quiz →
        </a>
        <button
          onClick={onCreateAnother}
          className="px-5 py-2 rounded-md border border-[#1E2D45] text-[#F1F5F9] hover:border-[#253447] transition-colors text-sm"
        >
          Create another quiz
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2 rounded-md border border-[#1E2D45] text-[#F1F5F9] hover:border-[#253447] transition-colors text-sm"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
