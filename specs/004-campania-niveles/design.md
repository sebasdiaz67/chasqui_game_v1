# Design 004 — Campaña por niveles

**Spec:** [spec.md](spec.md) · **Fecha:** 2026-10-04

## Enfoque
Datos en `config.js` (`CH.LEVELS`, `CH.BIOMES`); `game.js` gana un modo de juego (`campaign | endless`) y un objetivo por nivel. El mundo, el spawn y las colisiones se reutilizan; los animales son nuevos `kind` con su comportamiento en `updateEntity` y su dibujo en `draw.js`.

## Componentes
| Componente | Cambio | Req. |
|---|---|---|
| `config.js` | `BIOMES` (paleta, decor, fauna), `LEVELS` (misión, longitud, dificultad, textos), `TRAMOS` de infinito apuntan a biomas | R1–R5 |
| `game.js` | `startLevel(i)`, `startEndless()`, objetivo (`deliver/collect/time`), aldeas como entidades, ríos, nuevos animales, pantallas misión/victoria/fallo, progreso guardado | R1–R4 |
| `draw.js` | Aldeas, receptor, andenes, árboles, río + piedras, puma, jaguar, zorro, serpiente, caimán, planta, HUD de misión y progreso | R1, R3, R5 |
| `index.html` / `style.css` | Pantallas: selección de nivel, misión, victoria | R1, R4 |

## Estado nuevo
```js
S.gameMode = 'campaign' | 'endless'; S.level = LEVELS[i] | null;
S.goal = { type, need, have, timeLeft }; S.lengthM; S.stumble
save.levelsDone = [1, 2]   // persistido
```

## Alternativas descartadas
| Alternativa | Por qué no |
|---|---|
| Nivel como archivo/JSON externo | `fetch` no funciona con `file://`; datos en `config.js` |
| Carga con integridad propia | Duplica el sistema de vidas |

## Riesgos
| Riesgo | Mitigación |
|---|---|
| `game.js` crece demasiado | Si supera ~900 líneas, dividir en módulos (ADR nuevo, posible Vite) |
| Animales procedurales poco legibles a tamaño móvil | Siluetas simples y colores contrastados; se reemplazan en spec 003 |

## Verificación
`tests/smoke.mjs` ampliado: completar nivel 1, fallo por plantas, fallo por tiempo, golpe de animales, desbloqueo. Capturas de cada nivel en el navegador.
