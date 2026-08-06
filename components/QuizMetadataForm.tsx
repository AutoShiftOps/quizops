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
}: Props) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
      <div>
        <label className="block text-2xl mb-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((v) => !v)}
            className="text-2xl px-3 py-1.5 rounded-md border border-border hover:border-accent transition-colors"
            title="Choose an emoji"
          >
            {emoji}
          </button>
        </label>
        {showEmojiPicker && (
          <div className="grid grid-cols-10 gap-1 mt-2 p-3 rounded-md border border-border bg-background">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onEmojiChange(e);
                  setShowEmojiPicker(false);
                }}
                className="text-xl hover:bg-surface rounded p-1"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
          Title and source
        </p>
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            placeholder="e.g. Understanding Terraform State Management"
            maxLength={100}
            className={`w-full px-3 py-2 rounded-md bg-background border outline-none ${
              titleTouched && !title.trim()
                ? 'border-red-500'
                : 'border-border focus:border-accent'
            }`}
          />
          {titleTouched && !title.trim() && (
            <p className="text-xs text-red-400">Title is required.</p>
          )}
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={2}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none resize-none"
          />
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => onSourceUrlChange(e.target.value)}
            placeholder="Source article URL (optional)"
            className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
            Topic
          </p>
          <input
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="e.g. DevOps"
            className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none"
          />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
            Duration
          </p>
          <select
            value={durationMin}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none"
          >
            {DURATIONS.map((min) => (
              <option key={min} value={min}>
                {min} minutes
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-2">
            Pass mark
          </p>
          <select
            value={passMark}
            onChange={(e) => onPassMarkChange(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none"
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
