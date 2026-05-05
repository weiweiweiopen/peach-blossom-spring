import { useEffect, useMemo, useState } from 'react';

import { runExpedition } from '../expedition/expeditionRunner.js';
import { type LanguageCode } from '../i18n.js';
import type { ExpeditionEvent, ExpeditionPersona } from '../expedition/types.js';
import type { PlayerProfile } from './PlayerSetup.js';

interface ExpeditionPanelProps {
  avatar: PlayerProfile;
  personas: ExpeditionPersona[];
  language: LanguageCode;
  isOpen: boolean;
  onClose: () => void;
}

export function ExpeditionPanel({ avatar, personas, language, isOpen, onClose }: ExpeditionPanelProps) {
  const [mission, setMission] = useState(avatar.mission);
  const [maxRounds, setMaxRounds] = useState(10);
  const [selectedNpcIds, setSelectedNpcIds] = useState<string[]>(() => personas.slice(0, 6).map((persona) => persona.id));
  const [queuedEvents, setQueuedEvents] = useState<ExpeditionEvent[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<ExpeditionEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const personaById = useMemo(() => new Map(personas.map((persona) => [persona.id, persona])), [personas]);

  useEffect(() => {
    if (!isRunning || queuedEvents.length === 0) return;
    const id = window.setTimeout(() => {
      const [next, ...rest] = queuedEvents;
      setVisibleEvents((current) => [...current, next]);
      setQueuedEvents(rest);
      if (rest.length === 0) {
        setIsRunning(false);
      }
    }, 360);
    return () => window.clearTimeout(id);
  }, [isRunning, queuedEvents]);

  function toggleNpc(npcId: string): void {
    setSelectedNpcIds((current) => (current.includes(npcId) ? current.filter((id) => id !== npcId) : [...current, npcId]));
  }

  function handleRun(): void {
    const result = runExpedition({ avatar, mission, selectedNpcIds, maxRounds, mode: 'template-simulation', personas });
    setVisibleEvents([]);
    setQueuedEvents(result.events);
    setIsRunning(true);
  }

  if (!isOpen) return null;

  return <section className="absolute inset-0 z-47 flex items-center justify-center bg-black/40 px-6 py-6"><div className="pixel-panel w-[min(1180px,96vw)] h-[92vh] px-8 py-7 text-text shadow-pixel overflow-auto"><div className="flex items-start justify-between gap-6 mb-6"><div><p className="text-xs uppercase tracking-wide text-accent-bright mb-2">{language === 'zh-TW' ? '遠征模擬器' : 'Idea Expedition Simulator'}</p><h2 className="text-2xl leading-none">桃花源：可派遣的思考生命模擬器</h2></div><button className="text-2xl text-text-muted hover:text-text" type="button" onClick={onClose}>x</button></div><div className="border border-border bg-bg/70 px-5 py-4 mb-5"><p className="text-sm text-accent-bright mb-1">{avatar.name} / {avatar.currentRole}</p><p className="text-sm text-text-muted">{language === 'zh-TW' ? '限制：' : 'Constraints: '}{avatar.constraints?.trim() || (language === 'zh-TW' ? '未設定' : 'none declared')}</p><p className="text-sm text-text-muted mt-1">{language === 'zh-TW' ? '技能：' : 'Skills: '}{avatar.skills?.trim() || (language === 'zh-TW' ? '未填寫' : 'not specified')}</p></div><label className="block text-sm text-text-muted mb-2" htmlFor="expedition-mission">{language === 'zh-TW' ? '任務' : 'Mission'}</label><textarea id="expedition-mission" className="w-full min-h-[110px] bg-bg border-2 border-border px-4 py-3 text-base text-text outline-none focus:border-accent-bright mb-5" value={mission} onChange={(event) => setMission(event.target.value)} /><div className="flex flex-wrap items-center gap-3 mb-5"><span className="text-sm text-text-muted">{language === 'zh-TW' ? '最大輪數' : 'Max rounds'}</span>{[5, 10, 20].map((rounds) => <button key={rounds} className={`${maxRounds === rounds ? 'bg-accent text-white border-accent' : 'bg-bg text-text border-border'} border px-4 py-2 text-sm`} type="button" onClick={() => setMaxRounds(rounds)}>{rounds}</button>)}</div><div className="mb-6"><p className="text-sm text-text-muted mb-3">{language === 'zh-TW' ? '選擇 NPC' : 'Selected NPCs'}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{personas.map((persona) => <label key={persona.id} className="border border-border bg-bg/60 px-3 py-3 text-sm cursor-pointer"><input className="mr-2" type="checkbox" checked={selectedNpcIds.includes(persona.id)} onChange={() => toggleNpc(persona.id)} />{persona.name}</label>)}</div></div><button className="w-full bg-accent text-white border-2 border-accent px-6 py-4 text-lg shadow-pixel disabled:opacity-60" type="button" onClick={handleRun} disabled={isRunning}>{isRunning ? (language === 'zh-TW' ? '遠征進行中...' : 'Expedition running...') : (language === 'zh-TW' ? '派遣遠征' : 'Send on Expedition')}</button><div className="mt-7 border border-border bg-black/30 px-5 py-5"><h3 className="text-lg text-accent-bright mb-4">{language === 'zh-TW' ? '即時事件紀錄' : 'Live Event Log'}</h3>{visibleEvents.length === 0 ? <p className="text-sm text-text-muted">{language === 'zh-TW' ? '尚無遠征事件。' : 'No expedition events yet.'}</p> : <div className="flex flex-col gap-4">{visibleEvents.map((event) => {const persona = personaById.get(event.npcId);return <article key={`${event.round}-${event.npcId}`} className="border border-border bg-bg/70 px-4 py-4"><p className="text-sm text-accent-bright mb-2">{language === 'zh-TW' ? '第' : 'Round '}{event.round}{language === 'zh-TW' ? '輪' : ''}: {persona?.name ?? event.npcId}</p><p className="text-sm leading-relaxed mb-2">{event.npcContribution}</p><p className="text-sm leading-relaxed text-text-muted mb-2">{language === 'zh-TW' ? '挑戰：' : 'Challenge: '}{event.challengeToUser}</p></article>;})}</div>}</div></div></section>;
}
