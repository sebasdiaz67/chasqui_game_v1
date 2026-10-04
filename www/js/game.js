/*!
 * Chasqui: El Mensajero Inca
 * Archivo: js/game.js
 * Autor: Byron Sebastián Rosero Díaz — Ingeniero de software
 * Versión: 1.0.0
 * © 2026 Byron Sebastián Rosero Díaz. Todos los derechos reservados.
 */
/* Lógica principal: modos (campaña / infinito), entidades, colisiones, input y UI. */
(function (CH) {
  'use strict';
  const CFG = CH.CFG;
  const { W, H, ROAD_L, ROAD_R, PLAYER_Y, PX_PER_M, TRAMO_M } = CFG;
  const D = CH.Draw, Sfx = CH.Sfx, Store = CH.Store;

  const canvas = document.getElementById('game');
  const frame = document.getElementById('frame');
  const stage = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const pickWeighted = (w) => {
    const keys = Object.keys(w);
    let r = Math.random() * keys.reduce((s, k) => s + w[k], 0);
    for (const k of keys) { r -= w[k]; if (r <= 0) return k; }
    return keys[0];
  };

  // ---------- Estado global ----------
  let scale = 1;
  let mode = 'menu'; // menu | chars | levels | mission | playing | paused | win | over
  let lastTs = 0;
  let pendingLevel = 0;
  const save = {
    best: Store.get('best', 0),
    totalQuipus: Store.get('quipus', 0),
    charId: Store.get('char', 'amaru'),
    tutorialSeen: Store.get('tutorial', false),
    levelsDone: Store.get('levels.v2', []),   // v2: campaña por suyos
    maxLevel: Store.get('maxLevel', 0),   // nivel más alto alcanzado (campaña)
  };
  const world = { t: 0, scroll: 0, decor: [], decorTimer: 0, parts: [], biome: 'norte' };
  const player = { x: W / 2, targetX: W / 2, r: 12 };
  const keys = { left: false, right: false };
  let S = null; // partida en curso

  const getChar = () => CH.CHARACTERS.find((c) => c.id === save.charId) || CH.CHARACTERS[0];
  const isUnlocked = (ch) => save.totalQuipus >= ch.unlock;
  const biome = (k) => CH.BIOMES[k] || CH.BIOMES.norte;
  const tramoCfg = (i) => CH.TRAMOS[i % CH.TRAMOS.length];
  const LAST_LEVEL_ID = CH.LEVELS[CH.LEVELS.length - 1].id;
  const levelUnlocked = (i) => i === 0 || save.levelsDone.includes(CH.LEVELS[i - 1].id);
  const endlessUnlocked = () => save.levelsDone.includes(LAST_LEVEL_ID);

  // ---------- Escalado ----------
  function resize() {
    // Área segura (spec 005-R4): #stage aplica env(safe-area-inset-*) como padding;
    // el juego se escala dentro del espacio libre, así el HUD nunca queda bajo el notch.
    const cs = getComputedStyle(stage);
    const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    scale = Math.min(availW / W, availH / H);
    const dpr = window.devicePixelRatio || 1;
    frame.style.width = `${W * scale}px`;
    frame.style.height = `${H * scale}px`;
    canvas.width = Math.round(W * scale * dpr);
    canvas.height = Math.round(H * scale * dpr);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  }

  // ---------- Inicio de partidas ----------
  function baseState(ch) {
    return {
      char: ch, meters: 0, lives: ch.lives, maxLives: ch.lives + CFG.MAX_LIVES_BONUS,
      quipus: 0, bonus: 0, score: 0, invuln: 1.0, shake: 0, stumble: 0,
      powers: { inti: 0, killa: 0 }, powerMax: { inti: 1, killa: 1 }, pututu: 1,
      hazTimer: 1.8, quipuTimer: 0.8, powerTimer: rand(8, 12), plantTimer: 0.8,
      lastAbismoM: -999, nextRiverM: Infinity, ents: [], banner: null, finishing: 0,
    };
  }

  function resetWorld(biomeKey) {
    world.biome = biomeKey;
    world.parts = [];
    world.decor = [];
    for (let y = -20; y < H; y += 26) spawnDecor(y);
  }

  function resetPlayer(ch) {
    player.r = ch.radius;
    player.x = player.targetX = W / 2;
  }

  function makeHouses(fromDy, toDy, step) {
    const out = [];
    for (let dy = fromDy, k = 0; dy < toDy; dy += step, k++) {
      out.push({ side: -1, dy: dy + (k % 2) * 12, w: rand(44, 52), h: rand(32, 40) });
      out.push({ side: 1, dy: dy + ((k + 1) % 2) * 12 + 20, w: rand(44, 52), h: rand(32, 40) });
    }
    return out;
  }
  function makePeople(n, fromDy, toDy) {
    const cols = ['#a0522d', '#2e86c1', '#c0392b', '#8e44ad', '#d35400'];
    return Array.from({ length: n }, (_, k) => ({ side: k % 2 ? 1 : -1, dy: rand(fromDy, toDy), color: cols[k % cols.length] }));
  }

  function startLevel(i) {
    const L = CH.LEVELS[i];
    const ch = getChar();
    S = baseState(ch);
    S.gameMode = 'campaign';
    S.levelIdx = i; S.level = L; S.lengthM = L.lengthM; S.diffStep = 0;
    reachLevel(L.id);
    S.goal = { type: L.goal.type, need: L.goal.need || 0, have: 0, timeLeft: L.goal.seconds || 0, total: L.goal.seconds || 0 };
    S.destSpawned = false;
    S.nextRiverM = L.rivers ? rand(L.rivers[0] * 0.6, L.rivers[1] * 0.6) : Infinity;
    S.nextAbismoM = L.abismo ? rand(L.abismo.every[0] * 0.6, L.abismo.every[1] * 0.6) : Infinity;
    resetWorld(L.biome);
    S.ents.push({ kind: 'aldea', type: 'origen', y: PLAYER_Y + 10, giver: true,
      houses: makeHouses(-330, 120, 78), people: makePeople(2, -250, -60) });
    S.banner = { title: L.title, sub: L.from + '  →  ' + L.to, fact: L.goal.label, t: 3 };
    S.hazTimer = 2.6;
    resetPlayer(ch);
    updatePututuBtn();
    setMode('playing');
  }

  function startEndless() {
    const ch = getChar();
    S = baseState(ch);
    S.gameMode = 'endless';
    S.tramo = 0; S.nextTamboM = TRAMO_M; S.tamboSpawned = false;
    resetWorld(tramoCfg(0).biome);
    if (!save.tutorialSeen) {
      S.banner = { title: '¡Corre, chasqui!', sub: 'Desliza el dedo para moverte',
        fact: 'Recoge quipus, esquiva obstáculos y usa el pututu (botón inferior) para despejar el camino.', t: 5 };
      save.tutorialSeen = true; Store.set('tutorial', true);
      S.hazTimer = 4;
    } else {
      S.banner = { title: 'Camino infinito', sub: 'Tramo 1 · ' + tramoCfg(0).name, fact: null, t: 2 };
    }
    resetPlayer(ch);
    updatePututuBtn();
    setMode('playing');
  }

  function restart() { if (S && S.gameMode === 'campaign') startLevel(S.levelIdx); else startEndless(); }

  // Parámetros vigentes según el modo
  function cur() {
    if (S.gameMode === 'campaign') {
      // Curva de dificultad en escalones: cada DIFF_STEP_M sube la velocidad y baja el intervalo de spawn.
      const L = S.level, steps = Math.max(1, Math.floor(L.lengthM / CFG.DIFF_STEP_M));
      const step = Math.min(steps, Math.floor(S.meters / CFG.DIFF_STEP_M)), k = step / steps;
      return { hazards: L.hazards, abismo: false, abyss: L.abismo || null, rivers: L.rivers || null, step,
        speed: L.speed + k * L.speedRamp, interval: lerp(L.interval[0], L.interval[1], k) };
    }
    const tr = tramoCfg(S.tramo), p = (S.meters % TRAMO_M) / TRAMO_M;
    return { hazards: tr.hazards, abismo: tr.abismo, rivers: tr.rios ? [180, 260] : null,
      speed: CFG.BASE_SPEED + Math.min(S.tramo, 10) * CFG.SPEED_PER_TRAMO + p * 30,
      interval: clamp(1.15 - S.tramo * 0.1 - p * 0.15, 0.42, 2) };
  }
  const roadX = (margin) => rand(ROAD_L + margin, ROAD_R - margin);

  // ---------- Generación ----------
  function spawnDecor(y = -24) {
    const b = biome(world.biome);
    const left = Math.random() < 0.5;
    const x = left ? rand(10, ROAD_L - 20) : rand(ROAD_R + 20, W - 10);
    const colors = ['#e84393', '#f1c40f', '#ffffff', '#e67e22', '#9b59b6'];
    world.decor.push({ x, y, type: pickWeighted(b.decor), s: rand(4, 8), color: colors[Math.floor(Math.random() * colors.length)] });
  }

  function spawnHazard(c) {
    const inTramo = S.meters % TRAMO_M;
    if (c.abismo && S.meters - S.lastAbismoM > 160 && inTramo > 120 && inTramo < TRAMO_M - 120 && Math.random() < 0.14) {
      S.ents.push({ kind: 'abismo', y: -60, h: 44, bx: roadX(42), bw: Math.max(56, 82 - S.tramo * 4), hit: false });
      S.lastAbismoM = S.meters;
      S.hazTimer += 0.7;
      return;
    }
    const kind = pickWeighted(c.hazards);
    switch (kind) {
      case 'roca': {
        const r = rand(13, 19);
        S.ents.push({ kind: 'roca', x: roadX(r), y: -30, r, pts: rockPts(r) });
        break;
      }
      case 'derrumbe': // sombra de aviso en el camino; al terminar el aviso cae la roca
        S.ents.push({ kind: 'derrumbe', x: clamp(player.x + rand(-50, 50), ROAD_L + 18, ROAD_R - 18), y: rand(120, 230),
          timer: 0.9, max: 0.9, r: rand(14, 18) });
        break;
      case 'llama': {
        const dir = Math.random() < 0.5 ? 1 : -1;
        S.ents.push({ kind: 'llama', x: dir > 0 ? ROAD_L - 10 : ROAD_R + 10, y: -40, dir, vx: dir * rand(35, 65),
          r: 15, seed: Math.random() * 10, wool: Math.random() < 0.5 ? '#f3ead9' : '#c89f73' });
        break;
      }
      case 'condor':
        S.ents.push({ kind: 'warn', x: clamp(player.x + rand(-35, 35), ROAD_L + 18, ROAD_R - 18), timer: 0.95 });
        break;
      case 'puma': case 'jaguar': {
        const side = Math.random() < 0.5 ? -1 : 1;
        S.ents.push({ kind, side, x: side < 0 ? ROAD_L - 26 : ROAD_R + 26, y: -30, state: 'wait',
          trigger: rand(150, 300), timer: 0, vx: 0, r: kind === 'jaguar' ? 15 : 14, speed: kind === 'jaguar' ? 420 : 360 });
        break;
      }
      case 'zorro': {
        const bx = roadX(45);
        S.ents.push({ kind: 'zorro', x: bx, bx, y: -30, vy: rand(50, 90), amp: rand(25, 45), ph: Math.random() * 6, r: 11 });
        break;
      }
      case 'serpiente': {
        const dir = Math.random() < 0.5 ? 1 : -1;
        S.ents.push({ kind: 'serpiente', x: dir > 0 ? ROAD_L - 30 : ROAD_R + 30, y: -20, dir, vx: dir * rand(45, 75),
          r: 7, ph: Math.random() * 6, color: Math.random() < 0.5 ? 'coral' : 'verde' });
        break;
      }
    }
  }

  function rockPts(r) {
    return Array.from({ length: 7 }, (_, k) => {
      const a = (k / 7) * Math.PI * 2, rad = r * rand(0.8, 1.05);
      return [Math.cos(a) * rad, Math.sin(a) * rad * 0.85];
    });
  }

  function spawnRiver() {
    const rio = { kind: 'rio', y: -90, h: 66, bx: roadX(40), bw: 50, hit: false };
    S.ents.push(rio);
    const n = 1 + (Math.random() < 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      S.ents.push({ kind: 'caiman', x: rand(20, W - 20), y: rio.y + 20 + k * 26, vx: dir * rand(55, 90), r: 9 });
    }
    S.hazTimer += 1.0;
  }

  function spawnQuipus() {
    const n = 3 + Math.floor(Math.random() * 3);
    const x = roadX(16);
    const curve = Math.random() < 0.5 ? 0 : rand(-12, 12);
    for (let k = 0; k < n; k++) {
      S.ents.push({ kind: 'quipu', x: clamp(x + curve * k, ROAD_L + 14, ROAD_R - 14), y: -30 - k * 42 });
    }
  }

  function spawnPlant() {
    const n = Math.random() < 0.35 ? 2 : 1;
    const x = roadX(18);
    for (let k = 0; k < n; k++) S.ents.push({ kind: 'planta', x, y: -30 - k * 40 });
  }

  function spawnPower() {
    const w = { inti: 3, killa: 2, pututu: 3 };
    if (S.lives < S.maxLives) w.maiz = 3;
    S.ents.push({ kind: 'power', type: pickWeighted(w), x: roadX(20), y: -30 });
  }

  // ---------- Efectos ----------
  function burst(x, y, color, n = 10, speedMul = 1) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, v = rand(40, 160) * speedMul;
      world.parts.push({ kind: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rand(1.5, 3.5), color, life: 0.6, max: 0.6 });
    }
  }
  function floatText(text, x, y, color = '#fff') {
    world.parts.push({ kind: 'text', text, x: clamp(x, 60, W - 60), y, vx: 0, vy: -40, color, life: 1, max: 1 });
  }
  const HAZARD_COLOR = { derrumbe: '#8d8478', roca: '#95a5a6', condor: '#222', puma: '#c49a5a', jaguar: '#dda436', zorro: '#8f8b84', serpiente: '#2e7d32', caiman: '#4a5a28' };
  function destroy(e, points) {
    e.dead = true;
    burst(e.x, e.y, HAZARD_COLOR[e.kind] || '#f3ead9', 12);
    if (points) { S.bonus += points; floatText('+' + points, e.x, e.y - 10, '#f5d76e'); }
  }

  // ---------- Acciones ----------
  function usePututu() {
    if (mode !== 'playing' || !S || S.pututu <= 0 || S.finishing > 0) return;
    S.pututu--; updatePututuBtn();
    Sfx.pututu();
    world.parts.push({ kind: 'wave', x: player.x, y: PLAYER_Y, r: 10, vr: 700, color: '#f2d7b6', life: 0.6, max: 0.6 });
    const animals = ['roca', 'derrumbe', 'llama', 'condor', 'puma', 'jaguar', 'zorro', 'serpiente', 'caiman'];
    for (const e of S.ents) {
      if (e.dead) continue;
      if (animals.includes(e.kind) && e.y > -40 && e.y < H) destroy(e, 10);
      if (e.kind === 'warn') e.dead = true;
    }
    S.shake = 0.25;
  }

  function applyPower(e) {
    e.dead = true;
    const pc = CH.POWERS[e.type];
    Sfx.power();
    burst(e.x, e.y, pc.color, 14);
    floatText(pc.label, e.x, e.y - 14, pc.color);
    if (e.type === 'inti' || e.type === 'killa') {
      const d = pc.dur * S.char.puMult;
      S.powers[e.type] = d; S.powerMax[e.type] = d;
    } else if (e.type === 'pututu') {
      S.pututu = Math.min(CFG.MAX_PUTUTU, S.pututu + 1); updatePututuBtn();
    } else if (e.type === 'maiz') {
      S.lives = Math.min(S.maxLives, S.lives + 1);
    }
  }

  function onHazard(e, terrain) {
    if (S.finishing > 0) return;
    if (S.powers.inti > 0) {
      if (!terrain) { destroy(e, 20); Sfx.smash(); }
      return;
    }
    if (S.invuln > 0) return;
    S.lives--;
    S.invuln = CFG.INVULN_HIT;
    S.stumble = CFG.STUMBLE;
    S.shake = 0.35;
    Sfx.hit();
    if (navigator.vibrate) navigator.vibrate(90);
    burst(player.x, PLAYER_Y, e.kind === 'rio' ? '#7fd3e6' : '#e74c3c', 14);
    if (e.kind === 'rio') floatText('¡Al agua!', player.x, PLAYER_Y - 30, '#7fd3e6');
    if (!terrain && e.kind === 'roca') destroy(e, 0);
    if (S.gameMode === 'campaign' && S.goal.type === 'collect' && S.goal.have > 0) {
      const lost = Math.min(2, S.goal.have);
      S.goal.have -= lost;
      floatText('-' + lost + ' plantas', player.x, PLAYER_Y - 50, '#ff9f8f');
    }
    if (S.lives <= 0) gameOver('Te quedaste sin vidas.');
  }

  function relay() {
    S.tramo++;
    world.biome = tramoCfg(S.tramo).biome;
    S.nextTamboM += TRAMO_M;
    S.tamboSpawned = false;
    S.bonus += 100;
    if (S.lives < S.maxLives) S.lives++;
    Sfx.relay();
    floatText('+100 ¡Relevo!', player.x, PLAYER_Y - 30, '#f5d76e');
    S.banner = { title: '¡Mensaje entregado!', sub: 'Tramo ' + (S.tramo + 1) + ': ' + tramoCfg(S.tramo).name,
      fact: CH.FACTS[(S.tramo - 1) % CH.FACTS.length], t: 4.5 };
    S.hazTimer = Math.max(S.hazTimer, 3.2);
  }

  function arrive(e) {
    e.reached = true;
    const g = S.goal;
    if (g.type === 'collect' && g.have < g.need) {
      gameOver('Llegaste con ' + g.have + ' de ' + g.need + ' plantas. ' + S.level.receiver.name + ' necesita más.');
      return;
    }
    Sfx.relay();
    burst(W / 2, e.y, '#f5d76e', 24, 1.2);
    floatText(S.level.winTitle, W / 2, PLAYER_Y - 60, '#f5d76e');
    S.finishing = 1.2;
  }

  // ---------- Update ----------
  function updateWorld(dt, dy) {
    world.t += dt;
    world.scroll += dy;
    world.decorTimer -= dy;
    if (world.decorTimer <= 0) { spawnDecor(); world.decorTimer = rand(18, 40); }
    for (const d of world.decor) d.y += dy;
    world.decor = world.decor.filter((d) => d.y < H + 30);
    for (const p of world.parts) {
      p.life -= dt;
      p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
      if (p.kind === 'wave') p.r += p.vr * dt;
    }
    world.parts = world.parts.filter((p) => p.life > 0);
  }

  function updatePlayer(dt) {
    const ch = S.char;
    if (keys.left) player.targetX -= 320 * ch.move * dt;
    if (keys.right) player.targetX += 320 * ch.move * dt;
    player.targetX = clamp(player.targetX, ROAD_L + player.r, ROAD_R - player.r);
    const diff = player.targetX - player.x;
    player.x += Math.sign(diff) * Math.min(Math.abs(diff), 650 * ch.move * dt);
  }

  function updateEntity(e, dt, dy, slow) {
    switch (e.kind) {
      case 'warn':
        e.timer -= dt * slow;
        if (e.timer <= 0) { e.dead = true; S.ents.push({ kind: 'condor', x: e.x, y: -40, vy: 560 + (S.tramo || 0) * 30, r: 15 }); }
        return;
      case 'puma': case 'jaguar':
        e.y += dy;
        if (e.state === 'wait' && e.y >= e.trigger) { e.state = 'warn'; e.timer = 0.6; }
        else if (e.state === 'warn') { e.timer -= dt * slow; if (e.timer <= 0) { e.state = 'jump'; e.vx = -e.side * e.speed; } }
        else if (e.state === 'jump') e.x += e.vx * slow * dt;
        return;
      case 'derrumbe':
        e.y += dy; e.timer -= dt * slow;
        if (e.timer <= 0) {
          e.kind = 'roca'; e.pts = rockPts(e.r);
          burst(e.x, e.y, '#8d8478', 14); S.shake = Math.max(S.shake, 0.15); Sfx.smash();
        }
        return;
      case 'zorro':
        e.y += dy + e.vy * slow * dt;
        e.x = clamp(e.bx + Math.sin(world.t * 3 + e.ph) * e.amp, ROAD_L + 10, ROAD_R - 10);
        return;
      case 'caiman':
        e.y += dy; e.x += e.vx * slow * dt;
        if ((e.x < 15 && e.vx < 0) || (e.x > W - 15 && e.vx > 0)) e.vx = -e.vx;
        return;
      default:
        e.y += dy;
        if (e.kind === 'llama' || e.kind === 'serpiente') e.x += e.vx * slow * dt;
        if (e.kind === 'condor') e.y += e.vy * slow * dt;
        if ((e.kind === 'quipu' || e.kind === 'planta') && S.powers.inti > 0) { // Inti atrae lo coleccionable
          const dx = player.x - e.x, ddy = PLAYER_Y - e.y;
          if (dx * dx + ddy * ddy < 110 * 110) { e.x += dx * 4 * dt; e.y += ddy * 4 * dt; }
        }
    }
  }

  function updateRun(dt) {
    const c = cur();
    if (S.gameMode === 'campaign' && c.step > S.diffStep) {
      S.diffStep = c.step;
      floatText('El camino se acelera', W / 2, 150, '#f5d76e');
    }
    const slow = S.powers.killa > 0 ? 0.5 : 1;
    const stumble = S.stumble > 0 ? 0.45 : 1;
    const ending = S.finishing > 0 ? clamp(S.finishing / 1.2, 0, 1) : 1;
    const dy = c.speed * slow * stumble * ending * dt;
    updateWorld(dt, dy);
    updatePlayer(dt);

    S.meters += dy / PX_PER_M;
    S.invuln = Math.max(0, S.invuln - dt);
    S.stumble = Math.max(0, S.stumble - dt);
    S.shake = Math.max(0, S.shake - dt);
    S.powers.inti = Math.max(0, S.powers.inti - dt);
    S.powers.killa = Math.max(0, S.powers.killa - dt);
    if (S.banner) { S.banner.t -= dt; if (S.banner.t <= 0) S.banner = null; }

    if (S.finishing > 0) {
      for (const e of S.ents) e.y += dy;
      S.finishing -= dt;
      if (S.finishing <= 0) completeLevel();
      return;
    }

    let calm = false;
    if (S.gameMode === 'campaign') {
      const remainingPx = (S.lengthM - S.meters) * PX_PER_M;
      if (!S.destSpawned && remainingPx <= PLAYER_Y + 300) {
        S.ents.push({ kind: 'aldea', type: 'destino', y: PLAYER_Y - remainingPx, reached: false, receiver: S.level.receiver,
          houses: makeHouses(-300, 40, 78), people: makePeople(3, -260, -60) });
        S.destSpawned = true;
      }
      calm = S.destSpawned;
      if (S.goal.type === 'time') {
        S.goal.timeLeft -= dt;
        if (S.goal.timeLeft <= 0) { gameOver('Anocheció antes de que llegara el quipu.'); return; }
      }
      if (S.goal.type === 'collect' && !calm) {
        S.plantTimer -= dt * slow;
        if (S.plantTimer <= 0) { spawnPlant(); S.plantTimer = rand(1.3, 2.1); }
      }
    } else {
      const tamboAhead = (S.nextTamboM - S.meters) * PX_PER_M;
      if (!S.tamboSpawned && tamboAhead <= PLAYER_Y + 60) {
        const idx = CH.CHARACTERS.indexOf(S.char);
        S.ents.push({ kind: 'tambo', y: PLAYER_Y - tamboAhead, done: false,
          nextChar: CH.CHARACTERS[(idx + S.tramo + 1) % CH.CHARACTERS.length] });
        S.tamboSpawned = true;
      }
      calm = S.ents.some((e) => e.kind === 'tambo' && !e.done);
    }

    if (c.rivers && !calm && S.meters >= S.nextRiverM) {
      spawnRiver();
      S.nextRiverM = S.meters + rand(c.rivers[0], c.rivers[1]);
    } else if (c.rivers && S.nextRiverM === Infinity) {
      S.nextRiverM = S.meters + rand(c.rivers[0], c.rivers[1]) * 0.5;
    }

    if (c.abyss && !calm && S.meters >= S.nextAbismoM && S.lengthM - S.meters > 120) {
      S.ents.push({ kind: 'abismo', y: -90, h: c.abyss.h, bx: roadX(40), bw: c.abyss.bw, hit: false });
      S.nextAbismoM = S.meters + rand(c.abyss.every[0], c.abyss.every[1]);
      S.hazTimer += 0.9;
    }

    S.hazTimer -= dt * slow;
    if (S.hazTimer <= 0) { if (!calm) spawnHazard(c); S.hazTimer = c.interval * rand(0.8, 1.2); }
    S.quipuTimer -= dt * slow;
    if (S.quipuTimer <= 0) { if (!calm) spawnQuipus(); S.quipuTimer = rand(1.8, 3.0); }
    S.powerTimer -= dt * slow;
    if (S.powerTimer <= 0) { if (!calm) spawnPower(); S.powerTimer = rand(9, 15); }

    for (const e of S.ents.slice()) updateEntity(e, dt, dy, slow);

    // colisiones
    const pr = player.r, px = player.x, py = PLAYER_Y;
    const near = (x, y, r) => { const dx = px - x, ddy = py - y, rr = pr + r; return dx * dx + ddy * ddy < rr * rr; };
    for (const e of S.ents) {
      if (e.dead) continue;
      switch (e.kind) {
        case 'roca': case 'llama': case 'condor': case 'zorro':
          if (near(e.x, e.y, e.r * 0.8)) onHazard(e, false);
          break;
        case 'puma': case 'jaguar':
          if (e.state !== 'wait' && near(e.x, e.y, e.r)) onHazard(e, false);
          break;
        case 'serpiente':
          for (let k = 0; k < 5; k += 2) {
            const [sx, sy] = D.snakePoint(e, k, world.t);
            if (near(sx, sy, e.r)) { onHazard(e, false); break; }
          }
          break;
        case 'caiman': {
          const d = e.vx >= 0 ? 1 : -1;
          if (near(e.x + d * 20, e.y, e.r) || near(e.x, e.y, e.r) || near(e.x - d * 16, e.y, e.r * 0.8)) onHazard(e, false);
          break;
        }
        case 'abismo': case 'rio': {
          const inBand = py + pr * 0.4 > e.y && py - pr * 0.4 < e.y + e.h;
          const offBridge = Math.abs(px - e.bx) > e.bw / 2 - pr * 0.4;
          if (inBand && offBridge && !e.hit) { e.hit = true; onHazard(e, true); }
          break;
        }
        case 'quipu':
          if (near(e.x, e.y, 13)) { e.dead = true; S.quipus++; Sfx.quipu(); burst(e.x, e.y, '#f1c40f', 6, 0.6); }
          break;
        case 'planta':
          if (near(e.x, e.y, 14)) {
            e.dead = true; S.goal.have++; Sfx.quipu(); burst(e.x, e.y, '#6fdc7d', 8, 0.6);
            if (S.goal.have === S.goal.need) floatText('¡Plantas suficientes!', px, py - 40, '#7dff9a');
          }
          break;
        case 'power':
          if (near(e.x, e.y, 16)) applyPower(e);
          break;
        case 'tambo':
          if (!e.done && e.y >= py) { e.done = true; relay(); }
          break;
        case 'aldea':
          if (e.type === 'destino' && !e.reached && e.y - 8 >= py - 26) arrive(e);
          break;
      }
      if (mode !== 'playing') return;
    }

    S.ents = S.ents.filter((e) => {
      if (e.dead) return false;
      if (e.kind === 'aldea') return e.y < H + 420;
      if (e.y > H + 80) return false;
      if (e.kind === 'llama' || e.kind === 'serpiente') return e.x > ROAD_L - 50 && e.x < ROAD_R + 50;
      if ((e.kind === 'puma' || e.kind === 'jaguar') && e.state === 'jump') return e.x > ROAD_L - 60 && e.x < ROAD_R + 60;
      return true;
    });
    S.score = Math.floor(S.meters) + S.quipus * 10 + S.bonus;
  }

  // ---------- Render ----------
  function render() {
    const b = biome(world.biome);
    ctx.save();
    if (S && S.shake > 0 && mode === 'playing') ctx.translate(rand(-4, 4) * S.shake * 3, rand(-4, 4) * S.shake * 3);

    D.background(ctx, world.scroll, b);
    const inRun = S && ['playing', 'paused', 'over', 'win'].includes(mode);
    if (inRun) {
      const t = world.t;
      const layer = (k) => S.ents.filter((e) => e.kind === k);
      layer('rio').forEach((e) => D.rio(ctx, e, t));
      layer('abismo').forEach((e) => D.abismo(ctx, e));
      for (const d of world.decor) D.decor(ctx, d, b);
      layer('caiman').forEach((e) => D.caiman(ctx, e, t));
      layer('aldea').forEach((e) => D.aldea(ctx, e, b, t));
      layer('tambo').forEach((e) => D.tambo(ctx, e, t, e.done ? null : e.nextChar));
      layer('quipu').forEach((e) => D.quipu(ctx, e.x, e.y, t));
      layer('planta').forEach((e) => D.planta(ctx, e.x, e.y, t));
      layer('power').forEach((e) => D.power(ctx, e.x, e.y, e.type, t));
      layer('derrumbe').forEach((e) => D.derrumbe(ctx, e, t));
      layer('roca').forEach((e) => D.roca(ctx, e));
      layer('serpiente').forEach((e) => D.serpiente(ctx, e, t));
      layer('llama').forEach((e) => D.llama(ctx, e, t));
      layer('zorro').forEach((e) => D.zorro(ctx, e, t));

      const blink = S.invuln > 0 && S.finishing <= 0 && Math.floor(t * 14) % 2 === 0;
      D.chasqui(ctx, player.x, PLAYER_Y, t, S.char, blink ? 0.35 : 1, mode === 'playing' && S.finishing <= 0);
      if (S.powers.inti > 0) D.shield(ctx, player.x, PLAYER_Y, player.r, t, S.powers.inti);

      layer('puma').forEach((e) => D.felino(ctx, e, t));
      layer('jaguar').forEach((e) => D.felino(ctx, e, t));
      layer('condor').forEach((e) => D.condor(ctx, e, t));
      layer('warn').forEach((e) => D.warn(ctx, e, t));
      D.particles(ctx, world.parts);
      if (b.snow) D.snow(ctx, t);
      if (S.powers.killa > 0) D.tint(ctx, 'rgba(110,130,255,0.13)');
      if (S.gameMode === 'campaign' && S.goal.type === 'time' && S.level.goal.night) {
        D.tint(ctx, `rgba(20,24,70,${0.38 * (1 - S.goal.timeLeft / S.goal.total)})`); // anochece
      }
      ctx.restore();
      if (S.gameMode === 'campaign') D.hudCampaign(ctx, S, t); else D.hud(ctx, S, t);
      if (S.banner && mode === 'playing') D.banner(ctx, S.banner);
      return;
    }
    for (const d of world.decor) D.decor(ctx, d, b);
    D.chasqui(ctx, player.x, PLAYER_Y, world.t, getChar(), 1);
    ctx.restore();
  }

  // ---------- Loop ----------
  function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    if (mode === 'playing') updateRun(dt);
    else if (['menu', 'chars', 'levels', 'mission'].includes(mode)) {
      updateWorld(dt, CFG.BASE_SPEED * 0.8 * dt);
      player.x += (W / 2 + Math.sin(world.t * 0.8) * 50 - player.x) * dt * 2;
    }
    render();
    requestAnimationFrame(loop);
  }

  // ---------- Fin de partida ----------
  function addQuipus() {
    const prev = save.totalQuipus;
    save.totalQuipus += S.quipus;
    Store.set('quipus', save.totalQuipus);
    return CH.CHARACTERS.filter((c) => c.unlock > prev && c.unlock <= save.totalQuipus);
  }
  function unlockText(chars) {
    return chars.length ? '¡Nuevo chasqui desbloqueado: ' + chars.map((c) => c.name).join(', ') + '!' : '';
  }

  function reachLevel(id) {
    if (id > save.maxLevel) { save.maxLevel = id; Store.set('maxLevel', id); }
  }

  function gameOver(reason) {
    setMode('over');
    Sfx.over();
    const unlocked = addQuipus();
    S.score = Math.floor(S.meters) + S.quipus * 10 + S.bonus;
    const campaign = S.gameMode === 'campaign';
    let isRecord = false;
    if (!campaign && S.score > save.best) { save.best = S.score; Store.set('best', save.best); isRecord = true; }

    $('o-title').textContent = campaign ? 'Misión fallida' : 'El mensaje se detuvo';
    $('o-reason').textContent = reason || '';
    $('o-dist').textContent = campaign ? Math.floor(S.meters) + ' / ' + S.lengthM + ' m' : Math.floor(S.meters) + ' m';
    $('o-quipus').textContent = S.quipus;
    $('o-stage-label').textContent = campaign ? 'Nivel' : 'Tramo';
    $('o-tramo').textContent = campaign ? S.level.id + ' · ' + S.level.title : (S.tramo + 1) + ' · ' + tramoCfg(S.tramo).name;
    $('o-score').textContent = S.score;
    $('o-best').textContent = save.best;
    $('o-row-score').hidden = campaign;
    $('o-row-best').hidden = campaign;
    $('o-row-max').hidden = !campaign;
    $('o-max').textContent = 'Nivel ' + save.maxLevel;
    $('o-record').classList.toggle('hidden', !isRecord);
    const un = $('o-unlock');
    un.textContent = unlockText(unlocked);
    un.classList.toggle('hidden', !unlocked.length);
  }

  function completeLevel() {
    const L = S.level;
    const first = !save.levelsDone.includes(L.id);
    if (first) { save.levelsDone.push(L.id); Store.set('levels.v2', save.levelsDone); }
    const unlocked = addQuipus();
    setMode('win');
    $('w-title').textContent = L.winTitle;
    $('w-text').textContent = L.win;
    $('w-fact').textContent = L.facts[1];
    $('w-inca').textContent = '«' + L.inca + '»';
    if (CH.LEVELS[S.levelIdx + 1]) reachLevel(CH.LEVELS[S.levelIdx + 1].id);
    const stats = [['Quipus', S.quipus], ['Vidas', S.lives + ' / ' + S.maxLives]];
    if (S.goal.type === 'collect') stats.push(['Plantas', S.goal.have + ' / ' + S.goal.need]);
    if (S.goal.type === 'time') stats.push(['Tiempo sobrante', Math.ceil(S.goal.timeLeft) + ' s']);
    const dl = $('w-stats'); dl.innerHTML = '';
    for (const [k, v] of stats) {
      const row = document.createElement('div');
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      row.append(dt, dd); dl.append(row);
    }
    const hasNext = S.levelIdx + 1 < CH.LEVELS.length;
    $('btn-next').hidden = !hasNext;
    let note = unlockText(unlocked);
    if (!hasNext && first) note = (note ? note + ' ' : '') + '¡Desbloqueaste el Camino infinito!';
    $('w-note').textContent = note;
    $('w-note').classList.toggle('hidden', !note);
  }

  // ---------- UI ----------
  function setMode(next) {
    mode = next;
    const screens = [['screen-menu', 'menu'], ['screen-chars', 'chars'], ['screen-levels', 'levels'], ['screen-mission', 'mission'],
      ['screen-pause', 'paused'], ['screen-win', 'win'], ['screen-over', 'over']];
    for (const [id, m] of screens) $(id).classList.toggle('hidden', mode !== m);
    $('hud-buttons').classList.toggle('hidden', !(mode === 'playing' || mode === 'paused'));
    if (mode === 'menu') {
      world.biome = 'norte';
      $('m-best').textContent = save.best;
      $('m-max').textContent = save.maxLevel || '—';
      $('m-credits').textContent = 'v' + CH.META.version + ' | Desarrollado por ' + CH.META.author;
      $('m-quipus').textContent = save.totalQuipus;
      $('m-char').textContent = getChar().name;
      const open = endlessUnlocked();
      $('btn-endless').classList.toggle('locked', !open);
      $('m-endless-note').textContent = open ? '' : 'Se desbloquea al completar el nivel ' + LAST_LEVEL_ID;
    }
    if (mode === 'chars') renderChars();
    if (mode === 'levels') renderLevels();
    lastTs = performance.now();
  }

  function showMission(i) {
    const L = CH.LEVELS[i];
    pendingLevel = i;
    world.biome = L.biome;
    $('mi-num').textContent = 'Nivel ' + L.id + ' · ' + L.region;
    $('mi-title').textContent = L.title;
    $('mi-route').textContent = L.from + '  →  ' + L.to;
    $('mi-giver').textContent = L.giver + ' dice:';
    $('mi-request').textContent = '«' + L.request + '»';
    $('mi-goal').textContent = L.goal.label;
    $('mi-fact').textContent = L.facts[0];
    setMode('mission');
  }

  const GOAL_TYPE = { deliver: 'Entregar', collect: 'Recolectar y entregar', time: 'Contrarreloj' };
  function renderLevels() {
    const list = $('level-list');
    list.innerHTML = '';
    CH.LEVELS.forEach((L, i) => {
      const open = levelUnlocked(i), done = save.levelsDone.includes(L.id);
      const card = document.createElement('button');
      card.className = 'level-card' + (open ? '' : ' locked') + (done ? ' done' : '');
      const num = document.createElement('span'); num.className = 'level-num'; num.textContent = L.id;
      const info = document.createElement('span'); info.className = 'level-info';
      const t = document.createElement('strong'); t.textContent = L.title;
      const r = document.createElement('small'); r.textContent = L.region + ' · ' + GOAL_TYPE[L.goal.type];
      info.append(t, r);
      const st = document.createElement('span'); st.className = 'level-state';
      st.textContent = done ? '✓ Completado' : open ? 'Jugar' : '🔒';
      card.append(num, info, st);
      card.addEventListener('click', () => { Sfx.click(); if (open) showMission(i); });
      list.append(card);
    });
    for (const L of CH.LEVELS_SOON) {
      const card = document.createElement('div');
      card.className = 'level-card soon';
      card.innerHTML = '';
      const num = document.createElement('span'); num.className = 'level-num'; num.textContent = L.id;
      const info = document.createElement('span'); info.className = 'level-info';
      const t = document.createElement('strong'); t.textContent = L.title;
      const r = document.createElement('small'); r.textContent = L.region;
      info.append(t, r);
      const st = document.createElement('span'); st.className = 'level-state'; st.textContent = 'Próximamente';
      card.append(num, info, st);
      list.append(card);
    }
  }

  function updatePututuBtn() {
    $('pututu-count').textContent = S ? S.pututu : 0;
    $('btn-pututu').classList.toggle('empty', !S || S.pututu <= 0);
  }
  function updateSoundBtn() { $('btn-sound').textContent = Sfx.isMuted() ? 'Sonido: NO' : 'Sonido: SÍ'; }

  function renderChars() {
    $('c-quipus').textContent = save.totalQuipus;
    const list = $('char-list');
    list.innerHTML = '';
    for (const ch of CH.CHARACTERS) {
      const unlocked = isUnlocked(ch);
      const card = document.createElement('button');
      card.className = 'char-card' + (ch.id === save.charId ? ' selected' : '') + (unlocked ? '' : ' locked');
      const cv = document.createElement('canvas');
      cv.width = 120; cv.height = 140;
      const c = cv.getContext('2d'); c.scale(2, 2);
      D.chasqui(c, 30, 40, 0, ch, unlocked ? 1 : 0.35, false);
      const info = document.createElement('div');
      info.className = 'char-info';
      const name = document.createElement('strong'); name.textContent = ch.name;
      const title = document.createElement('em'); title.textContent = ch.title;
      const stats = document.createElement('span');
      stats.textContent = '♥ ' + ch.lives + '  ·  Velocidad ' + Math.round(ch.move * 100) + '%';
      const perk = document.createElement('small'); perk.textContent = ch.perk;
      info.append(name, title, stats, perk);
      if (!unlocked) {
        const lock = document.createElement('span'); lock.className = 'lock';
        lock.textContent = '🔒 Se desbloquea con ' + ch.unlock + ' quipus';
        info.append(lock);
      }
      card.append(cv, info);
      card.addEventListener('click', () => {
        Sfx.click();
        if (!unlocked) return;
        save.charId = ch.id; Store.set('char', ch.id);
        renderChars();
      });
      list.append(card);
    }
  }

  function pause() { if (mode === 'playing') setMode('paused'); }
  function resume() { if (mode === 'paused') setMode('playing'); }

  // ---------- Input (arrastre relativo) ----------
  let drag = null;
  const toX = (e) => (e.clientX - canvas.getBoundingClientRect().left) / scale;
  canvas.addEventListener('pointerdown', (e) => {
    if (mode !== 'playing') return;
    canvas.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, sx: toX(e), px: player.targetX };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id || mode !== 'playing') return;
    player.targetX = drag.px + (toX(e) - drag.sx) * 1.3 * S.char.move;
  });
  const endDrag = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === ' ') { e.preventDefault(); usePututu(); }
    if (e.key === 'Escape' || e.key === 'p') { if (mode === 'playing') pause(); else resume(); }
    if (e.key === 'Enter') {
      Sfx.unlock();
      if (mode === 'mission') startLevel(pendingLevel);
      else if (mode === 'over') restart();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  // Toda interacción con botones desbloquea el audio e inicia la música (política de autoplay, spec 005-R2).
  const on = (id, fn) => $(id).addEventListener('click', () => { Sfx.unlock(); Sfx.playBGM(); fn(); });
  on('btn-campaign', () => { Sfx.click(); setMode('levels'); });
  on('btn-endless', () => { if (endlessUnlocked()) startEndless(); else Sfx.click(); });
  on('btn-chars', () => { Sfx.click(); setMode('chars'); });
  on('btn-chars-back', () => { Sfx.click(); setMode('menu'); });
  on('btn-levels-back', () => { Sfx.click(); setMode('menu'); });
  on('btn-mission-go', () => startLevel(pendingLevel));
  on('btn-mission-back', () => { Sfx.click(); setMode('levels'); });
  on('btn-sound', () => { Sfx.toggleMute(); updateSoundBtn(); Sfx.click(); });
  on('btn-pause', pause);
  on('btn-resume', resume);
  on('btn-restart', restart);
  on('btn-quit', () => setMode('menu'));
  on('btn-retry', restart);
  on('btn-menu', () => setMode('menu'));
  on('btn-next', () => showMission(S.levelIdx + 1));
  on('btn-win-menu', () => setMode('levels'));
  $('btn-pututu').addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation(); Sfx.unlock(); Sfx.playBGM(); usePututu();
  });

  // Android: al pasar a segundo plano se pausa el juego y se detiene la música.
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); Sfx.stopBGM(); } });
  window.addEventListener('resize', resize);

  // ---------- Init ----------
  resize();
  resetWorld('norte');
  updateSoundBtn();
  setMode('menu');
  requestAnimationFrame((ts) => { lastTs = ts; loop(ts); });

  // Hook para pruebas automatizadas (no afecta el juego).
  CH._debug = { get S() { return S; }, get mode() { return mode; }, player, usePututu, startLevel, startEndless, save, cur };
})(window.CH);
