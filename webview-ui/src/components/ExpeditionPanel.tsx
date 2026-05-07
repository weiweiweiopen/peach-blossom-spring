import { useEffect, useMemo, useState } from 'react';

import { runExpedition } from '../expedition/expeditionRunner.js';
import type { ExpeditionEvent, ExpeditionPersona, ExpeditionReport } from '../expedition/types.js';
import { type LanguageCode, t } from '../i18n.js';
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
    <div className="border border-border bg-bg px-5 py-4">
      <h4 className="text-base uppercase tracking-wide text-accent-bright mb-3">{title}</h4>
      <ul className="list-disc pl-5 text-base leading-relaxed text-text">
        {items.map((item) => (
          <li key={item} className="mb-2 last:mb-0">{item}</li>
        ))}
      </ul>
    </div>
  );
}

function buildReportMarkdown(report: ExpeditionReport, language: LanguageCode): string {
  const title = t(language, 'expedition.reportTitle');
  const sections: Array<[string, string[]]> = [
    [t(language, 'expedition.keyEncounters'), report.keyEncounters],
    [t(language, 'expedition.npcDisagreements'), report.disagreementsBetweenNpcs],
    [t(language, 'expedition.blindSpots'), report.blindSpots],
    [t(language, 'expedition.nextActions'), report.concreteNextActions],
    [t(language, 'expedition.followUpQuestions'), report.followUpQuestions],
    [t(language, 'expedition.researchLeads'), report.openCallResearchLeads],
  ];
  return [
    `# ${title}`,
    '',
    `## ${t(language, 'expedition.originalMission')}`,
    report.originalMission,
    '',
    `## ${t(language, 'expedition.interpretedMission')}`,
    report.interpretedMission,
    '',
    `## ${t(language, 'expedition.emergentDirection')}`,
    report.strongestEmergentDirection,
    '',
    ...sections.flatMap(([heading, items]) => [`## ${heading}`, ...items.map((item) => `- ${item}`), '']),
  ].join('\n');
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

  function handleDownloadReport(): void {
    if (!report) return;
    const markdown = buildReportMarkdown(report, language);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = t(language, 'expedition.reportFilename');
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!isOpen) return null;

  return (
    <section className="absolute inset-0 z-47 bg-bg px-0 py-0 text-text">
      <div className="h-full w-full overflow-auto px-8 py-7 text-text shadow-pixel">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-accent-bright mb-2">{t(language, 'expedition.templateSimulation')}</p>
            <h2 className="text-2xl leading-none">{t(language, 'expedition.title')}</h2>
            <p className="text-base text-text mt-3 leading-snug">{t(language, 'expedition.description')}</p>
          </div>
          <button className="text-2xl text-text hover:text-accent-bright" type="button" onClick={onClose}>x</button>
        </div>

        <div className="border border-border bg-bg px-5 py-4 mb-5">
          <p className="text-base text-accent-bright mb-1">{t(language, 'expedition.playerSummary')}: {avatar.name} / {avatar.currentRole}</p>
          <p className="text-base text-text">{t(language, 'expedition.constraints')}: {avatar.constraints?.trim() || t(language, 'expedition.noConstraints')}</p>
          <p className="text-base text-text mt-2">{t(language, 'expedition.skills')}: {avatar.skills?.trim() || t(language, 'expedition.noConstraints')}</p>
        </div>

        <label className="block text-base text-text mb-2" htmlFor="expedition-mission">{t(language, 'expedition.mission')}</label>
        <textarea
          id="expedition-mission"
          className="w-full min-h-[110px] bg-bg border-2 border-border px-4 py-3 text-base text-text outline-none focus:border-accent-bright mb-5"
          value={mission}
          onChange={(event) => setMission(event.target.value)}
        />

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="text-base text-text">{t(language, 'expedition.maxRounds')}</span>
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
          <p className="text-base text-text mb-3">{t(language, 'expedition.selectedNpcs')}</p>
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
          {isRunning ? t(language, 'expedition.running') : t(language, 'expedition.run')}
        </button>

        <div className="mt-7 border border-border bg-bg px-5 py-5">
          <h3 className="text-lg text-accent-bright mb-4">{t(language, 'expedition.liveLog')}</h3>
          {visibleEvents.length === 0 ? (
            <p className="text-base text-text">{t(language, 'expedition.noEvents')}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleEvents.map((event) => {
                const persona = personaById.get(event.npcId);
                return (
                  <article key={`${event.round}-${event.npcId}`} className="border border-border bg-bg px-4 py-4">
                    <p className="text-base text-accent-bright mb-2">
                      {t(language, 'expedition.round')} {event.round}: {persona?.name ?? event.npcId} / {event.encounterType}
                    </p>
                    <p className="text-base leading-relaxed whitespace-pre-wrap mb-2">{event.npcContribution}</p>
                    <p className="text-base leading-relaxed text-text mb-2">{t(language, 'expedition.challenge')}: {event.challengeToUser}</p>
                    <p className="text-base leading-relaxed text-text mb-2">{t(language, 'expedition.lead')}: {event.newLead}</p>
                    <p className="text-base leading-relaxed text-text">{t(language, 'expedition.nextQuestion')}: {event.nextQuestion}</p>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {report && (
          <div className="mt-7 flex flex-col gap-4">
            <div className="border-2 border-accent-bright bg-bg/80 px-5 py-5">
              <h3 className="text-xl text-accent-bright mb-3">{t(language, 'expedition.report')}</h3>
              <p className="text-base leading-relaxed mb-3"><span className="text-accent-bright">{t(language, 'expedition.originalMission')}: </span>{report.originalMission}</p>
              <p className="text-base leading-relaxed mb-3"><span className="text-accent-bright">{t(language, 'expedition.interpretedMission')}: </span>{report.interpretedMission}</p>
              <p className="text-base leading-relaxed"><span className="text-accent-bright">{t(language, 'expedition.emergentDirection')}: </span>{report.strongestEmergentDirection}</p>
            </div>
            <ReportList title={t(language, 'expedition.keyEncounters')} items={report.keyEncounters} />
            <ReportList title={t(language, 'expedition.npcDisagreements')} items={report.disagreementsBetweenNpcs} />
            <ReportList title={t(language, 'expedition.blindSpots')} items={report.blindSpots} />
            <ReportList title={t(language, 'expedition.nextActions')} items={report.concreteNextActions} />
            <ReportList title={t(language, 'expedition.followUpQuestions')} items={report.followUpQuestions} />
            <ReportList title={t(language, 'expedition.researchLeads')} items={report.openCallResearchLeads} />
            <button
              className="w-full bg-accent text-white border-2 border-accent px-6 py-4 text-lg shadow-pixel"
              type="button"
              onClick={handleDownloadReport}
            >
              {t(language, 'expedition.downloadReport')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
