# CLAUDE.md — chasqui

> Leer junto con `STATUS.md`. Contexto global en `../CLAUDE.md`. Guía de usuario en `README.md`.

## Qué es
**Chasqui: El Mensajero Inca** (nombre comercial; antes «Mensajeros del Qhapaq Ñan»). Runner vertical para móvil: un chasqui recorre el camino inca, esquiva obstáculos, recoge quipus y hace relevos en tambos. Objetivo: publicar en Google Play.

## Stack
- HTML5 Canvas 2D + JavaScript vanilla (ES2020), **sin dependencias ni assets externos** (arte procedural, audio WebAudio).
- Scripts clásicos con namespace global `window.CH` (no ES modules → funciona con `file://`). Ver ADR-001.
- Persistencia: `localStorage` envuelto en try/catch (`CH.Store`, prefijo `chasqui.`).
- Empaquetado previsto: Capacitor → Android (ADR-002).

## Comandos
```bash
npx serve www                           # ejecutar en local (o: python -m http.server -d www 8080)
node --check www/js/*.js                # chequeo de sintaxis rápido
node tests/smoke.mjs                    # prueba headless (requiere playwright; ver cabecera del archivo)
# Windows (usuario): preparar entorno Android / Capacitor 8
powershell -NoProfile -ExecutionPolicy Bypass -File .\preparar_entorno.ps1 [-InstallAndroidStudio] [-InitCapacitor]
```

## Arquitectura (`www/js/`, orden de carga importa)
| Archivo | Responsabilidad |
|---|---|
| `config.js` | **Balance y datos**: `CFG`, `CHARACTERS`, `BIOMES`, `LEVELS` (campaña), `TRAMOS` (infinito), `POWERS`, `FACTS`. Ajustes de juego van aquí. |
| `storage.js` | `CH.Store.get/set` tolerante a fallos |
| `audio.js` | `CH.Sfx.*` efectos sintetizados + música procedural (`playBGM/stopBGM/toggleMute`); mute persistido |
| `draw.js` | `CH.Draw.*` todo el render (fondo, sprites, HUD, banner). Sin estado de juego. |
| `game.js` | Modos `campaign`/`endless`, estados (`menu/levels/mission/playing/paused/win/over`), objetivos, spawn, colisiones, input, UI DOM, loop |

- Resolución lógica fija **360×640** escalada al viewport (`resize()`); el `#frame` DOM mide igual que el canvas y contiene HUD/pantallas.
- Entidades en `S.ents` con `kind`: `roca | llama | condor | warn | puma | jaguar | zorro | serpiente | caiman | rio | abismo | quipu | planta | power | tambo | aldea`.
- Objetivo de nivel en `S.goal` (`deliver | collect | time`); progreso en `localStorage` `chasqui.levels`.
- Hook de pruebas: `CH._debug` expone `S`, `mode`, `player`, `usePututu`.

## Convenciones
- Identificadores en inglés salvo términos del dominio (quipu, tambo, pututu, tramo…); comentarios en español.
- Nuevo animal/obstáculo = peso en `hazards` del nivel/tramo + caso en `spawnHazard` + comportamiento en `updateEntity` + `D.<kind>` en `draw.js` + caso de colisión + prueba en `tests/smoke.mjs`.
- Nuevo nivel = entrada en `CH.LEVELS` (no requiere tocar la lógica salvo tipo de misión nuevo).
- Datos históricos con redacción prudente ("se estima") — revisar fuentes antes de publicar.

## Restricciones
- Orientación solo vertical. Debe funcionar offline.
- Evitar contenido que eleve la clasificación de edad (ADR-003: sin hoja de coca).
- Rendimiento objetivo: 60 fps en Android gama media; `dt` limitado a 50 ms.
