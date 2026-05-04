(function () {
  const canvas = document.querySelector("#world");
  const ctx = canvas.getContext("2d");
  const dialog = document.querySelector("#dialog");
  const closeDialog = document.querySelector("#close-dialog");
  const speakerRole = document.querySelector("#speaker-role");
  const speakerName = document.querySelector("#speaker-name");
  const speakerIntro = document.querySelector("#speaker-intro");
  const topicButtons = document.querySelector("#topic-buttons");
  const answer = document.querySelector("#answer");
  const keys = new Set();
  const world = { w: 1280, h: 720 };
  const tile = 32;
  const player = { x: 640, y: 528, r: 13, speed: 176, dir: 1, step: 0 };
  let personas = [];
  let activeTarget = null;
  let lastTime = performance.now();

  const topics = [
    ["nomadic", "Nomadic research"],
    ["camp", "Hacker camp"],
    ["independent", "Independent research"],
    ["artScience", "Science art project"],
    ["funding", "How to use grants"],
    ["exchange", "International exchange"],
    ["sustainability", "Open sustainability"]
  ];

  const treeLinks = {
    id: "community-tree",
    name: "Peach Community Tree",
    role: "wiki / social links",
    intro: "This huge pixel peach tree works like the office network board: touch it to open outward paths to wikis, communities, and project pages.",
    x: 1094,
    y: 164,
    links: [
      ["SGMK Wiki", "https://wiki.sgmk-ssam.ch/"],
      ["Hackteria", "https://www.hackteria.org/"],
      ["Peach Blossom Spring repo", "https://github.com/weiweiweiopen/peach-blossom-spring"],
      ["Solar Oracle Walkman", "https://weiweiweiopen.github.io/solar-oracle-walkman/"]
    ]
  };

  const zones = [
    { x: 64, y: 70, w: 250, h: 150, label: "私塾 / workshop", color: "#c8ad7f" },
    { x: 374, y: 70, w: 238, h: 150, label: "餐館 / inn", color: "#c79b74" },
    { x: 672, y: 70, w: 270, h: 150, label: "音樂劇院", color: "#b995b8" },
    { x: 930, y: 370, w: 250, h: 152, label: "森林小木屋", color: "#9fae80" },
    { x: 84, y: 418, w: 246, h: 156, label: "故事橋邊", color: "#aebf9f" },
    { x: 478, y: 500, w: 268, h: 136, label: "campfire node", color: "#ba9a73" }
  ];

  const props = [
    { type: "desk", x: 104, y: 126, label: "wiki desk" },
    { type: "bench", x: 210, y: 140, label: "tools" },
    { type: "counter", x: 404, y: 126, label: "店小二" },
    { type: "barrel", x: 548, y: 150, label: "酒鬼" },
    { type: "stage", x: 718, y: 126, label: "古琴" },
    { type: "ribbon", x: 860, y: 148, label: "彩帶舞" },
    { type: "bridge", x: 470, y: 344, label: "古橋" },
    { type: "fishing", x: 330, y: 405, label: "釣魚" },
    { type: "boat", x: 668, y: 386, label: "撐船" },
    { type: "story", x: 220, y: 392, label: "說書老人" },
    { type: "kids", x: 186, y: 550, label: "小孩" },
    { type: "fire", x: 612, y: 568, label: "圍火喝酒" }
  ];

  const npcSlots = [
    { x: 150, y: 270 }, { x: 245, y: 292 }, { x: 438, y: 270 }, { x: 552, y: 280 },
    { x: 718, y: 272 }, { x: 858, y: 278 }, { x: 996, y: 286 }, { x: 1086, y: 320 },
    { x: 178, y: 630 }, { x: 302, y: 614 }, { x: 520, y: 652 }, { x: 690, y: 642 },
    { x: 928, y: 608 }, { x: 1125, y: 600 }
  ];

  fetch("./data/personas.json", { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      personas = data.personas.map((persona, index) => {
        const slot = npcSlots[index] || { x: 160 + index * 35, y: 500 };
        return {
          ...persona,
          x: slot.x,
          y: slot.y,
          homeX: slot.x,
          homeY: slot.y,
          vx: (index % 2 === 0 ? 1 : -1) * (9 + (index % 4) * 4),
          vy: (index % 3 === 0 ? 1 : -1) * (7 + (index % 5) * 2),
          hue: index * 25,
          step: 0,
          dir: index % 2 === 0 ? 1 : -1
        };
      });
      requestAnimationFrame(tick);
    })
    .catch(() => {
      answer.textContent = "Could not load data/personas.json.";
      requestAnimationFrame(tick);
    });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    keys.add(key);
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  closeDialog.addEventListener("click", () => hideDialog());

  function tick(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(tick);
  }

  function update(dt) {
    const dx = axis("arrowright", "d") - axis("arrowleft", "a");
    const dy = axis("arrowdown", "s") - axis("arrowup", "w");
    const length = Math.hypot(dx, dy) || 1;
    player.x = clamp(player.x + (dx / length) * player.speed * dt, 42, world.w - 42);
    player.y = clamp(player.y + (dy / length) * player.speed * dt, 76, world.h - 42);
    if (dx || dy) player.step += dt * 8;
    if (dx) player.dir = dx > 0 ? 1 : -1;

    personas.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.step += dt * 5;
      p.dir = p.vx >= 0 ? 1 : -1;
      if (Math.abs(p.x - p.homeX) > 58) p.vx *= -1;
      if (Math.abs(p.y - p.homeY) > 42) p.vy *= -1;
    });

    const target = nearestTarget();
    if (target && target.id !== activeTarget?.id) showDialog(target);
    if (!target && activeTarget) hideDialog();
  }

  function axis(primary, secondary) {
    return keys.has(primary) || keys.has(secondary) ? 1 : 0;
  }

  function nearestTarget() {
    if (distance(player, treeLinks) < 76) return treeLinks;
    return personas.find((p) => distance(player, p) < 50) || null;
  }

  function showDialog(target) {
    activeTarget = target;
    dialog.hidden = false;
    speakerRole.textContent = target.role || "NGM persona";
    speakerName.textContent = target.name;
    speakerIntro.textContent = target.intro;
    topicButtons.replaceChildren();
    answer.innerHTML = "";
    if (target.links) {
      target.links.forEach(([label, href]) => {
        const link = document.createElement("a");
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = label;
        const button = document.createElement("button");
        button.type = "button";
        button.append(link);
        topicButtons.append(button);
      });
      answer.textContent = "Choose a path from the tree.";
      return;
    }
    topics.forEach(([key, label], index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => selectTopic(target, key, button));
      topicButtons.append(button);
      if (index === 0) selectTopic(target, key, button);
    });
  }

  function selectTopic(target, key, button) {
    topicButtons.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
    answer.textContent = target.responses[key] || target.responses.sustainability;
  }

  function hideDialog() {
    activeTarget = null;
    dialog.hidden = true;
  }

  function draw() {
    ctx.clearRect(0, 0, world.w, world.h);
    drawPixelWorld();
    const drawables = [
      ...props.map((p) => ({ y: p.y + 50, draw: () => drawProp(p) })),
      ...personas.map((p) => ({ y: p.y, draw: () => drawAgent(p, false) })),
      { y: player.y, draw: () => drawAgent(player, true) }
    ].sort((a, b) => a.y - b.y);
    drawables.forEach((item) => item.draw());
    drawLabels();
  }

  function drawPixelWorld() {
    ctx.fillStyle = "#1c1916";
    ctx.fillRect(0, 0, world.w, world.h);
    drawDistantInkHills();
    drawTileFloor();
    drawRooms();
    drawRiverTiles();
    drawTree(treeLinks.x, treeLinks.y, 2);
    drawPixelTitle();
  }

  function drawTileFloor() {
    for (let y = 48; y < world.h; y += tile) {
      for (let x = 32; x < world.w - 32; x += tile) {
        const checker = ((x / tile + y / tile) % 2) === 0;
        ctx.fillStyle = checker ? "#d8c295" : "#ceb688";
        ctx.fillRect(x, y, tile, tile);
        ctx.strokeStyle = "rgba(68,49,32,0.22)";
        ctx.strokeRect(x + 0.5, y + 0.5, tile, tile);
      }
    }
  }

  function drawRooms() {
    zones.forEach((zone) => {
      drawPixelRoom(zone.x, zone.y, zone.w, zone.h, zone.color);
      pixelText(zone.label, zone.x + 14, zone.y + 22, "#2b2118", 12);
    });
  }

  function drawPixelRoom(x, y, w, h, color) {
    ctx.fillStyle = "#4a3828";
    ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
    ctx.fillStyle = "#e8d5ae";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x + 10, y + 34, w - 20, h - 44);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    for (let i = x + 18; i < x + w - 18; i += 28) ctx.fillRect(i, y + 44, 14, h - 62);
  }

  function drawRiverTiles() {
    const river = [[0, 320, 260, 80], [230, 338, 180, 72], [390, 320, 220, 92], [590, 350, 240, 70], [790, 330, 210, 76], [980, 300, 300, 94]];
    river.forEach(([x, y, w, h]) => {
      ctx.fillStyle = "#79a7ac";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(234,248,236,0.32)";
      for (let i = x + 16; i < x + w; i += 42) ctx.fillRect(i, y + 18 + (i % 3) * 10, 22, 5);
    });
  }

  function drawDistantInkHills() {
    ctx.fillStyle = "#7d9164";
    for (let i = 0; i < 6; i += 1) {
      const x = i * 230 - 40;
      ctx.fillRect(x, 38 + (i % 2) * 16, 170, 26);
      ctx.fillRect(x + 38, 18 + (i % 2) * 16, 94, 46);
    }
  }

  function drawProp(prop) {
    if (prop.type === "desk") return drawDesk(prop.x, prop.y, "#7b573b");
    if (prop.type === "bench") return drawDesk(prop.x, prop.y, "#5f6f51");
    if (prop.type === "counter") return drawCounter(prop.x, prop.y);
    if (prop.type === "barrel") return drawBarrel(prop.x, prop.y);
    if (prop.type === "stage") return drawStage(prop.x, prop.y);
    if (prop.type === "ribbon") return drawRibbon(prop.x, prop.y);
    if (prop.type === "bridge") return drawPixelBridge(prop.x, prop.y);
    if (prop.type === "fishing") return drawTinyPerson(prop.x, prop.y, "#445d66");
    if (prop.type === "boat") return drawBoat(prop.x, prop.y);
    if (prop.type === "story") return drawTinyPerson(prop.x, prop.y, "#7b573b");
    if (prop.type === "kids") return drawKids(prop.x, prop.y);
    if (prop.type === "fire") return drawCampfire(prop.x, prop.y);
  }

  function drawDesk(x, y, color) {
    ctx.fillStyle = "#443324"; ctx.fillRect(x, y + 28, 88, 16);
    ctx.fillStyle = color; ctx.fillRect(x + 4, y, 80, 32);
    ctx.fillStyle = "#e7d7b6"; ctx.fillRect(x + 14, y + 8, 26, 10); ctx.fillRect(x + 48, y + 7, 20, 12);
  }

  function drawCounter(x, y) { drawDesk(x, y, "#9a673e"); ctx.fillStyle = "#e1b36a"; ctx.fillRect(x + 50, y - 18, 26, 20); }
  function drawBarrel(x, y) { ctx.fillStyle = "#5b3827"; ctx.fillRect(x, y, 36, 54); ctx.fillStyle = "#8c5d35"; ctx.fillRect(x + 4, y + 6, 28, 42); }
  function drawStage(x, y) { ctx.fillStyle = "#5b3827"; ctx.fillRect(x, y + 42, 130, 18); ctx.fillStyle = "#775189"; ctx.fillRect(x + 4, y, 122, 44); ctx.fillStyle = "#e7d7b6"; ctx.fillRect(x + 48, y + 20, 42, 8); }
  function drawRibbon(x, y) { drawTinyPerson(x, y + 18, "#a44d74"); ctx.fillStyle = "#e67b93"; ctx.fillRect(x - 26, y - 10, 56, 8); ctx.fillRect(x + 18, y - 26, 8, 54); }

  function drawPixelBridge(x, y) {
    ctx.fillStyle = "#5f3e2a";
    for (let i = 0; i < 7; i += 1) ctx.fillRect(x + i * 26, y - Math.abs(3 - i) * 8, 24, 52);
    ctx.fillStyle = "#d3b178";
    for (let i = 0; i < 7; i += 1) ctx.fillRect(x + i * 26 + 3, y - Math.abs(3 - i) * 8 + 4, 18, 10);
  }

  function drawBoat(x, y) {
    ctx.fillStyle = "#5b3827"; ctx.fillRect(x - 52, y + 8, 112, 20);
    ctx.fillStyle = "#8b5e34"; ctx.fillRect(x - 36, y, 78, 16);
    drawTinyPerson(x - 4, y - 12, "#384c3d");
    ctx.fillStyle = "#3d2c1e"; ctx.fillRect(x + 34, y - 50, 6, 78);
  }

  function drawTinyPerson(x, y, color) {
    ctx.fillStyle = "#211a14"; ctx.fillRect(x - 6, y - 30, 12, 12);
    ctx.fillStyle = color; ctx.fillRect(x - 8, y - 18, 16, 26);
    ctx.fillStyle = "#211a14"; ctx.fillRect(x - 8, y + 8, 6, 12); ctx.fillRect(x + 2, y + 8, 6, 12);
  }

  function drawKids(x, y) { drawTinyPerson(x, y, "#c16d51"); drawTinyPerson(x + 34, y - 8, "#5f7895"); }

  function drawCampfire(x, y) {
    ctx.fillStyle = "#3d2c1e"; ctx.fillRect(x - 48, y + 26, 96, 12);
    ctx.fillStyle = "#d34b2f"; ctx.fillRect(x - 12, y - 4, 24, 32);
    ctx.fillStyle = "#f2b35d"; ctx.fillRect(x - 5, y + 4, 10, 20);
    [[-72, 12], [-40, -18], [42, -20], [76, 10]].forEach(([dx, dy]) => drawTinyPerson(x + dx, y + dy, "#76624b"));
  }

  function drawTree(x, y, scale) {
    const s = scale;
    ctx.fillStyle = "#5d3d29"; ctx.fillRect(x - 10 * s, y + 36 * s, 20 * s, 72 * s);
    ctx.fillStyle = "#4f7a49";
    [[0, 0], [-30, 18], [30, 18], [-14, -24], [18, -28], [0, 34]].forEach(([dx, dy]) => {
      ctx.fillRect(x + dx * s - 28 * s, y + dy * s - 20 * s, 56 * s, 40 * s);
    });
    ctx.fillStyle = "#ef9ca0";
    for (let i = 0; i < 18; i += 1) ctx.fillRect(x - 50 * s + ((i * 19) % (100 * s)), y - 40 * s + ((i * 23) % (80 * s)), 5 * s, 5 * s);
    pixelText("社群樹", x - 34, y + 124, "#2b2118", 12);
  }

  function drawAgent(agent, isPlayer) {
    const bob = Math.floor(Math.sin(agent.step || 0) * 2);
    ctx.save();
    ctx.translate(Math.round(agent.x), Math.round(agent.y + bob));
    ctx.scale(agent.dir || 1, 1);
    ctx.fillStyle = "rgba(30,24,18,0.24)"; ctx.fillRect(-15, 10, 30, 8);
    ctx.fillStyle = "#211a14"; ctx.fillRect(-9, -43, 18, 18);
    ctx.fillStyle = isPlayer ? "#f4ead6" : `hsl(${agent.hue || 0}, 48%, 48%)`;
    ctx.fillRect(-12, -25, 24, 30);
    ctx.fillStyle = isPlayer ? "#2a1f17" : "#f4ead6";
    ctx.fillRect(-16, -18, 6, 18); ctx.fillRect(10, -18, 6, 18);
    ctx.fillStyle = "#211a14";
    ctx.fillRect(-10, 5, 8, 16); ctx.fillRect(2, 5, 8, 16);
    ctx.fillStyle = "#f1d2b5"; ctx.fillRect(-5, -38, 4, 4); ctx.fillRect(5, -38, 4, 4);
    ctx.restore();
  }

  function drawLabels() {
    personas.forEach((p) => {
      ctx.fillStyle = "rgba(244,234,214,0.9)";
      ctx.fillRect(p.x - 39, p.y + 24, 78, 18);
      pixelText(p.name.split(" ")[0], p.x - 31, p.y + 37, "#211a14", 10);
    });
  }

  function drawPixelTitle() {
    ctx.fillStyle = "rgba(244,234,214,0.94)";
    ctx.fillRect(38, 28, 226, 48);
    ctx.strokeStyle = "#211a14";
    ctx.strokeRect(38.5, 28.5, 226, 48);
    pixelText("桃花源 PIXEL OFFICE", 54, 58, "#211a14", 18);
  }

  function pixelText(text, x, y, color, size) {
    ctx.fillStyle = color;
    ctx.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillText(text, x, y);
  }

  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
})();
