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
  const player = { x: 640, y: 520, r: 11, speed: 190, dir: 1 };
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
    intro: "The large tree stores outward paths from the village: wiki pages, open networks, and social channels.",
    links: [
      ["SGMK Wiki", "https://wiki.sgmk-ssam.ch/"],
      ["Hackteria", "https://www.hackteria.org/"],
      ["Peach Blossom Spring repo", "https://github.com/weiweiweiopen/peach-blossom-spring"],
      ["Solar Oracle Walkman", "https://weiweiweiopen.github.io/solar-oracle-walkman/"]
    ]
  };

  fetch("./data/personas.json", { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      personas = data.personas.map((persona, index) => ({
        ...persona,
        x: 170 + (index % 7) * 150,
        y: 185 + Math.floor(index / 7) * 250,
        vx: (index % 2 === 0 ? 1 : -1) * (12 + (index % 4) * 4),
        vy: (index % 3 === 0 ? 1 : -1) * (8 + (index % 5) * 3),
        hue: index * 27
      }));
      requestAnimationFrame(tick);
    })
    .catch(() => {
      answer.textContent = "Could not load data/personas.json.";
      requestAnimationFrame(tick);
    });

  window.addEventListener("keydown", (event) => {
    keys.add(event.key.toLowerCase());
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(event.key.toLowerCase())) event.preventDefault();
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
    player.x = clamp(player.x + (dx / length) * player.speed * dt, 35, world.w - 35);
    player.y = clamp(player.y + (dy / length) * player.speed * dt, 65, world.h - 35);
    if (dx) player.dir = dx > 0 ? 1 : -1;

    personas.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 90 || p.x > world.w - 90) p.vx *= -1;
      if (p.y < 120 || p.y > world.h - 90) p.vy *= -1;
    });

    const target = nearestTarget();
    if (target && target.id !== activeTarget?.id) showDialog(target);
    if (!target && activeTarget) hideDialog();
  }

  function axis(primary, secondary) {
    return keys.has(primary) || keys.has(secondary) ? 1 : 0;
  }

  function nearestTarget() {
    const treeDistance = Math.hypot(player.x - 1080, player.y - 170);
    if (treeDistance < 78) return treeLinks;
    return personas.find((p) => Math.hypot(player.x - p.x, player.y - p.y) < 52) || null;
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
    drawLandscape();
    drawVillagers();
    drawPlayer();
  }

  function drawLandscape() {
    ctx.fillStyle = "#eadbbd";
    ctx.fillRect(0, 0, world.w, world.h);
    drawMountains();
    drawRiver();
    drawBridge(520, 330);
    drawHouse(165, 92, "workshop school");
    drawHouse(790, 88, "restaurant");
    drawHouse(875, 430, "music theatre");
    drawCabin(1030, 460);
    drawTree(1080, 170, 1.6);
    drawCampfire(595, 575);
    drawPropPerson(420, 468, "fishing");
    drawBoat(710, 380);
    drawPropPerson(486, 300, "storyteller");
    drawPropPerson(320, 585, "children");
    drawInkText("桃花源", 40, 70, 42);
  }

  function drawMountains() {
    ctx.fillStyle = "rgba(95,116,71,0.32)";
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 310 - 60, 150);
      ctx.lineTo(i * 310 + 120, 35 + (i % 2) * 35);
      ctx.lineTo(i * 310 + 330, 150);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawRiver() {
    ctx.fillStyle = "rgba(136,174,176,0.78)";
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.bezierCurveTo(230, 285, 410, 430, 650, 345);
    ctx.bezierCurveTo(880, 260, 980, 380, 1280, 315);
    ctx.lineTo(1280, 445);
    ctx.bezierCurveTo(940, 510, 790, 405, 590, 500);
    ctx.bezierCurveTo(350, 610, 210, 460, 0, 535);
    ctx.closePath();
    ctx.fill();
  }

  function drawBridge(x, y) {
    ctx.strokeStyle = "#6f5037";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(x, y + 40, 95, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = -70; i <= 70; i += 20) {
      ctx.beginPath(); ctx.moveTo(x + i, y - 7); ctx.lineTo(x + i, y + 42); ctx.stroke();
    }
  }

  function drawHouse(x, y, label) {
    ctx.fillStyle = "#d8c291"; ctx.fillRect(x, y + 44, 150, 85);
    ctx.fillStyle = "#6f5037";
    ctx.beginPath(); ctx.moveTo(x - 16, y + 52); ctx.lineTo(x + 75, y); ctx.lineTo(x + 166, y + 52); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#2e241a"; ctx.fillRect(x + 62, y + 82, 26, 47);
    drawInkText(label, x + 12, y + 75, 13);
  }

  function drawCabin(x, y) { drawHouse(x, y, "forest cabin"); drawTree(x - 40, y + 10, 0.8); drawTree(x + 165, y + 20, 0.85); }

  function drawTree(x, y, scale) {
    ctx.fillStyle = "#765334"; ctx.fillRect(x - 8 * scale, y + 30 * scale, 16 * scale, 70 * scale);
    ctx.fillStyle = "rgba(95,116,71,0.9)";
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath(); ctx.arc(x + Math.cos(i) * 26 * scale, y + Math.sin(i * 1.7) * 22 * scale, 34 * scale, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "rgba(233,157,145,0.78)";
    for (let i = 0; i < 18; i += 1) ctx.fillRect(x - 42 * scale + (i * 11) % (84 * scale), y - 32 * scale + (i * 17) % (65 * scale), 4 * scale, 4 * scale);
  }

  function drawCampfire(x, y) {
    ctx.fillStyle = "#5b3c27"; ctx.fillRect(x - 44, y + 22, 88, 10);
    ctx.fillStyle = "#c84f35"; ctx.beginPath(); ctx.moveTo(x, y - 24); ctx.lineTo(x - 16, y + 20); ctx.lineTo(x + 18, y + 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f1b75b"; ctx.beginPath(); ctx.moveTo(x + 4, y - 8); ctx.lineTo(x - 8, y + 18); ctx.lineTo(x + 11, y + 18); ctx.closePath(); ctx.fill();
  }

  function drawBoat(x, y) {
    ctx.fillStyle = "#6f5037"; ctx.beginPath(); ctx.ellipse(x, y, 70, 18, -0.05, 0, Math.PI * 2); ctx.fill();
    drawPropPerson(x - 20, y - 22, "boatman");
    ctx.strokeStyle = "#4b3928"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 18, y - 70); ctx.lineTo(x + 50, y + 32); ctx.stroke();
  }

  function drawPropPerson(x, y, label) {
    ctx.fillStyle = "#2f2419"; ctx.beginPath(); ctx.arc(x, y - 18, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 7, y - 10, 14, 24);
    drawInkText(label, x + 13, y - 8, 11);
  }

  function drawVillagers() {
    personas.forEach((p) => drawNpc(p));
  }

  function drawNpc(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = `hsl(${p.hue}, 45%, 42%)`;
    ctx.fillRect(-9, -26, 18, 30);
    ctx.fillStyle = "#2f2419";
    ctx.beginPath(); ctx.arc(0, -34, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,250,238,0.82)";
    ctx.fillRect(-38, 8, 76, 18);
    ctx.fillStyle = "#211a14";
    ctx.font = "10px ui-monospace";
    ctx.textAlign = "center";
    ctx.fillText(p.name.split(" ")[0], 0, 21);
    ctx.restore();
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(player.dir, 1);
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(0, -35, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f2e4cc"; ctx.fillRect(-10, -25, 20, 34);
    ctx.fillStyle = "#111"; ctx.fillRect(-12, -8, 24, 10);
    ctx.restore();
  }

  function drawInkText(text, x, y, size) {
    ctx.fillStyle = "rgba(33,26,20,0.74)";
    ctx.font = `${size}px Georgia, serif`;
    ctx.fillText(text, x, y);
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
})();
