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
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="QuizOps logo mark"
    >
      <defs>
        <linearGradient
          id="qo-grad"
          x1="0" y1="0" x2="80" y2="80"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3E7BFA"/>
          <stop offset="100%" stopColor="#22C55E"/>
        </linearGradient>
      </defs>
      {/* Background */}
      <rect
        width="80" height="80" rx="18"
        fill="#0D1829"
      />
      <rect
        width="80" height="80" rx="18"
        fill="none"
        stroke="url(#qo-grad)"
        strokeWidth="1.5"
        opacity="0.5"
      />
      {/* Q circle with gap */}
      <circle
        cx="40" cy="38" r="16"
        stroke="url(#qo-grad)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="75 25"
        strokeDashoffset="10"
      />
      {/* Check tail */}
      <path
        d="M48 48 L55 55 L68 40"
        stroke="#22C55E"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
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
      <span style={{
        background: 'linear-gradient(90deg, #3E7BFA, #22C55E)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>Ops</span>
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
