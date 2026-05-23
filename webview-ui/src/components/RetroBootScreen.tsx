import "./RetroBootScreen.css";

import { type KeyboardEvent, useState } from "react";

import { type LanguageCode, supportedLanguages, t } from "../i18n.js";
import { type HomePetRole,homePetRoles, homePetSlug } from "../pets/homePetVisuals.js";

interface RetroBootScreenProps {
  onStart: () => void;
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
}

function PixelPetSprite({ role }: { role: HomePetRole }) {
  const slug = homePetSlug(role.label);

  return (
    <div
      className="retro-pet"
      aria-label={role.label}
      title={role.label}
      style={{ backgroundImage: `url(/assets/thronglets/home-pets/${slug}/${slug}--happy.png)` }}
    />
  );
}

function BootScreenOverlay({ onStart, language, onLanguageChange }: RetroBootScreenProps) {
  const [archiveMenuOpen, setArchiveMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onStart();
    }
  };

  return (
    <div className="retro-boot-overlay" role="dialog" aria-label="Retro boot screen" data-language={language}>
      <div className="floating-ui-layer retro-home-menu-layer" data-no-mobile-drag="true">
        <div className="global-archive-menu">
          <button
            className="global-archive-trigger"
            type="button"
            aria-label="schema / news / archive"
            aria-expanded={archiveMenuOpen}
            onClick={() => setArchiveMenuOpen((open) => !open)}
          >
            <span className="global-archive-peach pbs-emoji-control" aria-hidden="true">🍑</span>
          </button>
          {archiveMenuOpen && (
            <section className="archive-tree-menu global-menu-options retro-home-archive-options pbs-frame F1 pbs-frame-f1 pixel-panel" role="menu">
              <p className="archive-tree-kicker pbs-frame-kicker">🍑</p>
              <div className="archive-tree-options">
                <button className="pbs-frame-button" type="button" role="menuitem">1. schema</button>
                <button className="pbs-frame-button" type="button" role="menuitem">2. {t(language, "archive.newsTitle")}</button>
                <button className="pbs-frame-button" type="button" role="menuitem">3. {t(language, "archive.ebookButton")}</button>
                <button className="pbs-frame-button" type="button" role="menuitem">4. {t(language, "archive.mapButton")}</button>
              </div>
            </section>
          )}
        </div>
        <div className="global-language-menu">
          <button
            className="global-language-trigger"
            type="button"
            aria-label={t(language, "language.menuLabel")}
            aria-expanded={languageMenuOpen}
            onClick={() => setLanguageMenuOpen((open) => !open)}
          >
            <span className="global-language-globe pbs-emoji-control" aria-hidden="true">🌏</span>
          </button>
          {languageMenuOpen && (
            <div className="global-language-options" role="menu">
              {supportedLanguages.map((entry) => (
                <button
                  key={entry.code}
                  className={entry.code === language ? "is-active" : ""}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onLanguageChange(entry.code);
                    setLanguageMenuOpen(false);
                  }}
                >
                  <span lang={entry.code}>{entry.nativeName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="retro-boot-stage pbs-frame F1 pbs-frame-f1">
        <div className="retro-sticker-bar">
          <span>PBS-2026</span>
          <span>HACKER CAMP PORN</span>
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
