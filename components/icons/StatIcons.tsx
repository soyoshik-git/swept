/** 3Dライク SVGアイコン — ラジアルグラデーション + ハイライト + ドロップシャドウ */

const SIZE = 64;

export function CompletionIcon() {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id="ci-bg" cx="38%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </radialGradient>
        <radialGradient id="ci-inner" cx="38%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#10b981" />
        </radialGradient>
        <filter id="ci-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#059669" floodOpacity="0.35" />
        </filter>
      </defs>
      {/* 外周リング（奥行き感） */}
      <circle cx="32" cy="34" r="27" fill="#047857" />
      {/* メイン円 */}
      <circle cx="32" cy="31" r="27" fill="url(#ci-bg)" filter="url(#ci-shadow)" />
      {/* トップハイライト */}
      <ellipse cx="25" cy="20" rx="12" ry="7" fill="white" opacity="0.22" />
      {/* チェックマーク */}
      <path
        d="M19 32 L27 41 L45 22"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PointsIcon() {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id="pi-bg" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="100%" stopColor="#4338ca" />
        </radialGradient>
        <radialGradient id="pi-face" cx="38%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#c7d2fe" />
          <stop offset="100%" stopColor="#6366f1" />
        </radialGradient>
        <filter id="pi-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#4338ca" floodOpacity="0.35" />
        </filter>
      </defs>
      {/* コインの厚み（下段） */}
      <ellipse cx="32" cy="37" rx="24" ry="8" fill="#3730a3" />
      {/* コイン側面 */}
      <rect x="8" y="27" width="48" height="10" fill="#4338ca" />
      {/* コイン表面 */}
      <ellipse cx="32" cy="27" rx="24" ry="8" fill="url(#pi-bg)" filter="url(#pi-shadow)" />
      {/* 表面グラデーション */}
      <ellipse cx="32" cy="27" rx="20" ry="6.5" fill="url(#pi-face)" />
      {/* ハイライト */}
      <ellipse cx="26" cy="23" rx="8" ry="3" fill="white" opacity="0.28" />
      {/* "pt" テキスト */}
      <text
        x="32"
        y="31"
        textAnchor="middle"
        fill="white"
        fontSize="9"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.5"
      >
        pt
      </text>
    </svg>
  );
}

export function PenaltyIcon() {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 64 64" fill="none">
      <defs>
        <radialGradient id="ali-bg" cx="38%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#dc2626" />
        </radialGradient>
        <filter id="ali-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#dc2626" floodOpacity="0.35" />
        </filter>
      </defs>
      {/* 外周リング */}
      <circle cx="32" cy="34" r="27" fill="#b91c1c" />
      {/* メイン円 */}
      <circle cx="32" cy="31" r="27" fill="url(#ali-bg)" filter="url(#ali-shadow)" />
      {/* ハイライト */}
      <ellipse cx="25" cy="20" rx="12" ry="7" fill="white" opacity="0.22" />
      {/* エクスクラメーション（縦棒） */}
      <rect x="29.5" y="17" width="5" height="16" rx="2.5" fill="white" />
      {/* エクスクラメーション（点） */}
      <circle cx="32" cy="41" r="3" fill="white" />
    </svg>
  );
}

export function RankIcon() {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="ri-cup" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="ri-base" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="ri-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#b45309" floodOpacity="0.35" />
        </filter>
      </defs>
      <g filter="url(#ri-shadow)">
        {/* カップ本体 */}
        <path
          d="M16 12 L20 42 Q32 47 44 42 L48 12 Z"
          fill="url(#ri-cup)"
        />
        {/* 左ハンドル */}
        <path
          d="M16 18 Q6 22 8 32 Q10 40 20 38"
          stroke="#d97706"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* 右ハンドル */}
        <path
          d="M48 18 Q58 22 56 32 Q54 40 44 38"
          stroke="#d97706"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* ステム */}
        <rect x="28" y="42" width="8" height="8" fill="#d97706" />
        {/* ベース */}
        <rect x="20" y="50" width="24" height="5" rx="2.5" fill="url(#ri-base)" />
      </g>
      {/* カップ内ハイライト */}
      <ellipse cx="28" cy="20" rx="8" ry="5" fill="white" opacity="0.25" />
      {/* 星 */}
      <path
        d="M32 18 L33.8 23.5 L39.5 23.5 L34.9 26.9 L36.7 32.5 L32 29.1 L27.3 32.5 L29.1 26.9 L24.5 23.5 L30.2 23.5 Z"
        fill="white"
        opacity="0.85"
      />
    </svg>
  );
}
