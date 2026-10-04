# Spec 001 — Gameplay base

**Estado:** Implementada · **Fecha:** 2026-10-04 · **Proyecto:** chasqui
> ⚠️ **Retro-documentada:** escrita después de implementar el prototipo, a partir del código existente.

## Contexto y problema
Se necesita un juego móvil simple, con identidad cultural andina, como primer proyecto publicable en Google Play y como base técnica (HTML5 → Capacitor).

## Objetivo
Un runner vertical jugable en navegador móvil, con progresión (tramos, desbloqueos) suficiente para partidas de 1–5 minutos.

## Requisitos
### R1 — Movimiento
**Historia:** Como jugador, quiero mover al chasqui deslizando el dedo sin taparlo.
- CUANDO el jugador arrastra en el área de juego EL SISTEMA DEBE mover al personaje de forma relativa al desplazamiento (factor 1.3 × velocidad del personaje).
- EL SISTEMA DEBE limitar al personaje a los bordes del camino.
- CUANDO se usa teclado EL SISTEMA DEBE aceptar ←/→ y A/D.

### R2 — Vidas e inmunidad
- CUANDO el jugador choca con un obstáculo EL SISTEMA DEBE restar 1 vida y otorgar 1.6 s de inmunidad con parpadeo.
- MIENTRAS haya inmunidad EL SISTEMA DEBE ignorar nuevos golpes.
- CUANDO las vidas llegan a 0 EL SISTEMA DEBE mostrar la pantalla de fin con distancia, quipus, tramo, puntaje y récord.

### R3 — Obstáculos
- EL SISTEMA DEBE generar rocas, llamas (cruzan el camino) y cóndores (aviso "!" ~0.95 s antes de caer) según el tramo.
- EL SISTEMA DEBE generar abismos (desde el tramo 2) que solo se cruzan por un puente; SI el jugador está fuera del puente ENTONCES pierde 1 vida (una vez por abismo).

### R4 — Poderes
- Escudo de Inti: inmunidad 5 s × multiplicador; destruye obstáculos (+20) y atrae quipus.
- Luz de Killa: ralentiza el mundo al 50 % durante 6 s × multiplicador.
- Maíz: +1 vida (solo aparece si faltan vidas). Vidas máximas = iniciales + 1.
- Pututu: carga acumulable (máx. 3); CUANDO se activa EL SISTEMA DEBE destruir obstáculos en pantalla (+10 c/u). Abismos no se ven afectados.

### R5 — Tramos y relevos
- CADA 700 m EL SISTEMA DEBE mostrar un tambo; CUANDO el jugador lo cruza: +100 puntos, +1 vida (si falta), dato histórico, cambio de bioma y mayor dificultad.
- MIENTRAS el tambo está en pantalla y durante ~3 s después EL SISTEMA NO DEBE generar obstáculos.

### R6 — Personajes y progresión
- 4 personajes (Amaru, Wayra, Rumi, Kusi) con vidas, velocidad, hitbox y multiplicador de poderes distintos.
- EL SISTEMA DEBE desbloquearlos por quipus acumulados entre partidas (0/40/120/250) y avisar al desbloquear.

### R7 — Plataforma móvil
- Resolución lógica 360×640 escalada; nitidez en pantallas de alta densidad.
- CUANDO la app pasa a segundo plano EL SISTEMA DEBE pausar.
- Récord, quipus, personaje, mute y tutorial persistidos; SI localStorage falla ENTONCES el juego funciona sin persistencia.

## Requisitos no funcionales
- Sin dependencias ni assets externos; offline.
- 60 fps objetivo; `dt` limitado a 50 ms.

## Fuera de alcance
- Arte final, música, monetización, rankings online, empaquetado nativo.

## Supuestos y preguntas abiertas
> ⚠️ Supuesto: balance (velocidades, intervalos) no validado con jugadores.
> ❓ Pendiente: revisión de fuentes de `CH.FACTS`.
