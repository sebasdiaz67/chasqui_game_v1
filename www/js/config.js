/*!
 * Chasqui: El Mensajero Inca
 * Archivo: js/config.js
 * Autor: Byron Sebastián Rosero Díaz — Ingeniero de software
 * Versión: 1.0.0
 * © 2026 Byron Sebastián Rosero Díaz. Todos los derechos reservados.
 */
/* Configuración y datos del juego. Ajusta aquí el balance sin tocar la lógica. */
window.CH = window.CH || {};
(function (CH) {
  'use strict';

  // Metadatos oficiales del juego (fuente única para créditos y versión).
  CH.META = {
    name: 'Chasqui: El Mensajero Inca',
    version: '1.0.0',
    author: 'Byron Sebastián Rosero Díaz',
    role: 'Ingeniero de software',
    year: 2026,
  };

  CH.CFG = {
    W: 360, H: 640,            // resolución lógica (vertical)
    ROAD_L: 70, ROAD_R: 290,   // bordes del Qhapaq Ñan
    PLAYER_Y: 520,
    PX_PER_M: 10,              // píxeles por metro recorrido
    TRAMO_M: 700,              // metros entre tambos (modo infinito)
    BASE_SPEED: 230,           // px/s (modo infinito)
    SPEED_PER_TRAMO: 28,
    INVULN_HIT: 1.6,           // s de inmunidad tras un golpe
    STUMBLE: 0.9,              // s de tropiezo (frenado) tras un golpe
    MAX_LIVES_BONUS: 1,        // vidas máximas = vidas iniciales + esto
    MAX_PUTUTU: 3,
    DIFF_STEP_M: 200,          // campaña: la dificultad sube en escalones cada 200 m
  };

  CH.CHARACTERS = [
    { id: 'amaru', name: 'Amaru', title: 'El equilibrado', perk: 'Sin debilidades.',
      lives: 3, move: 1.0, puMult: 1.0, radius: 12, unlock: 0, tunic: '#b83227', trim: '#f1c40f' },
    { id: 'wayra', name: 'Wayra', title: 'Veloz como el viento', perk: 'Se mueve más rápido y es más pequeño, pero solo tiene 2 vidas.',
      lives: 2, move: 1.35, puMult: 1.0, radius: 10, unlock: 40, tunic: '#2e86c1', trim: '#f5f5f5' },
    { id: 'rumi', name: 'Rumi', title: 'Duro como la piedra', perk: '4 vidas, pero es más lento.',
      lives: 4, move: 0.85, puMult: 1.0, radius: 13, unlock: 120, tunic: '#6d4c41', trim: '#e67e22' },
    { id: 'kusi', name: 'Kusi', title: 'Favorito de Inti', perk: 'Sus poderes duran casi el doble.',
      lives: 3, move: 1.0, puMult: 1.8, radius: 12, unlock: 250, tunic: '#1e8449', trim: '#f1c40f' },
  ];

  // Regiones: paleta, decoración lateral (pesos), estilo de los costados y clima.
  CH.BIOMES = {
    norte:     { grass: '#a99a62', grass2: '#9c8c56', road: '#cdb184', joint: '#9e845c', tuft: '#c9b46a',
      sides: 'andenes', decor: { ichu: 3, cactus: 2, queuna: 1, piedra: 2 }, roof: 'paja' },
    selva:     { grass: '#2a6b37', grass2: '#245f30', road: '#9c7f5a', joint: '#6e5a3f', tuft: '#48a85c',
      sides: 'bosque', decor: { palmera: 3, helecho: 3, arbol: 3, flor: 1 }, roof: 'redondo' },
    sur:       { grass: '#a5644c', grass2: '#975a43', road: '#a39282', joint: '#6f6258', tuft: '#c98f6a',
      sides: 'llano', decor: { volcan: 1, piedra: 3, cactus: 2 }, roof: 'paja' },
    altiplano: { grass: '#a7b9c9', grass2: '#9aaebf', road: '#aaa49a', joint: '#7d786f', tuft: '#ddd8ae',
      sides: 'llano', decor: { ichu: 3, nieve: 3, piedra: 2 }, roof: 'paja', snow: true },
    cusco:     { grass: '#6a9a45', grass2: '#5e8c3d', road: '#c2a67a', joint: '#9e845c', tuft: '#b5c95e',
      sides: 'andenes', decor: { queuna: 2, flor: 2, piedra: 1, ichu: 2 }, roof: 'paja' },
  };

  // Campaña: un nivel por suyo y el final en el Cusco (spec 004, iteración 2).
  // En pantalla se usan nombres simples de región; el nombre del suyo va solo en los datos históricos.
  CH.LEVELS = [
    {
      id: 1, biome: 'norte', region: 'Norte',
      title: 'La encomienda', from: 'Pakari', to: 'Illari',
      giver: 'Taita Kuri',
      request: 'Lleva estos tejidos a Taita Atuk, en Illari. Es un regalo importante: no te detengas.',
      goal: { type: 'deliver', label: 'Llega a Illari con vida' },
      receiver: { kind: 'curaca', name: 'Taita Atuk' },
      lengthM: 1000, speed: 200, speedRamp: 40, interval: [1.4, 0.95],
      hazards: { roca: 2, llama: 3, zorro: 3, puma: 1 },
      winTitle: '¡Encomienda entregada!',
      inca: 'Buen trabajo, chasqui. Tus pies son rápidos y tu palabra es fiel. Ahora te espera la selva.',
      win: 'Taita Atuk recibe los tejidos y te pide llevar un encargo hacia la selva.',
      facts: [
        'El Chinchaysuyu era la región del norte del imperio inca y llegaba hasta el actual Ecuador.',
        'Los chasquis llevaban mensajes y encargos livianos, corriendo de posta en posta por el camino inca.',
      ],
    },
    {
      id: 2, biome: 'selva', region: 'Selva',
      title: 'Plantas para Mama Sisa', from: 'Illari', to: 'Sumak',
      giver: 'Mama Sisa, la yachak',
      request: 'Hay enfermos en Sumak. Recoge plantas medicinales en el camino y tráemelas. Cruza los ríos por las piedras.',
      goal: { type: 'collect', need: 10, item: 'plantas', label: 'Recoge 10 plantas medicinales' },
      receiver: { kind: 'hampikamayuq', name: 'Mama Sisa' },
      lengthM: 1200, speed: 215, speedRamp: 40, interval: [1.25, 0.85],
      hazards: { serpiente: 4, jaguar: 2, roca: 1 },
      rivers: [260, 360],
      winTitle: '¡Plantas entregadas!',
      inca: 'Salvaste a la gente de Sumak. Un buen chasqui también cuida a su pueblo.',
      win: 'Mama Sisa prepara los remedios. Los enfermos de Sumak se van a recuperar.',
      facts: [
        'El Antisuyu era la región de la selva, al este del Cusco.',
        'Los yachak, sabios y curanderos andinos, conocían muchas plantas medicinales de la sierra y la selva.',
      ],
    },
    {
      id: 3, biome: 'sur', region: 'Sur',
      title: 'Pescado fresco', from: 'Yaku', to: 'Kuntur',
      giver: 'Paku, pescador de la costa',
      request: 'Lleva este pescado a Taita Waman, en Kuntur, antes de que se dañe. Cuidado con los derrumbes.',
      goal: { type: 'time', seconds: 62, label: 'Entrega el pescado antes de que se dañe' },
      receiver: { kind: 'curaca', name: 'Taita Waman' },
      lengthM: 1300, speed: 235, speedRamp: 45, interval: [1.1, 0.8],
      hazards: { derrumbe: 4, roca: 2, condor: 2, zorro: 2 },
      winTitle: '¡Pescado entregado a tiempo!',
      inca: 'El pescado llegó fresco. Pocos chasquis corren así entre volcanes.',
      win: 'Taita Waman recibe el pescado todavía fresco y te manda al altiplano.',
      facts: [
        'El Contisuyu era la región del suroeste, entre los volcanes y la costa.',
        'Se cuenta que, gracias a los chasquis, el Inca podía comer pescado fresco traído desde la costa.',
      ],
    },
    {
      id: 4, biome: 'altiplano', region: 'Altiplano',
      title: 'Mantas para el frío', from: 'Kuntur', to: 'Chiri',
      giver: 'Taita Waman',
      request: 'Lleva estas mantas de lana a Mama Killa, en Chiri. El frío es fuerte y los abismos, anchos: cruza por los puentes.',
      goal: { type: 'deliver', label: 'Llega a Chiri con las mantas' },
      receiver: { kind: 'curaca', name: 'Mama Killa' },
      lengthM: 1500, speed: 245, speedRamp: 50, interval: [1.05, 0.75],
      hazards: { roca: 2, puma: 3, llama: 2, condor: 2 },
      abismo: { h: 74, bw: 56, every: [200, 300] },
      winTitle: '¡Mantas entregadas!',
      inca: 'Cruzaste los puentes del altiplano sin miedo. Ven al Cusco: tengo un mensaje para ti.',
      win: 'Mama Killa reparte las mantas. Esta noche nadie pasará frío en Chiri.',
      facts: [
        'El Collasuyu era la región del sur, con el altiplano y el lago Titicaca.',
        "Los puentes colgantes, como el Q'eswachaka, se tejían con fibra vegetal y todavía se renuevan cada año.",
      ],
    },
    {
      id: 5, biome: 'cusco', region: 'Cusco',
      title: 'Mensaje al Inca', from: 'Chiri', to: 'Cusco',
      giver: 'Mama Killa',
      request: 'El Inca espera este quipu con noticias de los cuatro suyos. Es el mensaje más importante del imperio.',
      goal: { type: 'deliver', label: 'Entrega el quipu al Inca' },
      receiver: { kind: 'inca', name: 'El Inca' },
      lengthM: 1500, speed: 260, speedRamp: 50, interval: [0.95, 0.68],
      hazards: { roca: 2, puma: 2, zorro: 2, llama: 1, condor: 2, derrumbe: 2 },
      abismo: { h: 56, bw: 60, every: [280, 380] },
      winTitle: '¡Mensaje entregado al Inca!',
      inca: 'Recorriste los cuatro suyos. Desde hoy eres el chasqui más veloz del Tahuantinsuyu.',
      win: 'Terminaste la campaña. Se desbloqueó el Camino infinito.',
      facts: [
        'El Cusco era el centro del imperio: desde allí partían los caminos hacia los cuatro suyos.',
        'Tahuantinsuyu significa "las cuatro regiones unidas".',
      ],
    },
  ];
  CH.LEVELS_SOON = [];

  // Modo infinito (extra): recorre las mismas regiones.
  CH.TRAMOS = [
    { name: 'Norte', biome: 'norte', hazards: { roca: 3, llama: 2, zorro: 2 }, abismo: false },
    { name: 'Selva', biome: 'selva', hazards: { serpiente: 3, jaguar: 2, roca: 1 }, abismo: false, rios: true },
    { name: 'Sur', biome: 'sur', hazards: { derrumbe: 3, roca: 2, condor: 2 }, abismo: false },
    { name: 'Altiplano', biome: 'altiplano', hazards: { roca: 2, puma: 2, condor: 2, llama: 1 }, abismo: true },
    { name: 'Cusco', biome: 'cusco', hazards: { roca: 2, puma: 2, zorro: 2, condor: 2, derrumbe: 2 }, abismo: true },
  ];

  CH.POWERS = {
    inti:   { label: 'Escudo de Inti', color: '#ffc400', glow: '255,196,0', dur: 5 },
    killa:  { label: 'Luz de Killa',   color: '#8fb0ff', glow: '120,160,255', dur: 6 },
    pututu: { label: '+1 Pututu',      color: '#ffb36b', glow: '255,150,60' },
    maiz:   { label: '+1 Vida',        color: '#ff5a5a', glow: '255,70,70' },
  };

  // Datos históricos del modo infinito (redacción prudente: cifras "se estima").
  CH.FACTS = [
    'Los chasquis corrían en relevos entre postas llamadas chaskiwasi, ubicadas cada pocos kilómetros.',
    'Se estima que un mensaje podía recorrer unos 240 km en un día gracias a los relevos.',
    'Los quipus eran cuerdas con nudos que registraban números y datos del imperio.',
    'El pututu, una trompeta de caracol, anunciaba la llegada del chasqui a la siguiente posta.',
    'El Qhapaq Ñan superaba los 30 000 km y unía territorios de seis países actuales, incluido Ecuador.',
    'El Qhapaq Ñan es Patrimonio Mundial de la UNESCO desde 2014.',
    "El Q'eswachaka, un puente de fibra vegetal, todavía se renueva cada año en Cusco.",
    'Además de mensajes, los chasquis transportaban objetos livianos entre ciudades.',
  ];
})(window.CH);
