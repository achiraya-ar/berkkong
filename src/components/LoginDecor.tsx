export function CornerStars() {
  return (
    <div className="login-v2__corner-stars" aria-hidden="true">
      <ToonSparkle className="login-v2__corner-star login-v2__corner-star--big" />
      <ToonSparkle className="login-v2__corner-star login-v2__corner-star--mid" />
      <ToonSparkle className="login-v2__corner-star login-v2__corner-star--small" />
    </div>
  );
}

export function ToonSparkle({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M 20 1 L 24.5 15.5 L 39 20 L 24.5 24.5 L 20 39 L 15.5 24.5 L 1 20 L 15.5 15.5 Z"
        fill="#ffe066"
        stroke="#1b1516"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
