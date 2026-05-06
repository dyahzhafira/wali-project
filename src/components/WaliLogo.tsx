interface WaliLogoProps {
  size?: number;
  className?: string;
}

export default function WaliLogo({ size = 48, className = "" }: WaliLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="waliBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#066A5F" />
          <stop offset="100%" stopColor="#2a9e8e" />
        </linearGradient>
        <linearGradient id="waliFin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
        </linearGradient>
      </defs>

      {/* Badge circle background */}
      <circle cx="40" cy="40" r="38" fill="url(#waliBg)" />

      {/* Tail fin (left, fan shape) */}
      <path
        d="M16 40 L6 27 Q10 35 10 40 Q10 45 6 53 Z"
        fill="url(#waliFin)"
      />

      {/* Body */}
      <ellipse cx="43" cy="42" rx="22" ry="14" fill="white" opacity="0.95" />

      {/* Head (right side, wider) */}
      <ellipse cx="59" cy="42" rx="12" ry="13" fill="white" opacity="0.95" />

      {/* Dorsal fin (top) */}
      <path
        d="M38 29 Q44 18 54 22 Q52 27 46 28 Z"
        fill="rgba(255,255,255,0.88)"
      />

      {/* Armor body texture / spots */}
      <circle cx="36" cy="40" r="3.5" fill="rgba(6,106,95,0.22)" />
      <circle cx="45" cy="45" r="3" fill="rgba(6,106,95,0.22)" />
      <circle cx="53" cy="39" r="2.5" fill="rgba(6,106,95,0.22)" />
      <circle cx="42" cy="50" r="2" fill="rgba(6,106,95,0.18)" />

      {/* Pectoral fin (bottom) */}
      <path
        d="M50 52 Q42 62 36 57 Q41 53 50 52 Z"
        fill="rgba(255,255,255,0.75)"
      />

      {/* Eye white */}
      <circle cx="62" cy="37" r="5" fill="#1b6560" />
      <circle cx="62" cy="37" r="3.5" fill="white" />
      <circle cx="62" cy="37" r="2" fill="#1b6560" />
      {/* Eye shine */}
      <circle cx="61" cy="36" r="0.9" fill="white" />

      {/* Sucker mouth */}
      <ellipse cx="70" cy="47" rx="4.5" ry="4" fill="#066A5F" />
      <circle cx="70" cy="47" r="2.2" fill="rgba(255,255,255,0.25)" />
      <circle cx="70" cy="47" r="1" fill="rgba(0,0,0,0.15)" />
    </svg>
  );
}
