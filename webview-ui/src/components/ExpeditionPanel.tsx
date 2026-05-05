import { useEffect, useMemo, useState } from 'react';

import { type LanguageCode, t } from '../i18n.js';
import { runExpedition } from '../expedition/expeditionRunner.js';
import type { ExpeditionEvent, ExpeditionPersona, ExpeditionReport } from '../expedition/types.js';
import type { PlayerProfile } from './PlayerSetup.js';

interface ExpeditionPanelProps {
  avatar: PlayerProfile;
  personas: ExpeditionPersona[];
  isOpen: boolean;
  language: LanguageCode;
  onClose: () => void;
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-border bg-bg/70 px-5 py-4">
      <h4 className="text-sm uppercase tracking-wide text-accent-bright mb-3">{title}</h4>
      <ul className="list-disc pl-5 text-sm leading-relaxed text-text-muted">
        {items.map((item) => (
          <li key={item} className="mb-2 last:mb-0">{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ExpeditionPanel({ avatar, personas, isOpen, language, onClose }: ExpeditionPanelProps) {
  const [mission, setMission] = useState(avatar.mission);
  const [maxRounds, setMaxRounds] = useState(10);
  const [selectedNpcIds, setSelectedNpcIds] = useState<string[]>(() => personas.slice(0, 6).map((persona) => persona.id));
  const [queuedEvents, setQueuedEvents] = useState<ExpeditionEvent[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<ExpeditionEvent[]>([]);
  const [report, setReport] = useState<ExpeditionReport | null>(null);
  const [pendingReport, setPendingReport] = useState<ExpeditionReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const personaById = useMemo(() => new Map(personas.map((persona) => [persona.id, persona])), [personas]);

  useEffect(() => {
    if (!isRunning || queuedEvents.length === 0) return;
    const id = window.setTimeout(() => {
      const [next, ...rest] = queuedEvents;
      setVisibleEvents((current) => [...current, next]);
      setQueuedEvents(rest);
      if (rest.length === 0) {
        setReport(pendingReport);
        setPendingReport(null);
        setIsRunning(false);
      }
    }, 360);
    return () => window.clearTimeout(id);
  }, [isRunning, pendingReport, queuedEvents]);

  function toggleNpc(npcId: string): void {
    setSelectedNpcIds((current) =>
      current.includes(npcId) ? current.filter((id) => id !== npcId) : [...current, npcId],
    );
  }

  function handleRun(): void {
    const result = runExpedition({
      avatar,
      language,
      mission,
      selectedNpcIds,
      maxRounds,
      mode: 'template-simulation',
      personas,
    });
    setVisibleEvents([]);
    setReport(null);
    setPendingReport(result.report);
    setQueuedEvents(result.events);
    setIsRunning(true);
  }

  if (!isOpen) return null;

  return (
    <section className="absolute inset-0 z-47 flex items-center justify-center bg-black/45 px-4 py-4">
      <div className="pixel-panel h-[min(920px,92vh)] w-[min(1280px,96vw)] overflow-auto px-8 py-7 text-text shadow-pixel">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-accent-bright mb-2">{t(language, 'templateSimulation')}</p>
            <h2 className="text-2xl leading-none">{t(language, 'expeditionTitle')}</h2>
            <p className="text-sm text-text-muted mt-3 leading-snug">{t(language, 'expeditionDescription')}</p>
          </div>
          <button className="text-2xl text-text-muted hover:text-text" type="button" onClick={onClose}>x</button>
        </div>

        <div className="border border-border bg-bg/70 px-5 py-4 mb-5">
          <p className="text-sm text-accent-bright mb-1">{t(language, 'expeditionPlayerSummary')}: {avatar.name} / {avatar.currentRole}</p>
          <p className="text-sm text-text-muted">{t(language, 'expeditionConstraints')}: {avatar.constraints?.trim() || t(language, 'expeditionNoConstraints')}</p>
          <p className="text-sm text-text-muted mt-2">{t(language, 'expeditionSkills')}: {avatar.skills?.trim() || t(language, 'expeditionNoConstraints')}</p>
        </div>

        <label className="block text-sm text-text-muted mb-2" htmlFor="expedition-mission">{t(language, 'expeditionMission')}</label>
        <textarea
          id="expedition-mission"
          className="w-full min-h-[110px] bg-bg border-2 border-border px-4 py-3 text-base text-text outline-none focus:border-accent-bright mb-5"
          value={mission}
          onChange={(event) => setMission(event.target.value)}
        />

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="text-sm text-text-muted">{t(language, 'expeditionMaxRounds')}</span>
          {[5, 10, 20].map((rounds) => (
            <button
              key={rounds}
              className={`${maxRounds === rounds ? 'bg-accent text-white border-accent' : 'bg-bg text-text border-border'} border px-4 py-2 text-sm`}
              type="button"
              onClick={() => setMaxRounds(rounds)}
            >
              {rounds}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-sm text-text-muted mb-3">{t(language, 'expeditionSelectedNpcs')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {personas.map((persona) => (
              <label key={persona.id} className="border border-border bg-bg/60 px-3 py-3 text-sm cursor-pointer">
                <input
                  className="mr-2"
                  type="checkbox"
                  checked={selectedNpcIds.includes(persona.id)}
                  onChange={() => toggleNpc(persona.id)}
                />
                {persona.name}
              </label>
            ))}
          </div>
        </div>

        <button
          className="w-full bg-accent text-white border-2 border-accent px-6 py-4 text-lg shadow-pixel disabled:opacity-60"
          type="button"
          onClick={handleRun}
          disabled={isRunning}
        >
          {isRunning ? t(language, 'expeditionRunning') : t(language, 'expeditionRun')}
        </button>

        <div className="mt-7 border border-border bg-black/30 px-5 py-5">
          <h3 className="text-lg text-accent-bright mb-4">{t(language, 'expeditionLiveLog')}</h3>
          {visibleEvents.length === 0 ? (
            <p className="text-sm text-text-muted">{t(language, 'expeditionNoEvents')}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleEvents.map((event) => {
                const persona = personaById.get(event.npcId);
                return (
                  <article key={`${event.round}-${event.npcId}`} className="border border-border bg-bg/70 px-4 py-4">
                    <p className="text-sm text-accent-bright mb-2">
                      {t(language, 'expeditionRound')} {event.round}: {persona?.name ?? event.npcId} / {event.encounterType}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">{event.npcContribution}</p>
                    <p className="text-sm leading-relaxed text-text-muted mb-2">{t(language, 'expeditionChallenge')}: {event.challengeToUser}</p>
                    <p className="text-sm leading-relaxed text-text-muted mb-2">{t(language, 'expeditionLead')}: {event.newLead}</p>
                    <p className="text-sm leading-relaxed text-text-muted">{t(language, 'expeditionNextQuestion')}: {event.nextQuestion}</p>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {report && (
          <div className="mt-7 flex flex-col gap-4">
            <div className="border-2 border-accent-bright bg-bg/80 px-5 py-5">
              <h3 className="text-xl text-accent-bright mb-3">{t(language, 'expeditionReport')}</h3>
              <p className="text-sm leading-relaxed mb-3"><span className="text-accent-bright">{t(language, 'expeditionOriginalMission')}: </span>{report.originalMission}</p>
              <p className="text-sm leading-relaxed mb-3"><span className="text-accent-bright">{t(language, 'expeditionInterpretedMission')}: </span>{report.interpretedMission}</p>
              <p className="text-sm leading-relaxed"><span className="text-accent-bright">{t(language, 'expeditionEmergentDirection')}: </span>{report.strongestEmergentDirection}</p>
            </div>
            <ReportList title={t(language, 'expeditionKeyEncounters')} items={report.keyEncounters} />
            <ReportList title={t(language, 'expeditionNpcDisagreements')} items={report.disagreementsBetweenNpcs} />
            <ReportList title={t(language, 'expeditionBlindSpots')} items={report.blindSpots} />
            <ReportList title={t(language, 'expeditionNextActions')} items={report.concreteNextActions} />
            <ReportList title={t(language, 'expeditionFollowUpQuestions')} items={report.followUpQuestions} />
            <ReportList title={t(language, 'expeditionResearchLeads')} items={report.openCallResearchLeads} />
          </div>
        )}
      </div>
    </section>
  );
}
