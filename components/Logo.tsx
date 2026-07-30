type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
};

const ICON_SIZES: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 40,
  md: 56,
  lg: 72,
};

export default function Logo({ size = 'md', showTagline = false }: LogoProps) {
  const iconSize = ICON_SIZES[size];

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
        <span
          className="font-heading"
          style={{ fontSize: 22, letterSpacing: '-0.5px', fontWeight: 500 }}
        >
          <span style={{ color: 'var(--foreground)' }}>Quiz</span>
          <span style={{ color: '#3E7BFA' }}>Ops</span>
        </span>
        {showTagline && (
          <span className="font-body text-gray-400" style={{ fontSize: 12 }}>
            test your knowledge
          </span>
        )}
      </div>
    </div>
  );
}
