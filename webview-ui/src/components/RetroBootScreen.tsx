import "./RetroBootScreen.css";

import { type KeyboardEvent } from "react";

import { type LanguageCode, t } from "../i18n.js";
import { type HomePetRole,homePetRoles, homePetSlug } from "../pets/homePetVisuals.js";

interface RetroBootScreenProps {
  onStart: () => void;
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
}

function PixelPetSprite({ role }: { role: HomePetRole }) {
  const slug = homePetSlug(role.label);
  const src = `assets/thronglets/home-pets/${slug}/${slug}--happy.png`;

  return (
    <div
      className="retro-pet"
      aria-label={role.label}
      title={role.label}
      style={{ backgroundImage: `url(${src})` }}
    />
  );
}

function BootScreenOverlay({ onStart, language }: RetroBootScreenProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onStart();
    }
  };

  return (
      <div className="retro-boot-overlay" role="dialog" aria-label="Retro boot screen" data-language={language}>
      <div className="retro-boot-stage pbs-frame F1 pbs-frame-f1">
        <div className="retro-sticker-bar">
          <span>PBS-2026</span>
          <span className="retro-version-stack"><span>PBS-2026.2.36</span><span>HACKER CAMP PORN</span></span>
        </div>

        <div className="retro-screen">
          <div className="retro-title-card" data-language={language}>
            <p className="retro-kicker">Non-Governmental Matters</p>
            <h1>{t(language, "home.title")}</h1>
            <p>Dipatching a LLM wiki tamagotchi</p>
            <button className="retro-start-button" type="button" onClick={onStart} onKeyDown={handleKeyDown} autoFocus>
              PRESS START
            </button>
          </div>

          <div className="retro-pet-field" aria-hidden="true">
            <div className="retro-pet-marquee">
              {[...homePetRoles, ...homePetRoles].map((role, index) => (
                <PixelPetSprite key={`${role.label}-${index}`} role={role} />
              ))}
            </div>
          </div>
        </div>

        <div className="retro-console-label">
          <span>Wise Mouse Culture</span>
          <span>WORLD CONSOLE MODE</span>
        </div>
      </div>
    </div>
  );
}

export function RetroBootScreen({ onStart, language, onLanguageChange }: RetroBootScreenProps) {
  return <BootScreenOverlay onStart={onStart} language={language} onLanguageChange={onLanguageChange} />;
}
