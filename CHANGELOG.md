# Changelog

Todas las cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y el proyecto usa [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] — 2026-08-05

Primer release. Test de mecanografía completo, PWA instalable, accesible (WCAG AA) y probado con 78 tests unit + 51 E2E en 3 browsers.

### Added

- Modos de test: tiempo (15/30/60/120 s), palabras (10/25/50/100), zen, solo números, solo símbolos.
- Opciones de texto: puntuación, números, mayúsculas, modo largo.
- Feedback de tipeo: caret block/bar suave, sonido opcional, shake, blaming, flecha de fila, modo estricto, flash al corregir, confirmación de reinicio, pausa con `Esc`, botón finish, onboarding.
- Resultados: WPM/raw, precisión, consistencia, percentil, gráfico WPM vs tiempo, heatmap de errores, top-10 errores, historial con filtros, PB, exportar/copiar/compartir, confeti en PB.
- Settings persistentes (fuente, tamaño, gap, sonido, caret, temas, paletas, presets) y light/dark/system.
- PWA offline/instalable, virtualización de palabras, code-splitting, timers por `performance.now()`.
- CI en GitHub Actions, commit convention (hook `commit-msg` + asistente `npm run commit`), config de deploy para Vercel (`vercel.json`).

### Fixed

- Bug de atajos de teclado: la primera letra podía comerse el atajo (24% de las palabras) — los atajos solo aplican en reposo con foco no editable.
- Header tapando los clicks de Settings/History/Stats (fix `relative z-10`).
- Doble conteo de espacios en el heatmap de errores.
- `aria-label`/`id` de los sliders que quedaban en el root y no en el thumb.

### Changed

- Default de `wordGap` 0.7 → 0.9 rem y más separación en la toolbar de opciones.
- Dependencias sin vulnerabilidades (`npm audit` limpio).

## [Unreleased]

- Sección 9: meta-benchmark opcional (comparar WPM con percentiles de la comunidad).
- Sección 10: backend/multiplayer (fuera de scope por ahora).
