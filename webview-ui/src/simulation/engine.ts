import { generateQuestionPet } from "../pets/generateQuestionPet.js";
import {
  defaultScores,
  deriveNpcState,
  playerDefaultState,
  throngletDefaultState,
} from "./defaults.js";
import { scorePromptResonance } from "./resonance.js";
import { deltaForAction, makeEvent, updateStateForAction } from "./rules.js";
import { scoreEvent } from "./scoring.js";
import { chooseAction } from "./selectors.js";
import {
  deterministicThought,
  shouldTriggerThought,
} from "./thoughtTriggers.js";
import type {
  DispatchedQuestion,
  SimEntity,
  SimEvent,
  SimScores,
  SimSnapshot,
  SimThrong,
  Thronglet,
} from "./types.js";

export function createThronglet(
  questionText: string,
  ownerName: string,
  ownerPlayerId: string | number,
  characterId = 10000,
  seed?: string,
  displayName = "問題電子雞",
): Thronglet {
  const question: DispatchedQuestion = {
    id: `question-${characterId}`,
    ownerPlayerId,
    ownerName,
    text: questionText,
    createdAt: Date.now(),
    tags: [],
  };
  return {
    id: `thronglet-${characterId}`,
    kind: "thronglet",
    characterId,
    displayName,
    ownerPlayerId,
    question,
    prompt: questionText,
    state: { ...throngletDefaultState },
    memory: [],
    currentAction: "wander",
    appearance: generateQuestionPet(questionText, seed),
  };
}

export function createInitialSnapshot(
  thronglets: Thronglet[],
  npcContexts: Array<{
    id: string;
    characterId: number;
    name: string;
    text: string;
  }> = [],
): SimSnapshot {
  const npcs: SimEntity[] = npcContexts.map((npc) => ({
    id: npc.id,
    kind: "npc",
    characterId: npc.characterId,
    displayName: npc.name,
    prompt: npc.text,
    state: deriveNpcState(npc.text),
    memory: [],
  }));
  return {
    tick: 0,
    entities: [
      {
        id: "player-0",
        kind: "player",
        characterId: 0,
        displayName: "player",
        state: { ...playerDefaultState },
        memory: [],
      },
      ...npcs,
    ],
    thronglets,
    events: [],
    scores: { ...defaultScores },
    throngs: [],
    thoughts: [],
  };
}

function formThrongs(snapshot: SimSnapshot): {
  throngs: SimThrong[];
  events: SimEvent[];
} {
  const members = [...snapshot.entities, ...snapshot.thronglets].filter(
    (e) =>
      e.state.groupBond > 55 &&
      e.state.stress < 70 &&
      e.state.resonanceWithPrompt > 45,
  );
  if (members.length < 3)
    return {
      throngs: snapshot.throngs.filter((t) => t.stability > 1),
      events: [],
    };
  if (snapshot.throngs.length > 0)
    return {
      throngs: snapshot.throngs.map((t) => ({
        ...t,
        stability: Math.min(100, t.stability + 1),
      })),
      events: [],
    };
  const throng: SimThrong = {
    id: `throng-${snapshot.tick}`,
    memberIds: members.slice(0, 5).map((m) => m.id),
    center: { col: 32, row: 32 },
    topic: "temporary question circle",
    createdAtTick: snapshot.tick,
    stability: 60,
  };
  return {
    throngs: [throng],
    events: [
      makeEvent(
        "throng_formed",
        snapshot.tick,
        members[0].id,
        { groupBond: 2 },
        80,
        "A temporary throng formed.",
      ),
    ],
  };
}

export function tickSimulation(
  snapshot: SimSnapshot,
  contexts: Record<string, string> = {},
): SimSnapshot {
  const tick = snapshot.tick + 1;
  const events: SimEvent[] = [];
  const thronglets = snapshot.thronglets.map((pet) => {
    const action = chooseAction(pet.state, `${pet.question.text}-${tick}`);
    const context = contexts[pet.id] ?? Object.values(contexts).join(" ");
    const resonance = context
      ? scorePromptResonance(pet.question.text, context)
      : pet.state.resonanceWithPrompt;
    const state = updateStateForAction(
      {
        ...pet.state,
        resonanceWithPrompt: Math.max(
          pet.state.resonanceWithPrompt * 0.96,
          resonance,
        ),
      },
      action,
    );
    const delta = deltaForAction(action, pet.state);
    if (["talk", "seekMoney", "practiceSkill", "joinThrong"].includes(action))
      events.push(
        makeEvent(
          "thronglet_interaction",
          tick,
          pet.id,
          delta,
          state.resonanceWithPrompt,
          `${pet.displayName} ${action}`,
        ),
      );
    return { ...pet, state, currentAction: action };
  });
  const throngResult = formThrongs({ ...snapshot, tick, thronglets });
  events.push(...throngResult.events);
  let scores: SimScores = { ...snapshot.scores };
  for (const event of events) scores = scoreEvent(scores, event);
  const thoughts = [...snapshot.thoughts];
  for (const pet of thronglets) {
    const event =
      events.find((item) => item.actorId === pet.id) ?? throngResult.events[0];
    if (shouldTriggerThought(pet.state, event))
      thoughts.unshift(
        deterministicThought(pet.state, pet.question.text, event),
      );
  }
  return {
    ...snapshot,
    tick,
    thronglets,
    events: [...events, ...snapshot.events].slice(0, 30),
    scores,
    throngs: throngResult.throngs,
    thoughts: Array.from(new Set(thoughts)).slice(0, 8),
  };
}

export function applyPlayerThrongletResponse(
  snapshot: SimSnapshot,
  petId: string,
  response: string,
): SimSnapshot {
  const tick = snapshot.tick;
  const event = makeEvent(
    "player_thronglet_response",
    tick,
    "player-0",
    { affinity: 4, openness: 3, stress: -1, groupBond: 4 },
    75,
    response,
  );
  const thronglets = snapshot.thronglets.map((pet) =>
    pet.id === petId
      ? {
          ...pet,
          state: updateStateForAction(
            {
              ...pet.state,
              affinity: pet.state.affinity + 4,
              groupBond: pet.state.groupBond + 4,
            },
            "listen",
          ),
        }
      : pet,
  );
  return {
    ...snapshot,
    thronglets,
    events: [event, ...snapshot.events].slice(0, 30),
    scores: scoreEvent(snapshot.scores, event),
    thoughts: [
      deterministicThought(
        thronglets.find((p) => p.id === petId)?.state ?? throngletDefaultState,
        thronglets.find((p) => p.id === petId)?.question.text ?? "",
        event,
      ),
      ...snapshot.thoughts,
    ].slice(0, 8),
  };
}

export function applyPlayerNpcDialogue(
  snapshot: SimSnapshot,
  npcId: string,
  prompt: string,
  resonance: number,
): SimSnapshot {
  const event = makeEvent(
    "player_npc_dialogue",
    snapshot.tick,
    "player-0",
    { curiosity: 1, skills: resonance > 45 ? 1 : 0 },
    resonance,
    prompt,
  );
  event.targetId = npcId;
  return {
    ...snapshot,
    events: [event, ...snapshot.events].slice(0, 30),
    scores: scoreEvent(snapshot.scores, event),
  };
}
