import { useState, type KeyboardEvent } from "react";
import { BrandWordmark } from "./BrandMark";
import { LogoMascot } from "./LogoMascot";
import { CornerStars, ToonSparkle } from "./LoginDecor";

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [booting, setBooting] = useState(false);

  const startLogin = () => {
    if (booting) return;
    setBooting(true);
    window.setTimeout(onLogin, 620);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startLogin();
    }
  };

  return (
    <div className="login-v2">
      <div className="login-v2__pattern" aria-hidden="true" />
      <div className="login-v2__ear login-v2__ear--tl" aria-hidden="true" />
      <CornerStars />

      <main className="login-splash">
        <BrandWordmark />
        <span className="login-splash__pill">ระบบเบิกของ</span>

        <div className="login-mascot-stage">
          <ToonSparkle className="login-toon__spark login-toon__spark--a" />
          <ToonSparkle className="login-toon__spark login-toon__spark--b" />
          <ToonSparkle className="login-toon__spark login-toon__spark--c" />

          <button
            type="button"
            className={`login-mascot ${booting ? "is-booting" : ""}`}
            aria-label="คลิกที่มาสคอตเพื่อเข้าสู่ระบบ"
            title="คลิกที่มาสคอตเพื่อเข้าสู่ระบบ"
            onClick={startLogin}
            onKeyDown={handleKeyDown}
          >
            <span className="login-mascot__logo-image">
              <LogoMascot />
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
