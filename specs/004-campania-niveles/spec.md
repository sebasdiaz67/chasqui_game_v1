# Spec 004 — Campaña por niveles

**Estado:** Implementada (iteración 2: 5 niveles por suyos) · **Fecha:** 2026-10-04 · **Proyecto:** chasqui

## Contexto y problema
El modo infinito no da propósito narrativo. Se quiere una campaña: cada nivel es un encargo concreto entre pueblos, que escala hasta llegar al Sapa Inca.

## Objetivo
Iteración 1: **3 niveles jugables** con misiones de distinto tipo, fauna por región, aldeas de inicio/destino y el modo infinito como extra.

## Campaña (iteración 2 — reorganizada por suyos, 2026-10-04)
| Nv | En pantalla | Suyo | Misión | Tipo | Fauna / peligros | m |
|---|---|---|---|---|---|---|
| 1 | Norte | Chinchaysuyu | Tejidos de Pakari a Taita Atuk (Illari) | Entregar | llamas, zorro, rocas, puma | 1000 |
| 2 | Selva | Antisuyu | Plantas medicinales para Mama Sisa (Sumak) | Recolectar 10 | serpientes, jaguar, ríos con caimanes | 1200 |
| 3 | Sur | Contisuyu | Pescado fresco para Taita Waman (Kuntur) | Contrarreloj | derrumbes, cóndor, zorro, rocas | 1300 |
| 4 | Altiplano | Collasuyu | Mantas de lana para Mama Killa (Chiri) | Entregar | abismos anchos (puente largo), puma, cóndor, llamas, nieve | 1500 |
| 5 | Cusco | centro | Mensaje al Inca | Entregar (final) | todo mezclado, velocidad máxima | 1500 |

> Nombres de suyo solo en datos históricos; en pantalla, nombres simples de región (decisión del usuario sobre pronunciación).
> Cocodrilo de Tumbes descartado en esta iteración (costa norte = nivel introductorio).

## Requisitos
### R1 — Estructura de nivel
- CUANDO se inicia un nivel EL SISTEMA DEBE mostrar una pantalla de misión: título, origen → destino, encargo y quién lo pide.
- EL SISTEMA DEBE mostrar la aldea de origen al empezar y la aldea de destino al final, con el personaje que recibe la entrega.
- MIENTRAS se juega EL SISTEMA DEBE mostrar una barra de progreso origen → destino.

### R2 — Tipos de misión
- **Entregar:** CUANDO el jugador llega al receptor con vidas > 0 EL SISTEMA DEBE completar el nivel.
- **Recolectar:** EL SISTEMA DEBE mostrar el contador `n/N`; SI el jugador recibe un golpe ENTONCES pierde 2 ítems; SI llega con menos de N ENTONCES la misión falla con el motivo indicado.
- **Contrarreloj:** EL SISTEMA DEBE mostrar el tiempo restante; SI llega a 0 ENTONCES la misión falla. CUANDO el jugador recibe un golpe EL SISTEMA DEBE frenarlo (tropiezo) ~1 s.

### R3 — Fauna por región
- Puma / jaguar: aparecen al borde del camino, avisan (ojos brillantes ~0.6 s) y saltan cruzando el camino.
- Zorro andino: baja por el camino en zigzag.
- Serpiente: cruza el camino lentamente; cuerpo largo (colisión en varios puntos).
- Caimán: nada dentro de los ríos; el río solo se cruza por las piedras/puente; caer al agua = golpe.
- Se mantienen rocas, cóndor y llamas donde corresponda a la región.

### R4 — Progresión
- Completar un nivel desbloquea el siguiente; el progreso se guarda.
- CUANDO se completa un nivel EL SISTEMA DEBE mostrar resultado, dato histórico y botón «Siguiente nivel».
- El modo infinito se desbloquea al completar el último nivel disponible.

### R5 — Gráficos
- Aldeas con casas de piedra y techos de paja; andenes en la sierra; árboles/vegetación por región; ríos en la selva.

### R6 — Curva de dificultad por escalones *(añadido 2026-10-04)*
- CADA 200 m dentro de un nivel EL SISTEMA DEBE subir la velocidad y reducir el intervalo de aparición de obstáculos, hasta los valores máximos del nivel al llegar a la meta, y avisar con «El camino se acelera».

### R7 — Mensaje del Inca *(añadido 2026-10-04)*
- CUANDO se completa un nivel EL SISTEMA DEBE mostrar un mensaje del Inca felicitando al chasqui, además del dato histórico.

### R8 — Nivel máximo alcanzado *(añadido 2026-10-04)*
- EL SISTEMA DEBE guardar el nivel más alto alcanzado (al empezarlo) y mostrarlo en el menú y en la pantalla de misión fallida.

### R9 — Regiones *(iteración 2)*
- Cada nivel corresponde a una región con paleta propia (norte: tierra; selva: verde; sur: rojizo/gris; altiplano: azulado con nieve; Cusco: andenes) y 2 datos históricos: uno en la pantalla de misión y otro al completar.
- El modo infinito recorre las mismas 5 regiones.

### R10 — Derrumbes *(iteración 2)*
- EL SISTEMA DEBE mostrar una sombra de aviso ~0.9 s en el punto donde caerá la roca; CUANDO cae, SI el jugador está encima ENTONCES pierde 1 vida; la roca queda como obstáculo.

### R11 — Abismos largos y final *(iteración 2)*
- En el altiplano los abismos son más anchos (puente colgante largo). En el Cusco el receptor es el Inca; completar el nivel 5 desbloquea el modo infinito.

## Fuera de alcance
- Niveles 4 y 5, estrellas/puntuación por nivel, música, arte final (spec 003).

## Supuestos y preguntas abiertas
> ⚠️ Supuesto: duración ~40–60 s por nivel; dificultad creciente del 1 al 3.
> ✔️ Decisión (2026-10-04): nombres de aldeas y personajes cortos en kichwa (Pakari, Illari, Sumak, Tamya, Taita Atuk, Mama Sisa, Taita Waman) por facilidad de pronunciación; no son topónimos reales.
> ❓ Pendiente: mecánica de los niveles 4–5.
