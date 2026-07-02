# Frontend Design System

VaanForge uses a restrained enterprise SaaS visual system: neutral surfaces, green primary actions, red destructive states, subtle borders, and compact typography.

## Principles

- Keep product screens action-first.
- Prefer short labels and stateful components over long explanatory copy.
- Use cards for records, not for entire page sections.
- Show one primary action per screen where possible.
- Never show metrics or records unless they come from backend state.

## Core Components

- Page headers: title, one-line description, primary action.
- Buttons: primary, secondary, ghost, destructive, disabled, loading.
- Form fields: label, helper, error, success, disabled, read-only.
- States: loading, empty, error, permission denied, plan limit, success.
- Data views: responsive cards first, tables only when row comparison matters.

## Token Usage

Colors and radii come from `frontend/src/styles/theme.css`. Components should use token classes such as `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, and `text-primary-foreground`.

## Current Implementation Notes

The workspace top navigation is intentionally compact. Advanced surfaces remain reachable through contextual flows and subdomain shells instead of being exposed all at once.
