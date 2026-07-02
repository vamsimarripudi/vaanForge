# Motion System

Motion in VaanForge should clarify state, not decorate the interface.

## Durations

- Fast hover/focus: 120-180ms
- Standard UI transitions: 200-280ms
- Page or drawer transitions: 280-420ms

## Rules

- Respect `prefers-reduced-motion`.
- Use loading motion only for active work.
- Do not animate fake progress.
- Do not use infinite decorative motion outside loading indicators.
- Prefer opacity and transform transitions over layout-shifting animation.

## Current Implementation

Global reduced-motion handling is defined in `frontend/src/styles/theme.css`. Workspace loading states use lightweight spinner motion only while backend requests are active.
