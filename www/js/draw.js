/*!
 * Chasqui: El Mensajero Inca
 * Archivo: js/draw.js
 * Autor: Byron Sebastián Rosero Díaz — Ingeniero de software
 * Versión: 1.0.0
 * © 2026 Byron Sebastián Rosero Díaz. Todos los derechos reservados.
 */
/* Todo el arte es procedural (Canvas 2D): no hay imágenes externas. */
(function (CH) {
  'use strict';
  const { W, H, ROAD_L, ROAD_R } = CH.CFG;
  const TAU = Math.PI * 2;
  const D = {};

  // ---------- Primitivas ----------
  function rr(c, x, y, w, h, r, fill) {
    c.fillStyle = fill;
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
    c.fill();
  }
  function ell(c, x, y, rx, ry, fill, rot = 0) {
    c.fillStyle = fill;
    c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill();
  }
  function line(c, x1, y1, x2, y2, color, w) {
    c.strokeStyle = color; c.lineWidth = w;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  function heart(c, x, y, s, fill, stroke) {
    c.beginPath();
    c.moveTo(x, y + s * 0.3);
    c.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    c.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    c.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    c.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
  }
  // Sombra de contacto en la base de un sprite (profundidad sobre el suelo).
  function groundShadow(c, x, y, rx, ry = rx * 0.32, a = 0.28) { ell(c, x, y, rx, ry, `rgba(0,0,0,${a})`); }
  // Halo radial saturado para que los coleccionables resalten sobre el camino beige.
  function halo(c, r, rgb, a = 0.6) {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.6, `rgba(${rgb},${a * 0.45})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  }
  D.groundShadow = groundShadow;

  // Vidas compactas (spec 005-R5): un corazón y el contador.
  function livesBadge(c, S) {
    heart(c, 16, 8, 18, S.lives > 1 ? '#ff3b4e' : '#ff8a3d');
    c.fillStyle = '#fff'; c.font = 'bold 16px sans-serif'; c.textAlign = 'left';
    c.fillText('×' + S.lives, 30, 23);
  }

  function wrap(c, text, maxW) {
    const words = text.split(' ');
    const lines = []; let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // ---------- Escenario ----------
  D.background = function (c, scroll, tr) {
    c.fillStyle = tr.grass; c.fillRect(0, 0, W, H);
    const LW = ROAD_L - 8, RX = ROAD_R + 8, RW = W - ROAD_R - 8;
    if (tr.sides === 'andenes') {
      // andenes: terrazas de cultivo escalonadas con muros de piedra
      const band = 30, off = scroll % (band * 2);
      for (let y = -band * 2 + off, k = 0; y < H; y += band, k++) {
        c.fillStyle = k % 2 ? tr.grass : tr.grass2;
        c.fillRect(0, y, LW, band); c.fillRect(RX, y, RW, band);
        c.fillStyle = '#8c7b5c'; c.fillRect(0, y + band - 4, LW, 4); c.fillRect(RX, y + band - 4, RW, 4);
        c.fillStyle = 'rgba(0,0,0,0.12)';
        for (let x = (k % 2) * 7; x < LW; x += 14) c.fillRect(x, y + band - 4, 1, 4);
        for (let x = RX + (k % 2) * 7; x < W; x += 14) c.fillRect(x, y + band - 4, 1, 4);
      }
    } else {
      const band = tr.sides === 'bosque' ? 56 : 80, off = scroll % band;
      c.fillStyle = tr.grass2;
      for (let y = -band + off; y < H; y += band) {
        c.fillRect(0, y, LW, band / 2);
        c.fillRect(RX, y + band / 2, RW, band / 2);
      }
    }
    // muros laterales del camino
    c.fillStyle = tr.joint;
    c.fillRect(ROAD_L - 8, 0, 8, H); c.fillRect(ROAD_R, 0, 8, H);
    c.fillStyle = 'rgba(0,0,0,0.15)';
    const blk = 20, ob = scroll % blk;
    for (let y = -blk + ob; y < H; y += blk) { c.fillRect(ROAD_L - 8, y, 8, 2); c.fillRect(ROAD_R, y, 8, 2); }
    // empedrado
    c.fillStyle = tr.road; c.fillRect(ROAD_L, 0, ROAD_R - ROAD_L, H);
    const row = 24, o2 = scroll % (row * 2);
    c.strokeStyle = tr.joint; c.lineWidth = 1.5; c.beginPath();
    let i = 0;
    for (let y = -row * 2 + o2; y < H + row; y += row, i++) {
      c.moveTo(ROAD_L, y); c.lineTo(ROAD_R, y);
      for (let x = ROAD_L + (i % 2 ? 0 : 18); x < ROAD_R; x += 36) { c.moveTo(x, y); c.lineTo(x, y + row); }
    }
    c.stroke();
  };

  D.decor = function (c, d, tr) {
    switch (d.type) {
      case 'ichu':
        c.strokeStyle = tr.tuft; c.lineWidth = 1.5; c.beginPath();
        for (let k = -2; k <= 2; k++) { c.moveTo(d.x, d.y); c.lineTo(d.x + k * 3, d.y - 9 + Math.abs(k)); }
        c.stroke(); break;
      case 'piedra':
        ell(c, d.x, d.y, d.s, d.s * 0.7, '#8b8378'); ell(c, d.x - 1, d.y - 1, d.s * 0.6, d.s * 0.4, '#a59d92'); break;
      case 'flor':
        ell(c, d.x, d.y, 2.5, 2.5, d.color); ell(c, d.x + 5, d.y + 3, 2, 2, '#fff'); break;
      case 'nieve':
        ell(c, d.x, d.y, d.s * 1.4, d.s * 0.6, '#ffffff'); break;
      case 'queuna': // árbol nativo andino (Polylepis): tronco rojizo, copa pequeña
        ell(c, d.x + 3, d.y + 4, 11, 4, 'rgba(0,0,0,0.2)');
        rr(c, d.x - 1.5, d.y - 6, 3, 10, 1, '#9a4a2a');
        ell(c, d.x - 4, d.y - 10, 7, 6, '#4f7a35'); ell(c, d.x + 4, d.y - 12, 7, 6, '#5b8a3c'); ell(c, d.x, d.y - 16, 6, 5, '#679a44');
        break;
      case 'arbol':
        ell(c, d.x + 4, d.y + 6, 16, 6, 'rgba(0,0,0,0.25)');
        ell(c, d.x, d.y - 4, 16, 14, '#1f5a2b'); ell(c, d.x - 5, d.y - 8, 9, 8, '#2d7a3a'); ell(c, d.x + 6, d.y - 2, 7, 6, '#28703a');
        break;
      case 'palmera':
        ell(c, d.x + 5, d.y + 6, 14, 5, 'rgba(0,0,0,0.25)');
        for (let k = 0; k < 6; k++) {
          const a = k * Math.PI / 3 + d.s;
          ell(c, d.x + Math.cos(a) * 9, d.y + Math.sin(a) * 9 - 6, 10, 3, k % 2 ? '#3f9a4c' : '#2f8040', a);
        }
        ell(c, d.x, d.y - 6, 3, 3, '#7a5a2a');
        break;
      case 'cactus': // cactus andino de valles secos
        ell(c, d.x + 3, d.y + 3, 7, 3, 'rgba(0,0,0,0.2)');
        rr(c, d.x - 3, d.y - 16, 6, 18, 3, '#4f7d3a');
        rr(c, d.x - 9, d.y - 10, 4, 8, 2, '#4f7d3a'); rr(c, d.x + 5, d.y - 13, 4, 9, 2, '#4f7d3a');
        line(c, d.x, d.y - 15, d.x, d.y, 'rgba(255,255,255,0.18)', 1);
        break;
      case 'volcan':
        c.fillStyle = '#6f5f58'; c.beginPath(); c.moveTo(d.x - 22, d.y + 4); c.lineTo(d.x - 5, d.y - 22); c.lineTo(d.x + 5, d.y - 22); c.lineTo(d.x + 22, d.y + 4); c.closePath(); c.fill();
        c.fillStyle = '#f2f2f2'; c.beginPath(); c.moveTo(d.x - 9, d.y - 15); c.lineTo(d.x - 5, d.y - 22); c.lineTo(d.x + 5, d.y - 22); c.lineTo(d.x + 9, d.y - 15); c.lineTo(d.x + 3, d.y - 17); c.lineTo(d.x - 2, d.y - 14); c.closePath(); c.fill();
        break;
      case 'helecho':
        for (let k = -2; k <= 2; k++) ell(c, d.x + k * 4, d.y - 4 - Math.abs(k), 2.5, 8, k % 2 ? tr.tuft : '#3c8f4c', k * 0.45);
        break;
    }
  };

  // ---------- Personajes ----------
  D.chasqui = function (c, x, y, t, ch, alpha = 1, running = true) {
    const s = running ? Math.sin(t * 16) : 0;
    c.save(); c.globalAlpha = alpha; c.translate(x, y);
    ell(c, 0, 18, 13, 5, 'rgba(0,0,0,0.25)');
    // piernas y ushutas (sandalias)
    rr(c, -7, 5 + s * 5, 5, 12, 2, '#8d5a3b'); rr(c, 2, 5 - s * 5, 5, 12, 2, '#8d5a3b');
    rr(c, -7, 15 + s * 5, 5, 3, 1, '#4a3020'); rr(c, 2, 15 - s * 5, 5, 3, 1, '#4a3020');
    // brazos
    rr(c, -14, -7 - s * 5, 4, 12, 2, '#8d5a3b'); rr(c, 10, -7 + s * 5, 4, 12, 2, '#8d5a3b');
    // unku (túnica)
    c.fillStyle = ch.tunic;
    c.beginPath(); c.moveTo(-10, -10); c.lineTo(10, -10); c.lineTo(12, 9); c.lineTo(-12, 9); c.closePath(); c.fill();
    // tocapu (banda de cuadros)
    for (let k = -3; k < 3; k++) { c.fillStyle = k % 2 ? ch.trim : '#1b1b1b'; c.fillRect(k * 4, -1, 4, 4); }
    // quipu colgando de la espalda
    const cols = ['#c0392b', '#f1c40f', '#27ae60', '#ecf0f1'];
    cols.forEach((col, k) => line(c, -6 + k * 2, -9, -7 + k * 2 + s, -1, col, 1.2));
    // cabeza, llauto y plumas
    ell(c, 0, -15, 7, 7, '#1a1a1a');
    c.fillStyle = ch.trim; c.fillRect(-7, -17, 14, 3);
    ell(c, -3, -24, 2, 5, '#ffffff', -0.35); ell(c, 3, -24, 2, 5, '#ffffff', 0.35);
    c.restore();
  };

  D.llama = function (c, e, t) {
    const s = Math.sin(t * 12 + e.seed);
    c.save(); c.translate(e.x, e.y); c.scale(e.dir, 1);
    ell(c, 0, 14, 18, 5, 'rgba(0,0,0,0.22)');
    [-11, -6, 6, 11].forEach((lx, k) => rr(c, lx - 1.5, 4 + (k % 2 ? s : -s) * 2, 3, 10, 1, '#d8ccb8'));
    ell(c, 0, 0, 16, 9, e.wool);
    // manta tejida
    rr(c, -8, -9, 14, 7, 2, '#c0392b'); c.fillStyle = '#f1c40f'; c.fillRect(-8, -7, 14, 2);
    rr(c, 10, -24, 6, 22, 3, e.wool);             // cuello
    ell(c, 17, -24, 7, 4.5, e.wool);              // cabeza
    ell(c, 21, -24, 2, 2, '#3b2a1a');             // hocico
    ell(c, 18, -26, 1.2, 1.2, '#111');            // ojo
    c.fillStyle = e.wool;
    c.beginPath(); c.moveTo(12, -27); c.lineTo(13, -35); c.lineTo(15, -27); c.fill();
    ell(c, 13, -35, 2, 2, '#e84393');             // borla en la oreja
    c.restore();
  };

  D.condor = function (c, e, t) {
    const f = Math.sin(t * 10) * 0.25;
    c.save(); c.translate(e.x, e.y);
    ell(c, 6, 10, 26, 6, 'rgba(0,0,0,0.18)');
    for (const side of [-1, 1]) {
      c.save(); c.scale(side, 1); c.rotate(f);
      c.fillStyle = '#151515';
      c.beginPath(); c.moveTo(4, -4); c.lineTo(34, -8); c.lineTo(38, 0); c.lineTo(30, 6); c.lineTo(4, 6); c.closePath(); c.fill();
      c.fillStyle = '#d9d9d9'; c.fillRect(12, 1, 18, 3);  // plumas blancas secundarias
      c.restore();
    }
    ell(c, 0, 0, 7, 14, '#151515');
    ell(c, 0, 9, 6, 3, '#f5f5f5');      // collar blanco
    ell(c, 0, 14, 4, 4, '#8e6a6a');     // cabeza (mira hacia abajo)
    c.fillStyle = '#d4c19c'; c.beginPath(); c.moveTo(-1.5, 17); c.lineTo(1.5, 17); c.lineTo(0, 21); c.fill();
    c.restore();
  };

  D.warn = function (c, e, t) {
    const a = 0.5 + 0.5 * Math.sin(t * 20);
    c.save(); c.globalAlpha = 0.4 + a * 0.6;
    c.fillStyle = '#e74c3c';
    c.beginPath(); c.moveTo(e.x, 66); c.lineTo(e.x - 13, 90); c.lineTo(e.x + 13, 90); c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.font = 'bold 15px sans-serif'; c.textAlign = 'center'; c.fillText('!', e.x, 87);
    c.globalAlpha = 0.25; c.strokeStyle = '#e74c3c'; c.setLineDash([6, 6]); c.lineWidth = 2;
    c.beginPath(); c.moveTo(e.x, 94); c.lineTo(e.x, H); c.stroke(); c.setLineDash([]);
    c.restore();
  };

  // ---------- Obstáculos y terreno ----------
  D.roca = function (c, e) {
    c.save(); c.translate(e.x, e.y);
    ell(c, 2, e.r * 0.7, e.r, e.r * 0.35, 'rgba(0,0,0,0.25)');
    c.fillStyle = '#7f8c8d'; c.beginPath();
    e.pts.forEach(([px, py], k) => (k ? c.lineTo(px, py) : c.moveTo(px, py)));
    c.closePath(); c.fill();
    c.strokeStyle = '#566573'; c.lineWidth = 2; c.stroke();
    ell(c, -e.r * 0.3, -e.r * 0.3, e.r * 0.35, e.r * 0.22, '#a6b1b2', -0.4);
    c.restore();
  };

  D.abismo = function (c, e) {
    c.fillStyle = '#1d140e'; c.fillRect(0, e.y, W, e.h);
    c.fillStyle = '#5a4632'; c.fillRect(0, e.y, W, 5);
    c.fillStyle = '#0d0907'; c.fillRect(0, e.y + e.h - 6, W, 6);
    const x0 = e.bx - e.bw / 2;
    rr(c, x0 + 6, e.y - 2, e.bw - 4, e.h + 10, 3, 'rgba(0,0,0,0.25)');   // sombra del puente
    for (let yy = e.y - 6; yy < e.y + e.h + 4; yy += 5) rr(c, x0 + 4, yy, e.bw - 8, 3.5, 1, '#c9a35a');
    line(c, x0 + 3, e.y - 10, x0 + 3, e.y + e.h + 8, '#8a6a32', 2.5);
    line(c, x0 + e.bw - 3, e.y - 10, x0 + e.bw - 3, e.y + e.h + 8, '#8a6a32', 2.5);
    [[x0 + 3, e.y - 10], [x0 + e.bw - 3, e.y - 10], [x0 + 3, e.y + e.h + 8], [x0 + e.bw - 3, e.y + e.h + 8]]
      .forEach(([px, py]) => ell(c, px, py, 3, 3, '#5b3a1e'));
  };

  D.tambo = function (c, e, t, nextChar) {
    // chaskiwasi: posta de piedra con techo de paja
    const y = e.y;
    rr(c, 6, y - 34, 52, 34, 2, '#8d8478');
    c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 1;
    for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(6, y - 34 + k * 8.5); c.lineTo(58, y - 34 + k * 8.5); c.stroke(); }
    c.fillStyle = '#3b2a1a'; c.beginPath(); c.moveTo(26, y); c.lineTo(28, y - 18); c.lineTo(38, y - 18); c.lineTo(40, y); c.fill();
    c.fillStyle = '#d4a72c'; c.beginPath(); c.moveTo(0, y - 32); c.lineTo(32, y - 56); c.lineTo(64, y - 32); c.closePath(); c.fill();
    // cinta tejida a lo ancho del camino (meta del relevo)
    line(c, ROAD_L - 4, y - 40, ROAD_L - 4, y + 6, '#5b3a1e', 4);
    line(c, ROAD_R + 4, y - 40, ROAD_R + 4, y + 6, '#5b3a1e', 4);
    const cols = ['#c0392b', '#f1c40f', '#27ae60', '#2e86c1', '#8e44ad'];
    for (let x = ROAD_L, k = 0; x < ROAD_R; x += 12, k++) {
      c.fillStyle = cols[k % cols.length];
      c.fillRect(x, y - 38 + Math.sin(t * 6 + k) * 2, 12, 8);
    }
    // el siguiente chasqui espera el relevo
    if (nextChar) D.chasqui(c, W - 30, y - 8, t, nextChar, 1, false);
  };

  // ---------- Coleccionables ----------
  D.quipu = function (c, x, y, t, s = 1) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if (t !== null) {
      groundShadow(c, 1, 14, 11);
      const pulse = Math.sin(t * 6);
      halo(c, 20 + pulse * 2, '255,196,0', 0.55);
      c.strokeStyle = `rgba(255,214,0,${0.7 + pulse * 0.3})`; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 1, 15 + pulse, 0, TAU); c.stroke();
    }
    line(c, -12, -8, 12, -8, '#2b1a0a', 5); line(c, -11, -8, 11, -8, '#8b4a14', 3);
    const cols = ['#ff1f3d', '#ffd000', '#00d65a', '#1e7bff', '#ffffff'];
    cols.forEach((col, k) => {
      const x0 = -9 + k * 4.5, x1 = x0 + (k % 2 ? 1 : -1);
      line(c, x0, -8, x1, 10, '#2b1a0a', 3.6);
      line(c, x0, -8, x1, 10, col, 2.2);
      ell(c, x0, -2 + (k % 2) * 5, 2.1, 2.1, '#2b1a0a');
    });
    c.restore();
  };

  D.power = function (c, x, y, type, t, s = 1) {
    const pc = CH.POWERS[type];
    const p = s * (1 + 0.08 * Math.sin(t * 6));
    c.save(); c.translate(x, y);
    if (s === 1) groundShadow(c, 1, 17, 13);
    c.scale(p, p);
    if (s === 1) halo(c, 24, pc.glow, 0.6);
    ell(c, 0, 0, 15, 15, 'rgba(20,12,4,0.75)');
    c.strokeStyle = pc.color; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.stroke();
    switch (type) {
      case 'inti':
        for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + t; line(c, Math.cos(a) * 7, Math.sin(a) * 7, Math.cos(a) * 11, Math.sin(a) * 11, '#ffc400', 2); }
        ell(c, 0, 0, 6, 6, '#ffc400'); break;
      case 'killa':
        c.fillStyle = '#dfe6ff'; c.beginPath();
        c.arc(0, 0, 9, -Math.PI / 2, Math.PI / 2); c.ellipse(0, 0, 4, 9, 0, Math.PI / 2, -Math.PI / 2, true); c.fill(); break;
      case 'pututu':
        ell(c, 0, 0, 9, 6, '#f2d7b6', -0.3);
        c.strokeStyle = '#a0785a'; c.lineWidth = 1.3; c.beginPath();
        for (let a = 0; a < 10; a += 0.3) c.lineTo(-2 + Math.cos(a) * a * 0.55, Math.sin(a) * a * 0.4);
        c.stroke();
        c.fillStyle = '#f2d7b6'; c.beginPath(); c.moveTo(7, -3); c.lineTo(13, -6); c.lineTo(9, 2); c.fill(); break;
      case 'maiz':
        ell(c, -5, 3, 3, 8, '#27ae60', -0.6); ell(c, 5, 3, 3, 8, '#27ae60', 0.6);
        ell(c, 0, -1, 5, 9, '#f4d03f');
        c.fillStyle = '#d4ac0d';
        for (let k = -6; k <= 5; k += 3) { c.fillRect(-3, k, 2, 2); c.fillRect(1, k + 1, 2, 2); }
        break;
    }
    c.restore();
  };

  // ---------- Efectos ----------
  D.shield = function (c, x, y, r, t, remaining) {
    if (remaining < 1.2 && Math.floor(t * 10) % 2) return; // parpadea al terminarse
    c.save();
    c.strokeStyle = 'rgba(245,183,0,0.85)'; c.lineWidth = 3;
    c.beginPath(); c.arc(x, y - 2, r + 12 + Math.sin(t * 8) * 2, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(245,183,0,0.15)'; c.fill();
    c.restore();
  };

  D.particles = function (c, parts) {
    for (const p of parts) {
      const a = Math.max(0, p.life / p.max);
      c.globalAlpha = a;
      if (p.kind === 'text') {
        c.font = 'bold 15px sans-serif'; c.textAlign = 'center';
        c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 3;
        c.strokeText(p.text, p.x, p.y); c.fillStyle = p.color; c.fillText(p.text, p.x, p.y);
      } else if (p.kind === 'wave') {
        c.strokeStyle = p.color; c.lineWidth = 6 * a;
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.stroke();
      } else {
        ell(c, p.x, p.y, p.size, p.size, p.color);
      }
    }
    c.globalAlpha = 1;
  };

  // ---------- HUD ----------
  D.hud = function (c, S, t) {
    c.fillStyle = 'rgba(0,0,0,0.38)'; c.fillRect(0, 0, W, 56);
    livesBadge(c, S);
    D.quipu(c, 18, 41, null, 0.65);
    c.fillStyle = '#fff'; c.font = 'bold 14px sans-serif'; c.textAlign = 'left';
    c.fillText('× ' + S.quipus, 30, 46);

    c.textAlign = 'center';
    c.font = 'bold 20px sans-serif'; c.fillText(Math.floor(S.meters) + ' m', W / 2, 24);
    c.font = '12px sans-serif'; c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillText('Tramo ' + (S.tramo + 1) + ' · ' + CH.TRAMOS[S.tramo % CH.TRAMOS.length].name, W / 2, 43);

    c.textAlign = 'right'; c.fillStyle = '#f5d76e'; c.font = 'bold 15px sans-serif';
    c.fillText(S.score, W - 56, 33);

    // poderes activos
    let y = 76;
    for (const key of ['inti', 'killa']) {
      const rem = S.powers[key];
      if (rem <= 0) continue;
      D.power(c, 20, y, key, t, 0.7);
      rr(c, 36, y - 3, 60, 6, 3, 'rgba(0,0,0,0.4)');
      rr(c, 36, y - 3, 60 * (rem / S.powerMax[key]), 6, 3, CH.POWERS[key].color);
      y += 28;
    }
  };

  D.banner = function (c, b) {
    const a = Math.min(1, b.t / 0.4);
    c.save(); c.globalAlpha = a;
    c.font = 'italic 13px sans-serif';
    const lines = b.fact ? wrap(c, b.fact, W - 80) : [];
    const h = 64 + lines.length * 17 + (b.fact ? 10 : 0);
    rr(c, 20, 150, W - 40, h, 12, 'rgba(20,14,8,0.72)');
    c.strokeStyle = '#d4a72c'; c.lineWidth = 2; c.stroke();
    c.textAlign = 'center';
    c.fillStyle = '#f5d76e'; c.font = 'bold 22px sans-serif'; c.fillText(b.title, W / 2, 182);
    c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.fillText(b.sub, W / 2, 204);
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = 'italic 13px sans-serif';
    lines.forEach((ln, k) => c.fillText(ln, W / 2, 230 + k * 17));
    c.restore();
  };

  D.tint = function (c, color) { c.fillStyle = color; c.fillRect(0, 0, W, H); };

  // =====================================================================
  //  Spec 004 — aldeas, personajes, fauna por región, ríos y HUD de misión
  // =====================================================================

  // Figura de frente (receptor, aldeanos). kind: curaca | hampikamayuq | aldeano
  D.npc = function (c, x, y, t, kind, label, color) {
    const wave = Math.sin(t * 6) * 0.5;
    c.save(); c.translate(x, y);
    ell(c, 0, 17, 12, 4, 'rgba(0,0,0,0.25)');
    rr(c, -6, 6, 5, 11, 2, '#8d5a3b'); rr(c, 1, 6, 5, 11, 2, '#8d5a3b');
    const tunic = kind === 'inca' ? '#7b241c' : kind === 'curaca' ? '#6c3483' : kind === 'hampikamayuq' ? '#6b7d3a' : (color || '#a0522d');
    c.fillStyle = tunic;
    c.beginPath(); c.moveTo(-11, -10); c.lineTo(11, -10); c.lineTo(13, 9); c.lineTo(-13, 9); c.closePath(); c.fill();
    if (kind === 'inca') { // túnica cubierta de tocapus
      for (let r = 0; r < 3; r++) for (let k = -3; k < 3; k++) {
        c.fillStyle = (k + r) % 2 ? '#f1c40f' : '#c0392b'; c.fillRect(k * 4, -8 + r * 5, 4, 4);
      }
    }
    if (kind === 'curaca') {
      for (let k = -3; k < 3; k++) { c.fillStyle = k % 2 ? '#f1c40f' : '#c0392b'; c.fillRect(k * 4, 0, 4, 4); }
    }
    if (kind === 'hampikamayuq') {
      line(c, -16, -16, -16, 18, '#6e4b2a', 2.5);                      // bastón
      rr(c, 7, 0, 9, 9, 2, '#c0392b'); c.fillStyle = '#f1c40f'; c.fillRect(7, 3, 9, 2); // chuspa
    }
    rr(c, -15, -8, 4, 12, 2, '#8d5a3b');
    if (label) { // brazo saludando
      c.save(); c.translate(12, -8); c.rotate(-2.5 + wave); rr(c, -2, 0, 4, 13, 2, '#8d5a3b'); c.restore();
    } else rr(c, 11, -8, 4, 12, 2, '#8d5a3b');
    ell(c, 0, -16, 7, 7, '#a86b45');
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(0, -17, 7.2, Math.PI, 0); c.fill();
    ell(c, -2.5, -15, 1, 1.2, '#111'); ell(c, 2.5, -15, 1, 1.2, '#111');
    if (kind === 'inca') {
      ell(c, -7, -15, 3, 3, '#f5c542'); ell(c, 7, -15, 3, 3, '#f5c542');
      c.fillStyle = '#c0392b'; c.fillRect(-6, -14, 12, 4);               // mascaipacha (borla roja)
      c.fillStyle = '#e8c547'; c.fillRect(-8, -22, 16, 3);
      ell(c, 0, -30, 2.2, 6, '#ffffff'); ell(c, -4, -28, 1.8, 5, '#111', -0.4); ell(c, 4, -28, 1.8, 5, '#111', 0.4);
    } else if (kind === 'curaca') {
      ell(c, -7, -15, 2.6, 2.6, '#f5c542'); ell(c, 7, -15, 2.6, 2.6, '#f5c542'); // orejeras de oro
      ['#c0392b', '#f1c40f', '#27ae60'].forEach((col, k) => ell(c, -4 + k * 4, -27, 1.8, 5, col, (k - 1) * 0.3));
    } else if (kind === 'hampikamayuq') {
      c.fillStyle = '#e8d9c0'; c.fillRect(-7, -21, 14, 3);
      ell(c, 4, -26, 3, 2, '#4caf50', 0.5);
    }
    if (label) {
      c.font = 'bold 11px sans-serif'; c.textAlign = 'center';
      const w = c.measureText(label).width + 14;
      rr(c, -w / 2, -50, w, 18, 9, 'rgba(255,248,230,0.95)');
      c.fillStyle = '#3b2a1a'; c.fillText(label, 0, -37);
    }
    c.restore();
  };

  function house(c, x, y, w, h, roof) {
    ell(c, x + 4, y + h + 3, w / 2 + 2, 5, 'rgba(0,0,0,0.22)');
    if (roof === 'redondo') {
      rr(c, x - w / 2 + 4, y + h * 0.35, w - 8, h * 0.65, 3, '#7a5a3a');
      c.fillStyle = '#2b1d10'; c.fillRect(x - 4, y + h - 12, 8, 12);
      ell(c, x, y + h * 0.35, w / 2 + 3, h * 0.42, '#c99a3d');
      c.strokeStyle = 'rgba(120,80,20,0.6)'; c.lineWidth = 1; c.beginPath();
      for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; c.moveTo(x, y + h * 0.35); c.lineTo(x + Math.cos(a) * w / 2, y + h * 0.35 + Math.sin(a) * h * 0.4); }
      c.stroke(); ell(c, x, y + h * 0.35, 3, 3, '#8a6420');
    } else {
      rr(c, x - w / 2, y + h * 0.3, w, h * 0.7, 2, '#9c9284');
      c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 1;
      for (let k = 1; k < 3; k++) { c.beginPath(); c.moveTo(x - w / 2, y + h * 0.3 + k * h * 0.23); c.lineTo(x + w / 2, y + h * 0.3 + k * h * 0.23); c.stroke(); }
      c.fillStyle = '#2b1d10'; c.beginPath(); c.moveTo(x - 5, y + h); c.lineTo(x - 4, y + h - 13); c.lineTo(x + 4, y + h - 13); c.lineTo(x + 5, y + h); c.fill();
      c.fillStyle = '#cfa045'; c.beginPath(); c.moveTo(x - w / 2 - 4, y + h * 0.42); c.lineTo(x, y - 6); c.lineTo(x + w / 2 + 4, y + h * 0.42); c.closePath(); c.fill();
      c.strokeStyle = '#b0832c'; c.beginPath();
      for (let k = -2; k <= 2; k++) { c.moveTo(x + k * w / 6, y + h * 0.4); c.lineTo(x + k * 2, y); }
      c.stroke();
    }
  }

  // Aldea: casas a ambos lados del camino; en el destino, cinta tejida y receptor.
  D.aldea = function (c, e, b, t) {
    for (const hs of e.houses) {
      const x = hs.side < 0 ? (ROAD_L - 8) / 2 : ROAD_R + 8 + (W - ROAD_R - 8) / 2;
      house(c, x, e.y + hs.dy, hs.w, hs.h, b.roof);
    }
    for (const p of e.people) {
      D.npc(c, p.side < 0 ? ROAD_L + 14 : ROAD_R - 14, e.y + p.dy, t, 'aldeano', null, p.color);
    }
    if (e.type === 'destino') {
      const y = e.y - 46;
      line(c, ROAD_L - 4, y - 8, ROAD_L - 4, y + 30, '#5b3a1e', 4);
      line(c, ROAD_R + 4, y - 8, ROAD_R + 4, y + 30, '#5b3a1e', 4);
      const cols = ['#c0392b', '#f1c40f', '#27ae60', '#2e86c1', '#8e44ad'];
      for (let x = ROAD_L, k = 0; x < ROAD_R; x += 12, k++) {
        c.fillStyle = cols[k % cols.length]; c.fillRect(x, y - 6 + Math.sin(t * 6 + k) * 2, 12, 8);
      }
      if (!e.reached) D.npc(c, W / 2, e.y - 8, t, e.receiver.kind, e.receiver.name);
    }
    if (e.type === 'origen' && e.giver) D.npc(c, ROAD_L + 18, e.y - 30, t, 'curaca', null);
  };

  // Derrumbe: sombra que crece en el camino y piedritas cayendo; luego se convierte en roca.
  D.derrumbe = function (c, e, t) {
    const p = 1 - Math.max(0, e.timer) / e.max;
    ell(c, e.x, e.y, e.r * (0.4 + p * 0.8), e.r * (0.25 + p * 0.45), `rgba(30,20,10,${0.25 + p * 0.35})`);
    c.strokeStyle = `rgba(231,76,60,${0.5 + 0.5 * Math.sin(t * 20)})`; c.lineWidth = 2;
    c.beginPath(); c.ellipse(e.x, e.y, e.r * 1.25, e.r * 0.8, 0, 0, TAU); c.stroke();
    const fallY = e.y - 140 * (1 - p);
    ell(c, e.x - 4, fallY - 10, 3, 3, '#8d8478'); ell(c, e.x + 5, fallY - 22, 2.5, 2.5, '#9a9188');
    ell(c, e.x, fallY, e.r * 0.6 * (0.5 + p * 0.5), e.r * 0.5 * (0.5 + p * 0.5), '#7f8c8d');
  };

  // Nieve que cae (sin estado: posición derivada del tiempo).
  D.snow = function (c, t) {
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 70; i++) {
      const sp = 40 + (i % 5) * 18;
      const x = (i * 53.7 + Math.sin(t * 0.8 + i) * 14 + W * 2) % W;
      const y = (i * 97.3 + t * sp) % H;
      c.fillRect(x, y, 1.6 + (i % 3) * 0.6, 1.6 + (i % 3) * 0.6);
    }
  };

  D.planta = function (c, x, y, t, s = 1) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if (t !== null) {
      groundShadow(c, 1, 11, 10);
      const pulse = Math.sin(t * 6);
      halo(c, 19 + pulse * 2, '40,255,110', 0.55);
      c.strokeStyle = `rgba(57,255,122,${0.7 + pulse * 0.3})`; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, 14 + pulse, 0, TAU); c.stroke();
    }
    line(c, 0, 8, 0, -4, '#0d4a1a', 2.5);
    for (const [lx, ly, rot, col] of [[-5, -2, -0.6, '#14c43c'], [5, -2, 0.6, '#0fae35'], [0, -6, 0, '#3dff6e']]) {
      ell(c, lx, ly, 4, 9, '#0d3d17', rot); ell(c, lx, ly, 3, 8, col, rot);
    }
    rr(c, -4, 4, 8, 3, 1, '#e3122b');
    ell(c, 7, -9, 2.2, 3.2, '#c4001a');
    c.restore();
  };

  D.rio = function (c, e, t) {
    c.fillStyle = '#5a4128'; c.fillRect(0, e.y - 7, W, 7); c.fillRect(0, e.y + e.h, W, 7);
    const g = c.createLinearGradient(0, e.y, 0, e.y + e.h);
    g.addColorStop(0, '#0a5fb0'); g.addColorStop(0.5, '#1e9be8'); g.addColorStop(1, '#0a5fb0');
    c.fillStyle = g; c.fillRect(0, e.y, W, e.h);
    // espuma: líneas blancas delgadas que corren horizontalmente a distintas velocidades
    c.lineCap = 'round';
    for (let row = 0; row < 7; row++) {
      const yy = e.y + 6 + row * ((e.h - 12) / 6);
      const speed = 40 + (row % 3) * 25, dir = row % 2 ? 1 : -1;
      const len = 10 + (row * 7) % 14, gap = 46 + (row * 13) % 30;
      const off = ((t * speed * dir) % gap + gap) % gap;
      c.strokeStyle = `rgba(255,255,255,${0.45 + (row % 3) * 0.15})`; c.lineWidth = row % 2 ? 1 : 1.5;
      c.beginPath();
      for (let x = off - gap; x < W + gap; x += gap) { c.moveTo(x, yy + Math.sin(t * 3 + x * 0.05) * 1.5); c.lineTo(x + len, yy + Math.sin(t * 3 + (x + len) * 0.05) * 1.5); }
      c.stroke();
    }
    c.lineCap = 'butt';
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(0, e.y, W, 2); c.fillRect(0, e.y + e.h - 2, W, 2); // espuma en las orillas
    for (let yy = e.y + 8, k = 0; yy < e.y + e.h - 2; yy += 15, k++) {
      const off = k % 2 ? 9 : -9;
      ell(c, e.bx + off + 2, yy + 3, 13, 7, 'rgba(0,0,0,0.3)');
      ell(c, e.bx + off, yy, 13, 7, '#a9a69b'); ell(c, e.bx + off - 3, yy - 2, 6, 3, '#d2cfc4');
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1; c.beginPath(); c.ellipse(e.bx + off, yy + 1, 15, 8.5, 0, 0.2, Math.PI - 0.2); c.stroke();
    }
  };

  D.caiman = function (c, e, t) {
    const d = e.vx >= 0 ? 1 : -1;
    c.save(); c.translate(e.x, e.y); c.scale(d, 1);
    c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, 36, 11, 0, 0, TAU); c.stroke();
    c.fillStyle = '#3e4b20'; c.beginPath(); c.moveTo(-12, -4); c.lineTo(-36, Math.sin(t * 6) * 3); c.lineTo(-12, 4); c.closePath(); c.fill();
    [[6, -8], [6, 8], [-8, -8], [-8, 8]].forEach(([lx, ly]) => ell(c, lx, ly, 3, 2.5, '#3e4b20'));
    ell(c, 0, 0, 15, 7, '#4a5a28');
    c.fillStyle = '#53632d'; c.beginPath(); c.moveTo(12, -5); c.lineTo(31, -3); c.lineTo(33, 0); c.lineTo(31, 3); c.lineTo(12, 5); c.closePath(); c.fill();
    for (let k = -10; k <= 8; k += 6) ell(c, k, 0, 1.6, 1.6, '#2f3a17');
    ell(c, 15, -4, 2.2, 2.2, '#d6c44a'); ell(c, 15, 4, 2.2, 2.2, '#d6c44a');
    c.restore();
  };

  D.felino = function (c, e, t) {
    const jag = e.kind === 'jaguar';
    const col = jag ? '#ffa81e' : '#d4a05c';   // más saturados (spec 005-R3)
    const dir = e.state === 'jump' ? Math.sign(e.vx) || 1 : -e.side;
    const jump = e.state === 'jump';
    c.save(); c.translate(e.x, e.y); c.scale(dir, 1);
    ell(c, 0, 12, 18, 4, 'rgba(0,0,0,0.22)');
    if (jump) { rr(c, 8, 2, 12, 3, 1.5, col); rr(c, -22, 2, 12, 3, 1.5, col); }
    else { [-10, -5, 6, 11].forEach((lx) => rr(c, lx - 1.5, 3, 3, 8, 1, col)); }
    c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(-14, -1); c.quadraticCurveTo(-26, -4, -28, -14 + Math.sin(t * 5) * 2); c.stroke();
    ell(c, 0, jump ? -1 : 2, 17.5, jump ? 8.5 : 9.5, '#2b1a0a');   // contorno oscuro
    ell(c, 0, jump ? -1 : 2, 16, jump ? 7 : 8, col);
    ell(c, 0, jump ? 2 : 5, 11, 3, jag ? '#f3d58a' : '#e2c79a');
    if (jag) {
      c.strokeStyle = '#3b2a12'; c.lineWidth = 1.2;
      [[-8, -2], [-2, 2], [4, -3], [9, 1], [-12, 3]].forEach(([sx, sy]) => { c.beginPath(); c.arc(sx, sy, 2, 0, TAU); c.stroke(); });
    }
    ell(c, 16, -5, 9, 8.5, '#2b1a0a');
    ell(c, 16, -5, 7.5, 7, col);
    c.fillStyle = col; c.beginPath(); c.moveTo(12, -10); c.lineTo(13, -15); c.lineTo(16, -11); c.fill();
    c.beginPath(); c.moveTo(17, -11); c.lineTo(20, -15); c.lineTo(20, -9); c.fill();
    ell(c, 21, -3, 3.5, 2.8, jag ? '#f3d58a' : '#e8d4b0');
    ell(c, 23.5, -4, 1.2, 1, '#2b1d10');
    if (e.state === 'warn') {
      const g = 0.5 + 0.5 * Math.sin(t * 25);
      ell(c, 18, -7, 5, 5, `rgba(255,240,80,${0.3 + g * 0.4})`);
      ell(c, 18, -7, 2.2, 2.2, '#fff35c');
    } else ell(c, 18, -7, 1.4, 1.4, '#1a1a1a');
    c.restore();
    if (e.state === 'warn') {
      c.fillStyle = '#e74c3c'; c.beginPath(); c.moveTo(e.x, e.y - 36); c.lineTo(e.x - 9, e.y - 20); c.lineTo(e.x + 9, e.y - 20); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.fillText('!', e.x, e.y - 23);
    }
  };

  D.zorro = function (c, e, t) {
    const s = Math.sin(t * 16 + e.ph);
    c.save(); c.translate(e.x, e.y);
    ell(c, 0, 14, 10, 4, 'rgba(0,0,0,0.2)');
    ell(c, Math.sin(t * 8) * 2, -17, 5, 10, '#8b8680'); ell(c, Math.sin(t * 8) * 3, -26, 3.5, 3.5, '#2b2b2b');
    rr(c, -7, -4 + s * 3, 3, 8, 1, '#b0653a'); rr(c, 4, -4 - s * 3, 3, 8, 1, '#b0653a');
    rr(c, -7, 4 - s * 3, 3, 8, 1, '#b0653a'); rr(c, 4, 4 + s * 3, 3, 8, 1, '#b0653a');
    ell(c, 0, 0, 7, 11, '#8f8b84');
    ell(c, 0, 12, 6, 6, '#c27a45');
    c.fillStyle = '#c27a45';
    c.beginPath(); c.moveTo(-5, 9); c.lineTo(-8, 4); c.lineTo(-2, 7); c.fill();
    c.beginPath(); c.moveTo(5, 9); c.lineTo(8, 4); c.lineTo(2, 7); c.fill();
    ell(c, 0, 17, 3, 3, '#ece0c8'); ell(c, 0, 19.5, 1.3, 1.1, '#111');
    ell(c, -2.5, 11, 1, 1, '#111'); ell(c, 2.5, 11, 1, 1, '#111');
    c.restore();
  };

  // Segmentos de la serpiente: misma fórmula para dibujar y para colisionar.
  D.snakePoint = (e, k, t) => [e.x - e.dir * k * 8, e.y + Math.sin(t * 8 + e.ph + k * 0.9) * 4];
  D.serpiente = function (c, e, t) {
    const coral = e.color === 'coral';
    for (let k = 6; k >= 0; k--) { const [x, y] = D.snakePoint(e, k, t); ell(c, x + 1.5, y + 4, 6 - k * 0.3, 2.5, 'rgba(0,0,0,0.22)'); }
    for (let k = 6; k >= 0; k--) {
      const [x, y] = D.snakePoint(e, k, t);
      const col = coral ? ['#ff2b2b', '#111111', '#ffd400'][k % 3] : (k % 2 ? '#3fe04a' : '#22b33a');
      const rx = k === 0 ? 7 : 6 - k * 0.4, ry = k === 0 ? 5.5 : 5 - k * 0.3;
      ell(c, x, y, rx + 1.4, ry + 1.4, '#14100a');   // contorno oscuro
      ell(c, x, y, rx, ry, col);
    }
    const [hx, hy] = D.snakePoint(e, 0, t);
    ell(c, hx + e.dir * 2, hy - 2, 1.2, 1.2, '#fff');
    if (Math.sin(t * 10) > 0) line(c, hx + e.dir * 6, hy, hx + e.dir * 11, hy, '#e74c3c', 1.2);
  };

  // HUD de campaña: misión + barra de progreso origen → destino
  D.hudCampaign = function (c, S, t) {
    c.fillStyle = 'rgba(0,0,0,0.42)'; c.fillRect(0, 0, W, 74);
    livesBadge(c, S);
    D.quipu(c, 18, 41, null, 0.65);
    c.fillStyle = '#fff'; c.font = 'bold 14px sans-serif'; c.textAlign = 'left';
    c.fillText('× ' + S.quipus, 30, 46);

    c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = '11px sans-serif';
    c.fillText('NIVEL ' + S.level.id, W / 2, 16);
    c.fillStyle = '#fff'; c.font = 'bold 14px sans-serif';
    const title = S.level.title.length > 22 ? S.level.title.slice(0, 21) + '…' : S.level.title;
    c.fillText(title, W / 2, 33);

    const g = S.goal;
    c.textAlign = 'right'; c.font = 'bold 15px sans-serif';
    if (g.type === 'collect') {
      D.planta(c, W - 96, 40, null, 0.75);
      c.fillStyle = g.have >= g.need ? '#7dff9a' : '#fff';
      c.fillText(g.have + '/' + g.need, W - 56, 46);
    } else if (g.type === 'time') {
      const s = Math.max(0, Math.ceil(g.timeLeft));
      c.fillStyle = s <= 10 ? '#ff7b6b' : '#fff';
      c.fillText('⏱ ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'), W - 56, 46);
    }
    // progreso
    const p = Math.max(0, Math.min(1, S.meters / S.lengthM));
    const x0 = 22, x1 = W - 22, y = 62;
    rr(c, x0, y - 2, x1 - x0, 4, 2, 'rgba(255,255,255,0.25)');
    rr(c, x0, y - 2, (x1 - x0) * p, 4, 2, '#f5d76e');
    rr(c, x0 - 5, y - 5, 10, 10, 2, '#cfa045'); rr(c, x1 - 5, y - 5, 10, 10, 2, '#cfa045');
    ell(c, x0 + (x1 - x0) * p, y, 5, 5, S.char.tunic); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke();

    let py = 94;
    for (const key of ['inti', 'killa']) {
      const rem = S.powers[key];
      if (rem <= 0) continue;
      D.power(c, 20, py, key, t, 0.7);
      rr(c, 36, py - 3, 60, 6, 3, 'rgba(0,0,0,0.4)');
      rr(c, 36, py - 3, 60 * (rem / S.powerMax[key]), 6, 3, CH.POWERS[key].color);
      py += 28;
    }
  };

  CH.Draw = D;
})(window.CH);
