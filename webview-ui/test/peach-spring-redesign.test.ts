import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  createEntryProfile,
  extractFirstUrl,
} from "../src/components/playerProfileMapping.js";
import { t } from "../src/i18n.js";
import {
  createIndoorPeachBlossomUtopiaLayout,
  tamagotchiPeachForestZones,
} from "../src/world/peachBlossomWorld.js";
import {
  appearanceToThrongletSpriteData,
  createThrongletCharacterSprites,
  createThrongletSpriteVariant,
} from "../src/world/throngletSprites.js";

test("entry copy and profile mapping use two-field Peach Spring flow", () => {
  assert.equal(t("zh-TW", "projectTitle"), "桃花源：可思考的生命模擬器派遣");
  assert.ok(t("zh-TW", "projectIntro").includes("互動寓言維度"));
  assert.ok(
    t("en", "projectIntro").includes("interactive allegorical dimension"),
  );
  assert.equal(
    extractFirstUrl("問題 https://example.org/path 還有文字"),
    "https://example.org/path",
  );
  const profile = createEntryProfile({
    name: "Wei",
    questionAndLink: "How to build? https://example.org",
    language: "zh-TW",
    seed: "s",
    palette: 2,
  });
  assert.equal(profile.name, "Wei");
  assert.equal(profile.mission, "How to build? https://example.org");
  assert.equal(profile.question, "How to build? https://example.org");
  assert.equal(profile.webLink, "https://example.org");
  assert.equal(profile.skills, "");
  assert.equal(profile.constraints, "");
  assert.equal(profile.avatarTitle, "桃花源訪客");
});

test("PlayerSetup source exposes only name and question/link user fields", () => {
  const source = fs.readFileSync(
    new URL("../src/components/PlayerSetup.tsx", import.meta.url),
    "utf8",
  );
  assert.equal((source.match(/<input\s/g) ?? []).length, 1);
  assert.equal((source.match(/<textarea\s/g) ?? []).length, 1);
  assert.ok(!source.includes('name="skills"'));
  assert.ok(!source.includes("shufflePet"));
  assert.ok(!source.includes("pet display name"));
});

test("player start does not auto-open duplicate dispatch popup", () => {
  const source = fs.readFileSync(
    new URL("../src/App.tsx", import.meta.url),
    "utf8",
  );
  const handleStart = source.slice(
    source.indexOf("const handlePlayerStart"),
    source.indexOf("const handleLanguageChange"),
  );
  assert.ok(handleStart.includes("setSelectedDispatchPet(null)"));
  assert.ok(!handleStart.includes("setSelectedDispatchPet(created)"));
});

test("mobile dispatch monitor has focus collapse classes and safe-area padding", () => {
  const css = fs.readFileSync(
    new URL("../src/index.css", import.meta.url),
    "utf8",
  );
  assert.ok(css.includes("--mobile-monitor-collapsed-height"));
  assert.ok(css.includes("100dvh"));
  assert.ok(css.includes(".mobile-stats-bar.is-input-focused"));
  assert.ok(
    css.includes("body:has(input:focus, textarea:focus) .mobile-stats-bar"),
  );
});

test("indoor Peach Blossom Spring generator is deterministic and complete", () => {
  const a = createIndoorPeachBlossomUtopiaLayout("same-seed");
  const b = createIndoorPeachBlossomUtopiaLayout("same-seed");
  assert.deepEqual(a.tiles, b.tiles);
  assert.deepEqual(a.tileColors, b.tileColors);
  assert.deepEqual(a.furniture, b.furniture);
  for (const id of [
    "indoorCanopy",
    "riverCrossing",
    "peachForest",
    "bridge",
    "restaurant",
    "laboratory",
    "church",
    "temple",
    "archiveTree",
    "mountainGate",
    "village",
    "greenhouseRoof",
    "workshopClearing",
  ]) {
    assert.ok(
      tamagotchiPeachForestZones.some((zone) => zone.id === id),
      `missing ${id}`,
    );
  }
  assert.ok(a.metrics.peachTrees >= 20);
  assert.ok(a.metrics.riverTiles > 0);
  assert.ok(a.metrics.bridgeTiles >= 1);
  assert.deepEqual(
    a.buildingStamps.sort(),
    [
      "church",
      "openTechLab",
      "restaurantTeaHouse",
      "temple",
      "villageHouse",
    ].sort(),
  );
  assert.equal(
    a.collision[24 * a.cols + 10],
    true,
    "river water blocks walking",
  );
  assert.equal(a.collision[24 * a.cols + 34], false, "bridge is walkable");
  assert.equal(
    a.collision[14 * a.cols + 51],
    true,
    "building wall blocks walking",
  );
});

test("thronglet sprite generator powers players, NPCs, and pets", () => {
  const player = createThrongletCharacterSprites("player-seed", "player")
    .walk[0][0];
  const npc = createThrongletCharacterSprites("npc-seed", "npc").walk[0][0];
  const pet = appearanceToThrongletSpriteData("pet-seed", "pet");
  assert.equal(player.length, 24);
  assert.equal(npc.length, 24);
  assert.equal(pet.length, 24);
  assert.ok(
    JSON.stringify(player).includes("#FCF46B") ||
      JSON.stringify(player).includes("#FFE66A") ||
      JSON.stringify(player).includes("#FFF07B"),
  );
  assert.equal(
    createThrongletSpriteVariant("same", "npc").seed,
    createThrongletSpriteVariant("same", "npc").seed,
  );
});
