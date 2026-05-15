import "./RetroBootScreen.css";

import { type KeyboardEvent } from "react";

import { type HomePetRole,homePetRoles, homePetSlug } from "../pets/homePetVisuals.js";

interface RetroBootScreenProps {
  onStart: () => void;
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

function BootScreenOverlay({ onStart }: RetroBootScreenProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onStart();
    }
  };

  return (
    <div className="retro-boot-overlay" role="dialog" aria-label="Retro boot screen">
      <div className="retro-boot-stage pbs-frame F1 pbs-frame-f1">
        <div className="retro-sticker-bar">
          <span>PBS-2026</span>
          <span>HACKER CAMP PORN</span>
        </div>

        <div className="retro-screen">
          <div className="retro-title-card">
            <p className="retro-kicker">Non-Governmental Matters</p>
            <h1>Peach Blossom Spring</h1>
            <p>Dispatching a Thinking Life Simulator</p>
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

export function RetroBootScreen({ onStart }: RetroBootScreenProps) {
  return <BootScreenOverlay onStart={onStart} />;
}
