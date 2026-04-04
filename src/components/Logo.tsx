interface LogoProps {
  size?: number;
}

export default function Logo({ size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 4 48 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Calendar body */}
      <rect x="4" y="10" width="40" height="34" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
      {/* Calendar top bar */}
      <rect x="4" y="10" width="40" height="10" rx="4" fill="#334155" />
      <rect x="4" y="16" width="40" height="4" fill="#334155" />
      {/* Calendar rings */}
      <rect x="15" y="6" width="3.5" height="9" rx="1.75" fill="#64748b" />
      <rect x="29.5" y="6" width="3.5" height="9" rx="1.75" fill="#64748b" />
      {/* Sun peeking behind cloud */}
      <circle cx="30" cy="28" r="7" fill="#e8a735" />
      {/* Cloud in front of sun */}
      <ellipse cx="22" cy="34" rx="12" ry="6.5" fill="#b0bec5" />
      <ellipse cx="16" cy="31" rx="7" ry="5.5" fill="#cbd5e1" />
      <ellipse cx="27" cy="30" rx="6" ry="5" fill="#cbd5e1" />
    </svg>
  );
}
