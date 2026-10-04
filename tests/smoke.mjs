/**
 * Smoke test headless de mecánicas clave.
 * Requisitos: npm i -D playwright  (y navegadores: npx playwright install chromium)
 * Opcional: CHROMIUM_PATH=/ruta/a/chromium para usar un binario existente.
 * Uso: node tests/smoke.mjs   (desde la carpeta chasqui)
 */
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = pathToFileURL(path.join(root, 'www', 'index.html')).href;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto(url);

// ---------- Spec 005: nombre, música, área segura, vidas ----------
check('005-R1 título comercial', (await page.title()) === 'Chasqui: El Mensajero Inca');
check('Autoría: meta author y créditos v1.0.0 en el menú',
  (await page.getAttribute('meta[name="author"]', 'content')) === 'Byron Sebastián Rosero Díaz'
  && (await page.textContent('#m-credits')) === 'v1.0.0 | Desarrollado por Byron Sebastián Rosero Díaz'
  && await page.isVisible('#m-credits'));
check('005-R2 sin música antes de interactuar (autoplay)', (await page.evaluate(() => CH.Sfx.isPlaying())) === false);

// ---------- Campaña (spec 004) ----------
await page.click('#btn-campaign'); await wait(150);
check('005-R2 la música arranca tras el primer toque', await page.evaluate(() => CH.Sfx.isPlaying()));
const mute = await page.evaluate(() => { const a = CH.Sfx.toggleMute(); const p1 = CH.Sfx.isPlaying(); const b = CH.Sfx.toggleMute(); return { a, p1, b, p2: CH.Sfx.isPlaying() }; });
check('005-R2 silenciar detiene la música y reactivar la reanuda', mute.a === true && !mute.p1 && mute.b === false && mute.p2, JSON.stringify(mute));
// Pantalla exactamente 9:16 (el juego ocupa todo, sin franjas): sin notch empieza en 0; con notch de 48 px, debajo.
await page.setViewportSize({ width: 360, height: 640 }); await wait(100);
const safe = await page.evaluate(async () => {
  const st = document.getElementById('stage'), fr = document.getElementById('frame');
  const before = fr.getBoundingClientRect().top;
  st.style.paddingTop = '48px'; window.dispatchEvent(new Event('resize')); await new Promise((r) => setTimeout(r, 50));
  const after = fr.getBoundingClientRect().top;
  st.style.paddingTop = ''; window.dispatchEvent(new Event('resize'));
  return { before, after }; });
await page.setViewportSize({ width: 393, height: 852 }); await wait(100);
check('005-R4 con notch de 48 px el área de juego (y su HUD) queda debajo', safe.before < 1 && safe.after >= 48, JSON.stringify(safe));
const locked = await page.evaluate(() => [...document.querySelectorAll('.level-card')].map((c) => c.classList.contains('locked')));
check('004-R4 solo el nivel 1 desbloqueado al inicio (5 niveles)', locked.length === 5 && locked[0] === false && locked.slice(1).every(Boolean), JSON.stringify(locked));
await page.click('.level-card'); await wait(150);
check('004-R1 pantalla de misión', await page.isVisible('#screen-mission'));
await page.click('#btn-mission-go'); await wait(300);
const finish = async () => page.evaluate(async () => { const S = CH._debug.S; S.lives = 99; S.ents = S.ents.filter((e) => e.kind === 'aldea');
  S.meters = S.lengthM - 40; await new Promise((r) => setTimeout(r, 3600)); return CH._debug.mode; });
const steps = await page.evaluate(async () => { const S = CH._debug.S; S.lives = 99;
  const v0 = CH._debug.cur().speed, i0 = CH._debug.cur().interval; S.meters = 210;
  await new Promise((r) => setTimeout(r, 80)); const c = CH._debug.cur();
  return { faster: c.speed > v0, denser: c.interval < i0, step: c.step }; });
check('004-R6 dificultad sube en escalones de 200 m', steps.faster && steps.denser && steps.step === 1, JSON.stringify(steps));
check('004-R2 nivel 1 (entregar) se completa', (await finish()) === 'win');
check('004-R7 pantalla de nivel completado con mensaje del Inca', (await page.textContent('#w-inca')).length > 10);
check('004-R4 progreso guardado', JSON.parse(await page.evaluate(() => localStorage.getItem('chasqui.levels.v2'))).includes(1));
await page.click('#btn-next'); await page.click('#btn-mission-go'); await wait(300);
const plantsLost = await page.evaluate(async () => { const S = CH._debug.S, p = CH._debug.player; S.invuln = 0; S.goal.have = 5;
  S.ents.push({ kind: 'roca', x: p.x, y: 520, r: 15, pts: [[0, -10], [10, 0], [0, 10], [-10, 0]] });
  await new Promise((r) => setTimeout(r, 120)); return S.goal.have; });
check('004-R2 golpe hace perder 2 plantas', plantsLost === 3, String(plantsLost));
await page.evaluate(() => { CH._debug.S.goal.have = 2; });
check('004-R2 llegar sin plantas suficientes = misión fallida', (await finish()) === 'over');
check('004-R8 nivel máximo alcanzado persistido al perder', (await page.evaluate(() => localStorage.getItem('chasqui.maxLevel'))) === '2'
  && (await page.textContent('#o-max')) === 'Nivel 2');
await page.click('#btn-retry'); await wait(200);
await page.evaluate(() => { CH._debug.S.goal.have = CH._debug.S.goal.need; });
check('004-R2 nivel 2 con todas las plantas se completa', (await finish()) === 'win');
await page.click('#btn-next'); await page.click('#btn-mission-go'); await wait(300);
const timeout = await page.evaluate(async () => { CH._debug.S.goal.timeLeft = 0.05; await new Promise((r) => setTimeout(r, 200)); return CH._debug.mode; });
check('004-R2 contrarreloj: tiempo agotado = misión fallida', timeout === 'over');
await page.click('#btn-retry'); await wait(200);
const water = await page.evaluate(async () => { const S = CH._debug.S, p = CH._debug.player; S.invuln = 0; S.ents = []; const l0 = S.lives;
  p.x = p.targetX = 100; S.ents.push({ kind: 'rio', y: 490, h: 66, bx: 250, bw: 50, hit: false });
  await new Promise((r) => setTimeout(r, 150)); return l0 - S.lives; });
check('004-R3 caer al río resta vida', water === 1, String(water));
const riverBridge = await page.evaluate(async () => { const S = CH._debug.S, p = CH._debug.player; S.invuln = 0; S.ents = []; const l0 = S.lives;
  p.x = p.targetX = 180; S.ents.push({ kind: 'rio', y: 490, h: 66, bx: 180, bw: 50, hit: false });
  await new Promise((r) => setTimeout(r, 150)); return l0 - S.lives; });
check('004-R3 cruzar por las piedras no resta vida', riverBridge === 0, String(riverBridge));
const animals = await page.evaluate(async () => { const S = CH._debug.S, p = CH._debug.player; const out = {};
  for (const e of [{ kind: 'zorro', bx: 0, vy: 0, amp: 0, ph: 0, r: 11 }, { kind: 'serpiente', dir: 1, vx: 0, r: 7, ph: 0, color: 'verde' },
    { kind: 'caiman', vx: 0.001, r: 9 }, { kind: 'jaguar', side: 1, state: 'jump', vx: 0, r: 15, speed: 0 }]) {
    S.invuln = 0; S.lives = 3; S.ents = []; p.x = p.targetX = 180;
    S.ents.push({ ...e, x: 180, bx: 180, y: 520 });
    await new Promise((r) => setTimeout(r, 120)); out[e.kind] = S.lives === 2;
  } return out; });
check('004-R3 animales hacen daño', Object.values(animals).every(Boolean), JSON.stringify(animals));
const slide = await page.evaluate(async () => { const S = CH._debug.S, p = CH._debug.player; S.invuln = 0; S.ents = []; S.lives = 3;
  S.ents.push({ kind: 'derrumbe', x: p.x, y: 520, timer: 0.05, max: 0.9, r: 15 });
  await new Promise((r) => setTimeout(r, 200)); return { kind: S.ents[0] && S.ents[0].kind, lost: 3 - S.lives }; });
check('004-R10 derrumbe golpea al caer sobre el jugador', slide.lost === 1, JSON.stringify(slide));
const slide2 = await page.evaluate(async () => { const S = CH._debug.S; S.ents = [];
  S.ents.push({ kind: 'derrumbe', x: 100, y: 200, timer: 0.05, max: 0.9, r: 15 });
  await new Promise((r) => setTimeout(r, 200)); return S.ents[0] && S.ents[0].kind; });
check('004-R10 derrumbe queda como roca', slide2 === 'roca', String(slide2));
await page.evaluate(async () => { const S = CH._debug.S; S.goal.timeLeft = 99; });
check('004-R2 nivel 3 (contrarreloj) se completa', (await finish()) === 'win');
await page.click('#btn-next'); await page.click('#btn-mission-go'); await wait(300);
const abyss = await page.evaluate(async () => { const S = CH._debug.S; S.lives = 99; S.meters = 400;
  await new Promise((r) => setTimeout(r, 1500)); const a = S.ents.find((e) => e.kind === 'abismo'); return a ? a.h : 0; });
check('004-R11 altiplano genera abismos anchos', abyss >= 70, String(abyss));
check('004-R9 altiplano con nieve', await page.evaluate(() => !!CH.BIOMES[CH._debug.S.level.biome].snow));
check('004-R2 nivel 4 se completa', (await finish()) === 'win');
await page.click('#btn-next'); await page.click('#btn-mission-go'); await wait(300);
check('004-R11 el receptor final es el Inca', await page.evaluate(() => CH._debug.S.level.receiver.kind === 'inca'));
check('004-R2 nivel 5 (final) se completa', (await finish()) === 'win');
check('004-R4 modo infinito desbloqueado', await page.evaluate(() => { document.getElementById('btn-win-menu').click(); document.getElementById('btn-levels-back').click();
  return !document.getElementById('btn-endless').classList.contains('locked'); }));

// ---------- Modo infinito (spec 001) ----------
await page.click('#btn-endless');
await wait(400);

const rock = (x) => ({ kind: 'roca', x, y: 520, r: 15, pts: [[0, -10], [10, 0], [0, 10], [-10, 0]] });

const hit = await page.evaluate(async (r) => {
  const S = CH._debug.S; S.invuln = 0; const l0 = S.lives;
  S.ents.push({ ...r, x: CH._debug.player.x });
  await new Promise((res) => setTimeout(res, 120));
  return { l0, l1: S.lives, inv: S.invuln > 0 };
}, rock(0));
check('001-R2 golpe resta 1 vida', hit.l1 === hit.l0 - 1, JSON.stringify(hit));
check('R2 golpe da inmunidad', hit.inv);

const gap = await page.evaluate(async () => {
  const S = CH._debug.S, p = CH._debug.player; S.invuln = 0; S.lives = 3; S.ents = [];
  p.x = p.targetX = 250;
  S.ents.push({ kind: 'abismo', y: 500, h: 44, bx: 90, bw: 56, hit: false });
  await new Promise((res) => setTimeout(res, 120));
  return S.lives;
});
check('R3 abismo fuera del puente daña', gap === 2, String(gap));

const bridge = await page.evaluate(async () => {
  const S = CH._debug.S, p = CH._debug.player; S.invuln = 0; S.lives = 3; S.ents = [];
  p.x = p.targetX = 180;
  S.ents.push({ kind: 'abismo', y: 500, h: 44, bx: 180, bw: 70, hit: false });
  await new Promise((res) => setTimeout(res, 150));
  return S.lives;
});
check('R3 sobre el puente no daña', bridge === 3, String(bridge));

const pututu = await page.evaluate(async (r) => {
  const S = CH._debug.S; S.ents = []; S.pututu = 1;
  S.ents.push({ ...r, x: 120, y: 200 }, { ...r, x: 200, y: 300 });
  CH._debug.usePututu();
  return { left: S.pututu, alive: S.ents.filter((e) => !e.dead && e.kind === 'roca').length };
}, rock(0));
check('R4 pututu despeja y consume carga', pututu.left === 0 && pututu.alive === 0, JSON.stringify(pututu));

const relay = await page.evaluate(async () => {
  const S = CH._debug.S; S.lives = 99; S.ents = []; S.meters = 690;
  await new Promise((res) => setTimeout(res, 2500));
  return S.tramo;
});
check('R5 relevo avanza de tramo', relay >= 1, String(relay));

const death = await page.evaluate(async (r) => {
  const S = CH._debug.S; S.invuln = 0; S.powers.inti = 0; S.lives = 1; S.maxLives = 4;
  S.ents.push({ ...r, x: CH._debug.player.x });
  await new Promise((res) => setTimeout(res, 150));
  return { mode: CH._debug.mode, best: localStorage.getItem('chasqui.best') };
}, rock(0));
check('R2 muerte muestra game over', death.mode === 'over', JSON.stringify(death));
check('R7 récord persistido', Number(death.best) > 0, String(death.best));

await page.click('#btn-retry'); await wait(150);
await page.click('#btn-pause');
check('R7 pausa', (await page.evaluate(() => CH._debug.mode)) === 'paused');

check('Sin errores de consola', errors.length === 0, errors.join(' | '));
await browser.close();

for (const r of results) console.log(`${r.ok ? '✔' : '✘'} ${r.name}${r.ok ? '' : '  → ' + r.detail}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} OK`);
process.exit(failed ? 1 : 0);
