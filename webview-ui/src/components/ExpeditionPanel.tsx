import { useEffect, useMemo, useState } from 'react';

import { runExpedition } from '../expedition/expeditionRunner.js';
import type { ExpeditionEvent, ExpeditionPersona, ExpeditionReport } from '../expedition/types.js';
import type { PlayerProfile } from './PlayerSetup.js';

interface ExpeditionPanelProps {
  avatar: PlayerProfile;
  personas: ExpeditionPersona[];
  isOpen: boolean;
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

export function ExpeditionPanel({ avatar, personas, isOpen, onClose }: ExpeditionPanelProps) {
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
      mission,
      selectedNpcIds,
      maxRounds,
      mode: 'local-mock',
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
    <section className="absolute right-6 top-6 bottom-6 z-47 w-[min(620px,calc(100vw-24px))] pixel-panel px-8 py-7 text-text shadow-pixel overflow-auto">
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-accent-bright mb-2">Idea Expedition Simulator</p>
          <h2 className="text-2xl leading-none">桃花源：可派遣的思考生命模擬器</h2>
          <p className="text-sm text-text-muted mt-3 leading-snug">
            Mission {'>'} avatar {'>'} encounters {'>'} conflict {'>'} synthesis {'>'} report.
          </p>
        </div>
        <button className="text-2xl text-text-muted hover:text-text" type="button" onClick={onClose}>x</button>
      </div>

      <div className="border border-border bg-bg/70 px-5 py-4 mb-5">
        <p className="text-sm text-accent-bright mb-1">{avatar.name} / {avatar.currentRole}</p>
        <p className="text-sm text-text-muted">Constraints: {avatar.constraints?.trim() || 'none declared'}</p>
      </div>

      <label className="block text-sm text-text-muted mb-2" htmlFor="expedition-mission">Mission</label>
      <textarea
        id="expedition-mission"
        className="w-full min-h-[110px] bg-bg border-2 border-border px-4 py-3 text-base text-text outline-none focus:border-accent-bright mb-5"
        value={mission}
        onChange={(event) => setMission(event.target.value)}
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className="text-sm text-text-muted">Max rounds</span>
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
        <p className="text-sm text-text-muted mb-3">Selected NPCs</p>
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
        {isRunning ? 'Expedition running...' : 'Send on Expedition'}
      </button>

      <div className="mt-7 border border-border bg-black/30 px-5 py-5">
        <h3 className="text-lg text-accent-bright mb-4">Live Event Log</h3>
        {visibleEvents.length === 0 ? (
          <p className="text-sm text-text-muted">No expedition events yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleEvents.map((event) => {
              const persona = personaById.get(event.npcId);
              return (
                <article key={`${event.round}-${event.npcId}`} className="border border-border bg-bg/70 px-4 py-4">
                  <p className="text-sm text-accent-bright mb-2">
                    Round {event.round}: {persona?.name ?? event.npcId} / {event.encounterType}
                  </p>
                  <p className="text-sm leading-relaxed mb-2">{event.npcContribution}</p>
                  <p className="text-sm leading-relaxed text-text-muted mb-2">Challenge: {event.challengeToUser}</p>
                  <p className="text-sm leading-relaxed text-text-muted mb-2">Lead: {event.newLead}</p>
                  <p className="text-sm leading-relaxed text-text-muted">Next question: {event.nextQuestion}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {report && (
        <div className="mt-7 flex flex-col gap-4">
          <div className="border-2 border-accent-bright bg-bg/80 px-5 py-5">
            <h3 className="text-xl text-accent-bright mb-3">Expedition Report</h3>
            <p className="text-sm leading-relaxed mb-3"><span className="text-accent-bright">Original mission: </span>{report.originalMission}</p>
            <p className="text-sm leading-relaxed mb-3"><span className="text-accent-bright">Interpreted mission: </span>{report.interpretedMission}</p>
            <p className="text-sm leading-relaxed"><span className="text-accent-bright">Emergent direction: </span>{report.strongestEmergentDirection}</p>
          </div>
          <ReportList title="Key Encounters" items={report.keyEncounters} />
          <ReportList title="NPC Disagreements" items={report.disagreementsBetweenNpcs} />
          <ReportList title="Blind Spots" items={report.blindSpots} />
          <ReportList title="Concrete Next Actions" items={report.concreteNextActions} />
          <ReportList title="Follow-Up Questions" items={report.followUpQuestions} />
          <ReportList title="Open-Call / Research Leads" items={report.openCallResearchLeads} />
        </div>
      )}
    </section>
  );
}
