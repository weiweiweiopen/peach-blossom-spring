import { useMemo, useRef, useState } from "react";

import { type LanguageCode, t } from "../i18n.js";
import {
  generateQuestionPet,
  makePetSeed,
} from "../pets/generateQuestionPet.js";
import { type PetDispatch } from "../pets/petStore.js";
import { QuestionPetPreview } from "../pets/QuestionPetPreview.js";
import {
  createEntryProfile,
  type EntryPlayerProfile,
} from "./playerProfileMapping.js";

type PlayerProfile = EntryPlayerProfile;

type StartMode = "interactive" | "dispatch_observer";

interface ArchiveSummary {
  total: number;
  active: number;
  hibernating: number;
  archived: number;
  notes: number;
}

interface PlayerSetupProps {
  language: LanguageCode;
  onStart: (profile: PlayerProfile, mode: StartMode) => void;
  defaultProfile: PlayerProfile | null;
  archiveSummary: ArchiveSummary;
  recentPets: PetDispatch[];
  onClearArchive: () => void;
}

export function PlayerSetup({
  language,
  onStart,
  defaultProfile,
  archiveSummary,
  recentPets,
  onClearArchive,
}: PlayerSetupProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [questionAndLink, setQuestionAndLink] = useState(
    defaultProfile?.question ?? defaultProfile?.mission ?? "",
  );
  const [petSeed] = useState(
    () =>
      defaultProfile?.petSeed ??
      makePetSeed(defaultProfile?.question ?? "peach-blossom-lifeform", 1),
  );
  const [archiveOpen, setArchiveOpen] = useState(false);
  const appearance = useMemo(
    () =>
      generateQuestionPet(
        questionAndLink || t(language, "questionAndLinkPlaceholder"),
        petSeed,
      ),
    [language, petSeed, questionAndLink],
  );

  function handleStart(mode: StartMode) {
    const formElement = formRef.current;
    if (!formElement) return;
    const form = new FormData(formElement);
    const questionText = String(form.get("questionAndLink") ?? "").trim();
    if (!questionText) return;
    const name = String(form.get("name") ?? "").trim();
    onStart(
      createEntryProfile({
        name,
        questionAndLink: questionText,
        language,
        seed: petSeed,
        palette: appearance.seed % 6,
      }),
      mode,
    );
  }

  return (
    <div className="player-setup-overlay absolute inset-0 z-60 flex items-start justify-center overflow-auto peach-spring-entry-bg">
      <form
        ref={formRef}
        className="player-setup-panel question-hatch-panel w-[min(980px,100%)] max-h-[calc(100dvh-76px)] overflow-auto px-14 py-12 text-[var(--tama-ink)]"
        onSubmit={(event) => {
          event.preventDefault();
          handleStart("interactive");
        }}
      >
        <p className="player-setup-kicker text-sm uppercase tracking-wide mb-4">
          WorkAdventure-first allegorical simulator
        </p>
        <div className="grid md:grid-cols-[1fr_170px] gap-8 items-start">
          <div>
            <h1 className="player-setup-title leading-[1.15] mb-5">
              {t(language, "projectTitle")}
            </h1>
            <div className="player-setup-description entry-intro leading-[1.5] mb-8 max-w-[760px]">
              <p>{t(language, "projectIntro")}</p>
              <p className="mt-4 text-base leading-relaxed">
                {t(language === "zh-TW" ? "en" : "zh-TW", "projectIntro")}
              </p>
            </div>

            <label
              className="player-setup-label block mb-3"
              htmlFor="peach-visitor-name"
            >
              {t(language, "nameLabel")}
            </label>
            <input
              id="peach-visitor-name"
              name="name"
              className="player-setup-field w-full px-6 py-5 outline-none mb-7"
              maxLength={32}
              defaultValue={defaultProfile?.name ?? ""}
              placeholder={language === "zh-TW" ? "名字 / Name" : "Name / 名字"}
              autoFocus
            />

            <label
              className="player-setup-label block mb-3"
              htmlFor="peach-question-link"
            >
              {t(language, "questionAndLinkLabel")}
            </label>
            <textarea
              id="peach-question-link"
              name="questionAndLink"
              required
              className="player-setup-field player-setup-textarea-large w-full min-h-[150px] px-6 py-5 outline-none mb-7"
              maxLength={1000}
              value={questionAndLink}
              onChange={(event) => setQuestionAndLink(event.target.value)}
              placeholder={t(language, "questionAndLinkPlaceholder")}
            />
          </div>

          <aside
            className="lifeform-decoration text-center px-5 py-6"
            aria-hidden="true"
          >
            <p className="pet-card-label mb-4">original lifeform</p>
            <QuestionPetPreview
              question={
                questionAndLink || t(language, "questionAndLinkPlaceholder")
              }
              appearance={appearance}
              size={7}
            />
            <p className="pet-card-label mt-4 leading-snug">
              indoor forest scout
            </p>
          </aside>
        </div>

        {archiveSummary.notes > 0 && (
          <p className="archive-inbox mt-2 mb-4 px-5 py-4">
            {t(language, "petReturnedNotes").replace(
              "{count}",
              String(archiveSummary.notes),
            )}
          </p>
        )}

        <section className="dispatch-archive mt-4 px-5 py-4">
          <button
            className="w-full flex items-center justify-between gap-4 text-left"
            type="button"
            onClick={() => setArchiveOpen((open) => !open)}
          >
            <span>
              {t(language, "dispatchArchive")} /{" "}
              {t(language, "localDispatchRecords")}
            </span>
            <span>
              {archiveSummary.total} · {t(language, "active")}{" "}
              {archiveSummary.active} · {t(language, "hibernating")}{" "}
              {archiveSummary.hibernating} · {t(language, "archived")}{" "}
              {archiveSummary.archived}
            </span>
          </button>
          {archiveOpen && (
            <div className="mt-4 border-t border-[var(--tama-ink)] pt-4">
              <p className="text-sm mb-3">{t(language, "localOnlyNotice")}</p>
              {recentPets.slice(0, 5).map((pet) => (
                <p key={pet.id} className="text-sm mb-2">
                  ✦ {pet.displayName}: {pet.question} ({pet.status}) ·{" "}
                  {pet.interactions.length} {t(language, "fieldNotes")}
                </p>
              ))}
              <button
                className="mt-3 px-4 py-2 border-2 border-[var(--tama-ink)]"
                type="button"
                onClick={onClearArchive}
              >
                {language === "zh-TW" ? "清空本機 demo" : "Clear local demo"}
              </button>
            </div>
          )}
        </section>

        <div className="player-setup-actions flex flex-col md:flex-row gap-5 mt-7">
          <button
            className="player-setup-action flex-1 mode-primary px-8 py-5 shadow-pixel"
            type="submit"
          >
            {t(language, "enterPeachSpring")}
          </button>
          <button
            className="player-setup-action flex-1 mode-secondary px-8 py-5 shadow-pixel"
            type="button"
            onClick={() => handleStart("dispatch_observer")}
          >
            {t(language, "dispatchLifeformOnly")}
          </button>
        </div>
      </form>
    </div>
  );
}

export type { PlayerProfile, StartMode };
