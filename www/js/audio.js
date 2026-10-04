/*!
 * Chasqui: El Mensajero Inca
 * Archivo: js/audio.js
 * Autor: Byron Sebastián Rosero Díaz — Ingeniero de software
 * Versión: 1.0.0
 * © 2026 Byron Sebastián Rosero Díaz. Todos los derechos reservados.
 */
/* Efectos de sonido sintetizados con WebAudio: sin archivos de audio externos. */
(function (CH) {
  'use strict';
  let ac = null;
  let muted = CH.Store.get('muted', false);

  function audio() {
    if (!ac) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      ac = new A();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function tone(freq, dur, { type = 'square', vol = 0.12, to = null, delay = 0 } = {}) {
    if (muted) return;
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + delay;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol = 0.2) {
    if (muted) return;
    const a = audio(); if (!a) return;
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = a.createBufferSource();
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    const g = a.createGain(); g.gain.value = vol;
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(a.destination);
    src.start();
  }

  // ===================================================================
  //  Música de fondo procedural (spec 005-R2): quena + bordón + bombo
  // ===================================================================
  const SCALE = [0, 3, 5, 7, 10];     // pentatónica menor (semitonos)
  const ROOT = 220;                   // La3
  const BEAT = 60 / 92;               // 92 pulsos por minuto
  // Ritmo de huayno: larga-corta-corta. Frase de 8 pulsos.
  const RHYTHM = [0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.5, 1, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.5, 1];
  let bgm = null;

  function freqOf(degree) {
    const n = SCALE.length, oct = Math.floor(degree / n), i = ((degree % n) + n) % n;
    return ROOT * Math.pow(2, (SCALE[i] + 12 * oct) / 12);
  }

  // Caminata aleatoria sobre la escala; cada mitad termina en reposo y la frase resuelve en la tónica.
  function makePhrase() {
    let d = 5;
    return RHYTHM.map((dur, k) => {
      d = Math.max(2, Math.min(10, d + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
      if (k === 8) d = 7;                   // reposo en la quinta a mitad de frase
      if (k === RHYTHM.length - 1) d = 5;   // tónica al final
      return { deg: d, dur };
    });
  }

  // Quena: triangular con vibrato y filtro paso bajo que se abre al atacar la nota.
  function quena(a, out, f, t, dur) {
    const o = a.createOscillator(), vib = a.createOscillator(), vg = a.createGain();
    const flt = a.createBiquadFilter(), g = a.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(f, t);
    vib.frequency.value = 5.5; vg.gain.value = f * 0.012; vib.connect(vg); vg.connect(o.frequency);
    flt.type = 'lowpass'; flt.Q.value = 2;
    flt.frequency.setValueAtTime(900, t);
    flt.frequency.linearRampToValueAtTime(2800, t + Math.min(0.08, dur * 0.3));
    flt.frequency.linearRampToValueAtTime(1300, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.55, t + 0.03);
    g.gain.setValueAtTime(0.5, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.97);
    o.connect(flt); flt.connect(g); g.connect(out);
    o.start(t); vib.start(t); o.stop(t + dur); vib.stop(t + dur);
  }

  // Bombo andino: seno con caída rápida de tono.
  function bombo(a, out, t, strong) {
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(strong ? 95 : 80, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    g.gain.setValueAtTime(strong ? 0.9 : 0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.22);
  }

  // Planificador con anticipación: agenda las notas ~0.3 s antes (estable aunque el loop del juego se atrase).
  function scheduleBGM() {
    if (!bgm) return;
    const a = bgm.ac;
    while (bgm.next < a.currentTime + 0.3) {
      const phrase = bgm.phrases[[0, 0, 1, 1][bgm.part % 4]];   // forma A A B B
      const n = phrase[bgm.note], dur = n.dur * BEAT;
      quena(a, bgm.master, freqOf(n.deg), bgm.next, dur * 0.95);
      const onBeat = Math.abs(bgm.beat - Math.round(bgm.beat)) < 1e-6;
      if (onBeat) bombo(a, bgm.master, bgm.next, Math.round(bgm.beat) % 2 === 0);
      bgm.beat += n.dur; bgm.next += dur; bgm.note++;
      if (bgm.note >= phrase.length) {
        bgm.note = 0; bgm.part++;
        if (bgm.part % 8 === 0) bgm.phrases = [makePhrase(), makePhrase()]; // variación cada 2 vueltas
      }
    }
  }

  function playBGM() {
    if (muted || bgm) return;
    const a = audio(); if (!a) return;
    const master = a.createGain();
    master.gain.setValueAtTime(0.0001, a.currentTime);
    master.gain.linearRampToValueAtTime(0.07, a.currentTime + 1.5);      // entra suave
    master.connect(a.destination);
    // Bordón: tónica y quinta graves, filtradas, continuas.
    const droneOut = a.createBiquadFilter(); droneOut.type = 'lowpass'; droneOut.frequency.value = 380;
    const dg = a.createGain(); dg.gain.value = 0.22; droneOut.connect(dg); dg.connect(master);
    const drones = [ROOT / 2, ROOT * 0.75].map((f) => {
      const o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.connect(droneOut); o.start(); return o;
    });
    bgm = { ac: a, master, drones, next: a.currentTime + 0.15, beat: 0, note: 0, part: 0, phrases: [makePhrase(), makePhrase()] };
    bgm.timer = setInterval(scheduleBGM, 100);
    scheduleBGM();
  }

  function stopBGM() {
    if (!bgm) return;
    const { ac: a, master, drones, timer } = bgm;
    bgm = null;
    clearInterval(timer);
    master.gain.cancelScheduledValues(a.currentTime);
    master.gain.setValueAtTime(master.gain.value, a.currentTime);
    master.gain.linearRampToValueAtTime(0.0001, a.currentTime + 0.3);
    drones.forEach((o) => o.stop(a.currentTime + 0.35));
    setTimeout(() => master.disconnect(), 450);
  }

  function toggleMute() {
    muted = !muted;
    CH.Store.set('muted', muted);
    if (muted) stopBGM(); else playBGM();
    return muted;
  }

  CH.Sfx = {
    unlock() { if (!muted) audio(); },
    isMuted() { return muted; },
    playBGM, stopBGM, toggleMute,
    toggle: toggleMute,                 // alias por compatibilidad
    isPlaying() { return !!bgm; },
    click()  { tone(660, 0.05, { vol: 0.05 }); },
    quipu()  { tone(880, 0.07, { type: 'triangle' }); tone(1320, 0.09, { type: 'triangle', vol: 0.1, delay: 0.05 }); },
    power()  { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { type: 'triangle', delay: i * 0.06 })); },
    hit()    { noise(0.25, 0.3); tone(170, 0.3, { type: 'sawtooth', vol: 0.12, to: 60 }); },
    smash()  { noise(0.15, 0.18); },
    pututu() { tone(196, 0.9, { type: 'sawtooth', vol: 0.09, to: 185 }); tone(98, 0.9, { type: 'triangle', vol: 0.14 }); },
    relay()  { [392, 494, 587, 784].forEach((f, i) => tone(f, 0.18, { vol: 0.07, delay: i * 0.12 })); },
    over()   { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, { vol: 0.07, delay: i * 0.18 })); },
  };
})(window.CH);
