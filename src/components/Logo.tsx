interface LogoProps {
  size?: number;
}

export default function Logo({ size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Warm day */}
        <linearGradient id="logoBar1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4cc44" />
          <stop offset="50%" stopColor="#e8a735" />
          <stop offset="100%" stopColor="#c4cc44" />
        </linearGradient>
        {/* Mild day */}
        <linearGradient id="logoBar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5bb8d4" />
          <stop offset="50%" stopColor="#6dbe88" />
          <stop offset="100%" stopColor="#5bb8d4" />
        </linearGradient>
        {/* Cool day */}
        <linearGradient id="logoBar3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82c4" />
          <stop offset="50%" stopColor="#5bb8d4" />
          <stop offset="100%" stopColor="#3b82c4" />
        </linearGradient>
        <clipPath id="bar3Clip">
          <rect x="33" y="4" width="11" height="40" rx="3" />
        </clipPath>
      </defs>
      <rect x="4" y="4" width="11" height="40" rx="3" fill="url(#logoBar1)" />
      <rect x="18.5" y="4" width="11" height="40" rx="3" fill="url(#logoBar3)" />
      <rect x="33" y="4" width="11" height="40" rx="3" fill="url(#logoBar2)" />
      {/* Rain streaks on third column */}
      <g opacity="0.6" clipPath="url(#bar3Clip)">
        <line
          x1="35"
          y1="10"
          x2="36"
          y2="16"
          stroke="white"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        <line
          x1="39"
          y1="8"
          x2="40"
          y2="14"
          stroke="white"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        <line
          x1="37"
          y1="18"
          x2="38"
          y2="24"
          stroke="white"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        <line
          x1="41"
          y1="20"
          x2="42"
          y2="26"
          stroke="white"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        <line
          x1="35"
          y1="27"
          x2="36"
          y2="33"
          stroke="white"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        <line
          x1="39"
          y1="30"
          x2="40"
          y2="36"
          stroke="white"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        <line
          x1="37"
          y1="37"
          x2="38"
          y2="43"
          stroke="white"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
