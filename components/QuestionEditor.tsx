'use client';

import { useState } from 'react';
import { Question } from '@/lib/types';

type Props = {
  question: Question;
  index: number;
  onChange: (updated: Question) => void;
  onDelete: () => void;
  canDelete: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  startInEditMode?: boolean;
};

export default function QuestionEditor({
  question,
  index,
  onChange,
  onDelete,
  canDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  startInEditMode,
}: Props) {
  const [editing, setEditing] = useState(startInEditMode ?? false);
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

  const moveControls = (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={isFirst}
        title="Move up"
        className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-sm hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={isLast}
        title="Move down"
        className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-sm hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ▼
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        title={!canDelete ? 'At least 1 question required' : 'Delete question'}
        className="w-8 h-8 flex items-center justify-center rounded-md border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        🗑️
      </button>
    </div>
  );

  if (editing) {
    return (
      <div className="bg-surface border border-accent rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm text-gray-400">
            Question {index + 1} <span className="text-accent">— editing</span>
          </p>
          <button
            type="button"
            onClick={cancel}
            title="Cancel"
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-sm hover:border-accent transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
        <textarea
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          rows={2}
          placeholder="Question text..."
          className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none mb-3"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {draft.options.map((option, i) => {
            const isCorrect = draft.answer === i;
            return (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, answer: i })}
                  title={`Mark ${String.fromCharCode(65 + i)} as correct`}
                  className={`w-6 h-6 shrink-0 rounded-md text-xs font-semibold flex items-center justify-center transition-colors ${
                    isCorrect ? 'bg-green text-background' : 'bg-border text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </button>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className={`flex-1 min-w-0 px-3 py-1.5 rounded-md bg-background border outline-none ${
                    isCorrect ? 'border-green' : 'border-border focus:border-accent'
                  }`}
                />
                {isCorrect && <span className="text-xs text-green shrink-0">correct</span>}
              </div>
            );
          })}
        </div>
        <textarea
          value={draft.explanation}
          onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
          rows={2}
          placeholder="Explanation (why is this correct?)"
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
        <p className="font-medium">Question {index + 1}</p>
        {moveControls}
      </div>
      <p className="mb-3">{question.text}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {question.options.map((option, i) => {
          const isCorrect = i === question.answer;
          return (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${
                isCorrect ? 'border-green bg-green/10 text-green' : 'border-border text-gray-400'
              }`}
            >
              <span
                className={`w-5 h-5 shrink-0 rounded text-xs font-semibold flex items-center justify-center ${
                  isCorrect ? 'bg-green text-background' : 'bg-border text-gray-400'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="truncate">{option}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={startEdit}
          className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-accent transition-colors"
        >
          ✎ Edit
        </button>
        <button
          onClick={() => setShowExplanation((v) => !v)}
          className="text-xs text-accent hover:underline"
        >
          {showExplanation ? 'Hide' : 'Show'} explanation
        </button>
      </div>
      {showExplanation && <p className="text-sm text-gray-400">{question.explanation}</p>}
    </div>
  );
}
