import assert from 'node:assert/strict';
import test from 'node:test';

import { generateQuestionPet } from '../src/pets/generateQuestionPet.js';
import { clampState } from '../src/simulation/defaults.js';
import { createInitialSnapshot, createThronglet, tickSimulation } from '../src/simulation/engine.js';
import { scorePromptResonance } from '../src/simulation/resonance.js';
import { scoreEvent } from '../src/simulation/scoring.js';
import { shouldTriggerThought } from '../src/simulation/thoughtTriggers.js';
import type { SimEvent, SimScores, SimState } from '../src/simulation/types.js';

test('state clamping works', () => {
  const state = clampState({ energy: -10, curiosity: 120, stress: 50, affinity: 0, solitude: 0, openness: 0, stubbornness: 0, resonanceWithPrompt: 0, groupBond: 0, money: 0, skills: 0 });
  assert.equal(state.energy, 0);
  assert.equal(state.curiosity, 100);
});

test('prompt resonance scores keyword overlap without external APIs', () => {
  assert.ok(scorePromptResonance('How can independent art funding support long-term care?', 'grant budget independent community care') > 40);
  assert.equal(scorePromptResonance('', 'grant'), 0);
});

test('same question gives the same pet seed and different questions vary', () => {
  const a = generateQuestionPet('資金如何支持獨立藝術社群？');
  const b = generateQuestionPet('資金如何支持獨立藝術社群？');
  const c = generateQuestionPet('科技工具如何照顧疲勞？');
  assert.equal(a.seed, b.seed);
  assert.deepEqual(a.sprite16, b.sprite16);
  assert.notEqual(a.seed, c.seed);
  assert.equal(a.sprite16.length, 16);
  assert.equal(a.sprite16[0].length, 16);
});

test('simulation ticks update state and events update scores', () => {
  const pet = createThronglet('How do we share tools?', 'Tester', 0, 10000);
  const snapshot = createInitialSnapshot([pet]);
  const next = tickSimulation(snapshot, { [pet.id]: 'tool craft skill community' });
  assert.equal(next.tick, 1);
  assert.notDeepEqual(next.thronglets[0].state, snapshot.thronglets[0].state);

  const scores: SimScores = { interaction: 0, wisdom: 0, community: 0, resource: 0, skill: 0, care: 0 };
  const event: SimEvent = { id: 'e', type: 'player_thronglet_response', createdAt: 0, tick: 1, actorId: 'player-0', delta: { stress: -3, skills: 2 }, significance: 70 };
  const scored = scoreEvent(scores, event);
  assert.ok(scored.interaction > 0);
  assert.ok(scored.care > 0);
  assert.ok(scored.skill > 0);
});

test('throng forms correctly when entities have high group bond', () => {
  const pets = [0, 1, 2].map((index) => {
    const pet = createThronglet(`question ${index} autonomy`, 'Tester', 0, 10000 + index);
    pet.state.groupBond = 70;
    pet.state.stress = 20;
    pet.state.resonanceWithPrompt = 80;
    return pet;
  });
  const next = tickSimulation(createInitialSnapshot(pets), {});
  assert.ok(next.throngs.length >= 1);
  assert.ok(next.events.some((event) => event.type === 'throng_formed'));
});

test('thought trigger works', () => {
  const state: SimState = { energy: 50, curiosity: 80, stress: 10, affinity: 40, solitude: 20, openness: 70, stubbornness: 20, resonanceWithPrompt: 90, groupBond: 20, money: 40, skills: 20 };
  assert.equal(shouldTriggerThought(state, { id: 'e', type: 'thronglet_interaction', createdAt: 0, tick: 1, actorId: 'pet', delta: {}, significance: 50 }), true);
});
