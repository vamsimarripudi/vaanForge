# Responsive Guidelines

VaanForge is mobile-first for customer workflows and desktop-optimized for advanced admin work.

## Layout Rules

- Use single-column mobile layouts by default.
- Add grid columns at tablet and desktop breakpoints only when comparison is useful.
- Keep primary actions visible on mobile.
- Avoid horizontal overflow.
- Convert dense tables into stacked cards on smaller screens.
- Keep tap targets at least 32px high, with 40px preferred for primary actions.

## Navigation

- Top navigation should stay compact.
- Mobile navigation uses a drawer.
- Sidebar history must show real backend/chat history or an honest empty state.

## Current Implementation

The main workspace uses a compact top nav, a collapsible desktop sidebar, and a mobile drawer. Projects and builds render as responsive card grids/lists instead of fixed desktop-only tables.
