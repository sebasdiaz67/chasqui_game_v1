# Design 001 — Gameplay base

**Spec:** [spec.md](spec.md) · **Fecha:** 2026-10-04

## Enfoque
Loop único con `requestAnimationFrame`; estado de partida en un objeto `S`, estado visual compartido en `world` (scroll, decor, partículas). El mundo se desplaza hacia abajo (`dy = speed × slow × dt`); el jugador está fijo en `PLAYER_Y = 520` y solo se mueve en X.

## Componentes
| Archivo | Cambio | Requisitos |
|---|---|---|
| `config.js` | Datos de balance, personajes, tramos, poderes, datos históricos | R3–R6 |
| `game.js` | `updateRun`, `spawn*`, colisiones, `onHazard`, `relay`, `gameOver`, input | R1–R7 |
| `draw.js` | Sprites procedurales, HUD, banner | R2–R6 |
| `storage.js` | Persistencia tolerante a fallos | R7 |
| `audio.js` | Efectos por evento | — |

## Modelo de estado
```js
S = { char, meters, tramo, nextTamboM, lives, maxLives, quipus, bonus, score,
      invuln, powers:{inti,killa}, powerMax, pututu, hazTimer, quipuTimer, powerTimer,
      lastAbismoM, ents:[{kind, x, y, r, ...}], banner }
```
Colisiones: círculo-círculo (jugador vs. `e.r × 0.8`), banda + rango X para abismos.

## Dificultad
- `speed = 230 + min(tramo,10)×28 + progresoTramo×30` px/s
- `hazardInterval = clamp(1.15 − tramo×0.1 − progreso×0.15, 0.42, 2) × rand(0.8–1.2)` s
- Ancho del puente: `max(56, 82 − tramo×4)` px

## Alternativas descartadas
| Alternativa | Por qué no |
|---|---|
| Phaser / motor de juego | Peso y curva innecesarios para un MVP; ver ADR-001 |
| Arrastre absoluto (personaje bajo el dedo) | El dedo tapa al personaje y los obstáculos |
| ES modules | Rompen al abrir `index.html` con `file://` |

## Riesgos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Rendimiento en gama baja (sombras, partículas) | Medio | Medir en dispositivo; reducir `shadowBlur`/partículas |
| Generación aleatoria injusta (obstáculos imposibles) | Medio | Intervalo mínimo 0.42 s; abismo con tregua de 0.7 s |

## Verificación
`tests/smoke.mjs` (headless) + prueba manual en dispositivo.
