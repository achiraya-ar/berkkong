import { useEffect, useState } from "react";

const SCREEN_PROMPT = [
  {
    text: "เข้าสู่ระบบเบิกของ",
    className: "login-logo__prompt-line login-logo__prompt-line--1",
    fill: "#1F2937",
    y: 325,
  },
  {
    text: "คลิกที่นี่เพื่อเริ่ม",
    className: "login-logo__prompt-line login-logo__prompt-line--2",
    fill: "#C51020",
    y: 390,
  },
];

export function LogoMascot() {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [typedLines, setTypedLines] = useState<string[]>(() =>
    reduceMotion ? SCREEN_PROMPT.map((line) => line.text) : SCREEN_PROMPT.map(() => ""),
  );
  const [typingLine, setTypingLine] = useState(reduceMotion ? -1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => {
          const index = timers.indexOf(id);
          if (index >= 0) timers.splice(index, 1);
          resolve();
        }, ms);
        timers.push(id);
      });

    const run = async () => {
      while (!cancelled) {
        for (let line = 0; line < SCREEN_PROMPT.length; line += 1) {
          if (cancelled) return;
          setTypingLine(line);
          const text = SCREEN_PROMPT[line].text;
          for (let index = 1; index <= text.length; index += 1) {
            if (cancelled) return;
            setTypedLines((previous) => {
              const next = [...previous];
              next[line] = text.slice(0, index);
              return next;
            });
            await wait(90);
          }
          await wait(480);
        }
        await wait(2600);
        if (cancelled) return;
        setTypedLines(SCREEN_PROMPT.map(() => ""));
        await wait(500);
      }
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [reduceMotion]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 800"
      width="100%"
      height="100%"
      className="login-logo-svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="mickeyBlack3D" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#4B4F5C" />
          <stop offset="30%" stopColor="#222530" />
          <stop offset="70%" stopColor="#111318" />
          <stop offset="100%" stopColor="#050608" />
        </radialGradient>

        <radialGradient id="mickeyRedBg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#E63946" />
          <stop offset="70%" stopColor="#C51020" />
          <stop offset="100%" stopColor="#80000A" />
        </radialGradient>

        <linearGradient id="macBlackBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A2D3A" />
          <stop offset="50%" stopColor="#181A24" />
          <stop offset="100%" stopColor="#0E1017" />
        </linearGradient>

        <linearGradient id="macBlackBorder" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#404456" />
          <stop offset="100%" stopColor="#12141D" />
        </linearGradient>

        <linearGradient id="whiteScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F3F4F6" />
        </linearGradient>

        <linearGradient id="yellowBtnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFDE59" />
          <stop offset="100%" stopColor="#FF914D" />
        </linearGradient>

        <filter id="mickey3DRelief" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow
            dx="0"
            dy="25"
            stdDeviation="22"
            floodColor="#000000"
            floodOpacity="0.8"
          />
          <feDropShadow
            dx="0"
            dy="-5"
            stdDeviation="8"
            floodColor="#555A6E"
            floodOpacity="0.4"
          />
        </filter>

        <filter id="mickeyShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="18"
            stdDeviation="20"
            floodColor="#000000"
            floodOpacity="0.55"
          />
        </filter>
      </defs>

      <rect width="800" height="800" rx="160" fill="url(#mickeyRedBg)" />

      <g filter="url(#mickey3DRelief)">
        <circle cx="200" cy="190" r="145" fill="url(#mickeyBlack3D)" />
        <circle cx="600" cy="190" r="145" fill="url(#mickeyBlack3D)" />
        <circle cx="400" cy="400" r="230" fill="url(#mickeyBlack3D)" />
      </g>

      <g opacity="0.25" pointerEvents="none">
        <ellipse
          cx="150"
          cy="130"
          rx="45"
          ry="25"
          fill="#FFFFFF"
          transform="rotate(-30 150 130)"
        />
        <ellipse
          cx="550"
          cy="130"
          rx="45"
          ry="25"
          fill="#FFFFFF"
          transform="rotate(-30 550 130)"
        />
        <ellipse
          cx="320"
          cy="270"
          rx="90"
          ry="45"
          fill="#FFFFFF"
          transform="rotate(-25 320 270)"
        />
      </g>

      <g className="login-logo__laptop">
        <g filter="url(#mickeyShadow)" transform="translate(0, -20)">
          <rect
            x="160"
            y="200"
            width="480"
            height="320"
            rx="20"
            fill="url(#macBlackBody)"
            stroke="url(#macBlackBorder)"
            strokeWidth="4"
          />
          <rect x="175" y="215" width="450" height="290" rx="10" fill="#0A0B10" />
          <rect
            x="180"
            y="220"
            width="440"
            height="280"
            rx="6"
            fill="url(#whiteScreenGrad)"
          />

          <path
            d="M 370 215 L 430 215 L 426 227 C 424 230 420 231 416 231 L 384 231 C 380 231 376 230 374 227 Z"
            fill="#0A0B10"
          />
          <circle cx="400" cy="222" r="3" fill="#222533" />

          <g transform="translate(198, 236)">
            <circle cx="0" cy="0" r="6" fill="#FF5F56" />
            <circle cx="18" cy="0" r="6" fill="#FFBD2E" />
            <circle cx="36" cy="0" r="6" fill="#27C93F" />
          </g>

          <g className="login-logo__prompt-group" textAnchor="start">
            {SCREEN_PROMPT.map((line, index) => (
              <text
                key={line.text}
                x="240"
                y={line.y}
                className={line.className}
                fill={line.fill}
              >
                {typedLines[index]}
                {typingLine === index && !reduceMotion && (
                  <tspan className="login-logo__prompt-cursor" dx="2">
                    |
                  </tspan>
                )}
              </text>
            ))}
          </g>

          <path
            d="M 120 520 L 680 520 L 660 540 C 650 546 630 548 610 548 L 190 548 C 170 548 150 546 140 540 Z"
            fill="url(#macBlackBody)"
            stroke="url(#macBlackBorder)"
            strokeWidth="2"
          />
          <path
            d="M 350 520 L 450 520 L 445 526 C 440 529 430 530 420 530 L 380 530 C 370 530 360 529 355 526 Z"
            fill="#12141D"
          />
        </g>
      </g>

      <g filter="url(#mickeyShadow)">
        <ellipse cx="330" cy="670" rx="36" ry="52" fill="url(#yellowBtnGrad)" />
        <ellipse cx="470" cy="670" rx="36" ry="52" fill="url(#yellowBtnGrad)" />
      </g>
    </svg>
  );
}
