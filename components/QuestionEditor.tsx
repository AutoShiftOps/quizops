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
  // Defaults to 'dark' — shared between the (dark) edit page and the
  // (light) manual/AI creation flow (M1-01).
  theme?: 'light' | 'dark';
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
  theme = 'dark',
}: Props) {
  const [editing, setEditing] = useState(startInEditMode ?? false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [draft, setDraft] = useState<Question>(question);
  const light = theme === 'light';

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

  const card = light
    ? 'bg-white border border-[#E4E4E7] rounded-xl p-5'
    : 'bg-surface border border-border rounded-xl p-5';
  const cardEditing = light
    ? 'bg-white border border-accent rounded-xl p-5'
    : 'bg-surface border border-accent rounded-xl p-5';
  const textArea = light
    ? 'w-full px-3 py-2 rounded-md bg-white border border-[#E4E4E7] focus:border-accent outline-none mb-3 text-[#18181B]'
    : 'w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none mb-3';
  const iconBtn = light
    ? 'w-8 h-8 flex items-center justify-center rounded-md border border-[#E4E4E7] text-sm hover:border-[#D4D4D8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
    : 'w-8 h-8 flex items-center justify-center rounded-md border border-border text-sm hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed';
  const optionInput = (isCorrect: boolean) =>
    light
      ? `flex-1 min-w-0 px-3 py-1.5 rounded-md bg-white border outline-none text-[#18181B] ${
          isCorrect ? 'border-success' : 'border-[#E4E4E7] focus:border-accent'
        }`
      : `flex-1 min-w-0 px-3 py-1.5 rounded-md bg-background border outline-none ${
          isCorrect ? 'border-green' : 'border-border focus:border-accent'
        }`;
  const bodyText = light ? 'text-[#18181B]' : '';
  const mutedText = light ? 'text-[#71717A]' : 'text-gray-400';

  const moveControls = (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={isFirst}
        title="Move up"
        className={iconBtn}
      >
        ▲
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={isLast}
        title="Move down"
        className={iconBtn}
      >
        ▼
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        title={!canDelete ? 'At least 1 question required' : 'Delete question'}
        className={
          light
            ? 'w-8 h-8 flex items-center justify-center rounded-md border border-danger/40 text-danger hover:bg-danger/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
            : 'w-8 h-8 flex items-center justify-center rounded-md border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
        }
      >
        🗑️
      </button>
    </div>
  );

  if (editing) {
    return (
      <div className={cardEditing}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className={`text-sm ${mutedText}`}>
            Question {index + 1} <span className="text-accent">— editing</span>
          </p>
          <button type="button" onClick={cancel} title="Cancel" className={`${iconBtn} shrink-0`}>
            ✕
          </button>
        </div>
        <textarea
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          rows={2}
          placeholder="Question text..."
          className={textArea}
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
                    isCorrect
                      ? 'bg-success text-white'
                      : light
                      ? 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'
                      : 'bg-border text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </button>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className={optionInput(isCorrect)}
                />
                {isCorrect && <span className="text-xs text-success shrink-0">correct</span>}
              </div>
            );
          })}
        </div>
        <textarea
          value={draft.explanation}
          onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
          rows={2}
          placeholder="Explanation (why is this correct?)"
          className={textArea}
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
            className={
              light
                ? 'px-4 py-1.5 rounded-md border border-[#E4E4E7] text-sm text-[#18181B] hover:border-[#D4D4D8] transition-colors'
                : 'px-4 py-1.5 rounded-md border border-border text-sm hover:border-accent transition-colors'
            }
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className={`font-medium ${bodyText}`}>Question {index + 1}</p>
        {moveControls}
      </div>
      <p className={`mb-3 ${bodyText}`}>{question.text}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {question.options.map((option, i) => {
          const isCorrect = i === question.answer;
          return (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${
                isCorrect
                  ? 'border-success bg-success/10 text-success'
                  : light
                  ? 'border-[#E4E4E7] text-[#71717A]'
                  : 'border-border text-gray-400'
              }`}
            >
              <span
                className={`w-5 h-5 shrink-0 rounded text-xs font-semibold flex items-center justify-center ${
                  isCorrect
                    ? 'bg-success text-white'
                    : light
                    ? 'bg-[#F4F4F5] text-[#71717A]'
                    : 'bg-border text-gray-400'
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
          className={
            light
              ? 'px-3 py-1.5 rounded-md border border-[#E4E4E7] text-sm text-[#18181B] hover:border-[#D4D4D8] transition-colors'
              : 'px-3 py-1.5 rounded-md border border-border text-sm hover:border-accent transition-colors'
          }
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
      {showExplanation && <p className={`text-sm ${mutedText}`}>{question.explanation}</p>}
    </div>
  );
}
