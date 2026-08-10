type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  variant?: 'light' | 'dark';
};

// sm is the NavBar's size — deliberately smaller/tighter than md/lg (used
// on marketing hero-adjacent contexts) so the icon square doesn't dominate
// the wordmark next to it.
const ICON_SIZES: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 28,
  md: 56,
  lg: 72,
};

const WORDMARK: Record<NonNullable<LogoProps['size']>, { fontSize: number; fontWeight: number; letterSpacing: string }> = {
  sm: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px' },
  md: { fontSize: 22, fontWeight: 500, letterSpacing: '-0.5px' },
  lg: { fontSize: 22, fontWeight: 500, letterSpacing: '-0.5px' },
};

export default function Logo({ size = 'md', showTagline = false, variant = 'dark' }: LogoProps) {
  const iconSize = ICON_SIZES[size];
  const wordmark = WORDMARK[size];
  const textColor = variant === 'light' ? '#18181B' : '#ffffff';
  const taglineColor = variant === 'light' ? 'text-[#A1A1AA]' : 'text-gray-400';

  return (
    <div className="flex items-center gap-3">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="56" height="56" rx="13" fill="#3E7BFA" />
        <path
          d="M20 20C20 14 26 11 32 13.5C36.5 15.4 37.5 21 33.5 24C30.8 26 28.5 27 28.5 32"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="28.5" cy="41" r="3.2" fill="white" />
        <path
          d="M8 38L13.5 44L23 32"
          stroke="#3ECF8E"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      <div className="flex flex-col justify-center leading-tight">
        <span className="font-heading" style={wordmark}>
          <span style={{ color: textColor }}>Quiz</span>
          <span style={{ color: '#3E7BFA' }}>Ops</span>
        </span>
        {showTagline && (
          <span className={`font-body ${taglineColor}`} style={{ fontSize: 12 }}>
            test your knowledge
          </span>
        )}
      </div>
    </div>
  );
}
