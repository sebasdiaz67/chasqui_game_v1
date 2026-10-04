# ADR-001 — Canvas 2D + JS vanilla, sin dependencias ni assets externos

**Estado:** Aceptada · **Fecha:** 2026-10-04

## Contexto
MVP de juego 2D simple, destino Android vía WebView. Se busca iterar rápido y que funcione offline.

## Decisión
Canvas 2D y JavaScript vanilla con scripts clásicos bajo el namespace `window.CH`; arte procedural y audio sintetizado.

## Alternativas consideradas
- Phaser / PixiJS: más capacidades (sprites, física) a costa de peso y dependencia.
- ES modules + bundler (Vite): mejor organización, pero requiere build y no funciona con `file://`.

## Consecuencias
- Positivas: cero build, carga instantánea, offline garantizado, fácil de leer.
- Negativas: el arte procedural no es de calidad de tienda; al crecer el código conviene migrar a módulos + Vite (nuevo ADR).
