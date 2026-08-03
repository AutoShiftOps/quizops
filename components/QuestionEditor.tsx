'use client';

import { useState } from 'react';
import { Question } from '@/lib/types';

type Props = {
  question: Question;
  index: number;
  onChange: (updated: Question) => void;
  onDelete: () => void;
  canDelete: boolean;
};

export default function QuestionEditor({
  question,
  index,
  onChange,
  onDelete,
  canDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [draft, setDraft] = useState<Question>(question);

  function startEdit() {
    setDraft(question);
    setEditing(true);
  }

  function save() {
    onChange(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(question);
    setEditing(false);
  }

  function updateOption(i: number, value: string) {
    const options = [...draft.options];
    options[i] = value;
    setDraft({ ...draft, options });
  }

  if (editing) {
    return (
      <div className="bg-surface border border-accent rounded-xl p-5">
        <p className="text-sm text-gray-400 mb-2">Question {index + 1}</p>
        <textarea
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none mb-3"
        />
        <div className="space-y-2 mb-3">
          {draft.options.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                checked={draft.answer === i}
                onChange={() => setDraft({ ...draft, answer: i })}
              />
              <span className="text-xs text-gray-500 w-4">{String.fromCharCode(65 + i)}</span>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(i, e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-md bg-background border border-border focus:border-accent outline-none"
              />
            </div>
          ))}
        </div>
        <textarea
          value={draft.explanation}
          onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
          rows={2}
          placeholder="Explanation"
          className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            className="px-4 py-1.5 rounded-md bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            ✓ Save
          </button>
          <button
            onClick={cancel}
            className="px-4 py-1.5 rounded-md border border-border text-sm hover:border-accent transition-colors"
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="font-medium">
          {index + 1}. {question.text}
        </p>
      </div>
      <div className="space-y-1.5 mb-3">
        {question.options.map((option, i) => (
          <p
            key={i}
            className={`text-sm px-3 py-1.5 rounded-md ${
              i === question.answer ? 'bg-green/10 text-green' : 'text-gray-400'
            }`}
          >
            {String.fromCharCode(65 + i)}. {option}
          </p>
        ))}
      </div>
      <button
        onClick={() => setShowExplanation((v) => !v)}
        className="text-xs text-accent hover:underline mb-3"
      >
        {showExplanation ? 'Hide' : 'Show'} explanation
      </button>
      {showExplanation && <p className="text-sm text-gray-400 mb-3">{question.explanation}</p>}
      <div className="flex gap-2">
        <button
          onClick={startEdit}
          className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-accent transition-colors"
        >
          ✎ Edit
        </button>
        <button
          onClick={onDelete}
          disabled={!canDelete}
          title={!canDelete ? 'At least 3 questions required' : undefined}
          className="px-3 py-1.5 rounded-md border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ✕ Delete
        </button>
      </div>
    </div>
  );
}
