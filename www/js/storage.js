/*!
 * Chasqui: El Mensajero Inca
 * Archivo: js/storage.js
 * Autor: Byron Sebastián Rosero Díaz — Ingeniero de software
 * Versión: 1.0.0
 * © 2026 Byron Sebastián Rosero Díaz. Todos los derechos reservados.
 */
/* Persistencia local tolerante a fallos (WebView sin storage, modo privado, etc.). */
(function (CH) {
  'use strict';
  const PREFIX = 'chasqui.';
  CH.Store = {
    get(key, def) {
      try {
        const v = localStorage.getItem(PREFIX + key);
        return v === null ? def : JSON.parse(v);
      } catch { return def; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* sin persistencia */ }
    },
  };
})(window.CH);
