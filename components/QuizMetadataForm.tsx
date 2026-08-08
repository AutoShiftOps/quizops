'use client';

import { useState } from 'react';

const EMOJI_OPTIONS = [
  '📝', '🚀', '💡', '🔧', '🛠️', '📦', '☁️', '🔒',
  '🐳', '⚙️', '📊', '🧪', '🎯', '🔥', '⚡', '🌐',
  '🧠', '📚', '✅', '💻',
];

const DURATIONS = [10, 20, 30];
const PASS_MARKS = [60, 70, 80];

type Props = {
  title: string;
  onTitleChange: (v: string) => void;
  titleTouched: boolean;
  onTitleBlur: () => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  emoji: string;
  onEmojiChange: (v: string) => void;
  sourceUrl: string;
  onSourceUrlChange: (v: string) => void;
  topic: string;
  onTopicChange: (v: string) => void;
  durationMin: number;
  onDurationChange: (v: number) => void;
  passMark: number;
  onPassMarkChange: (v: number) => void;
  // Defaults to 'dark' — this form is shared between the (dark) edit page
  // and the (light) manual/AI creation flow (M1-01).
  theme?: 'light' | 'dark';
};

export default function QuizMetadataForm({
  title,
  onTitleChange,
  titleTouched,
  onTitleBlur,
  description,
  onDescriptionChange,
  emoji,
  onEmojiChange,
  sourceUrl,
  onSourceUrlChange,
  topic,
  onTopicChange,
  durationMin,
  onDurationChange,
  passMark,
  onPassMarkChange,
  theme = 'dark',
}: Props) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const light = theme === 'light';

  const container = light
    ? 'bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-5'
    : 'bg-surface border border-border rounded-xl p-5 space-y-5';
  const label = light
    ? 'text-xs font-semibold tracking-wider text-[#A1A1AA] uppercase mb-2'
    : 'text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2';
  const input = light
    ? 'w-full px-3 py-2 rounded-md bg-white border border-[#E4E4E7] focus:border-accent outline-none text-[#18181B]'
    : 'w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none';
  const inputError = light
    ? 'w-full px-3 py-2 rounded-md bg-white border border-danger outline-none text-[#18181B]'
    : 'w-full px-3 py-2 rounded-md bg-background border border-red-500 outline-none';
  const emojiButton = light
    ? 'text-2xl px-3 py-1.5 rounded-md border border-[#E4E4E7] hover:border-[#D4D4D8] transition-colors'
    : 'text-2xl px-3 py-1.5 rounded-md border border-border hover:border-accent transition-colors';
  const emojiPicker = light
    ? 'grid grid-cols-10 gap-1 mt-2 p-3 rounded-md border border-[#E4E4E7] bg-[#F4F4F5]'
    : 'grid grid-cols-10 gap-1 mt-2 p-3 rounded-md border border-border bg-background';
  const emojiOption = light ? 'text-xl hover:bg-white rounded p-1' : 'text-xl hover:bg-surface rounded p-1';

  return (
    <div className={container}>
      <div>
        <label className="block text-2xl mb-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((v) => !v)}
            className={emojiButton}
            title="Choose an emoji"
          >
            {emoji}
          </button>
        </label>
        {showEmojiPicker && (
          <div className={emojiPicker}>
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onEmojiChange(e);
                  setShowEmojiPicker(false);
                }}
                className={emojiOption}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className={label}>Title and source</p>
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            placeholder="e.g. Understanding Terraform State Management"
            maxLength={100}
            className={titleTouched && !title.trim() ? inputError : input}
          />
          {titleTouched && !title.trim() && (
            <p className="text-xs text-danger">Title is required.</p>
          )}
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={2}
            placeholder="Description (optional)"
            className={`${input} resize-none`}
          />
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => onSourceUrlChange(e.target.value)}
            placeholder="Source article URL (optional)"
            className={input}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className={label}>Topic</p>
          <input
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="e.g. DevOps"
            className={input}
          />
        </div>
        <div>
          <p className={label}>Duration</p>
          <select
            value={durationMin}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            className={input}
          >
            {DURATIONS.map((min) => (
              <option key={min} value={min}>
                {min} minutes
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className={label}>Pass mark</p>
          <select
            value={passMark}
            onChange={(e) => onPassMarkChange(Number(e.target.value))}
            className={input}
          >
            {PASS_MARKS.map((mark) => (
              <option key={mark} value={mark}>
                {mark}%
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
