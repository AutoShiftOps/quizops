'use client';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  href?: string;
}

export default function Logo({
  size = 'md',
  showWordmark = true,
  href = '/',
}: LogoProps) {
  const dimensions = {
    sm: 32, md: 40, lg: 56
  };
  const px = dimensions[size];

  const mark = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="QuizOps logo mark"
    >
      {/* Clean blue square background — no gradient, sophistication comes
          from the wordmark, not the icon */}
      <rect
        width="40" height="40"
        rx="9"
        fill="#3E7BFA"
      />
      {/* Bold Q letterform — geometric, clean */}
      <circle
        cx="20" cy="19" r="8"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Tail of Q — diagonal stroke bottom right */}
      <line
        x1="25" y1="24"
        x2="29" y2="28"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );

  const wordmark = showWordmark ? (
    <span style={{
      fontSize: size === 'sm' ? 20 : size === 'md' ? 22 : 28,
      fontWeight: 800,
      letterSpacing: '-0.6px',
      lineHeight: 1,
    }}>
      <span style={{ color: '#F1F5F9' }}>Quiz</span>
      <span style={{ color: '#3E7BFA' }}>Ops</span>
    </span>
  ) : null;

  const content = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: size === 'sm' ? 8 : 10,
    }}>
      {mark}
      {wordmark}
    </div>
  );

  return href ? (
    <Link href={href} style={{
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
    }}>
      {content}
    </Link>
  ) : content;
}
