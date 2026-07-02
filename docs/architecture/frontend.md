# Frontend Architecture

The frontend is a Vite React application with route-based dashboards for customers, admins, developers, operations, billing, and marketplace workflows.

## Main Surfaces

- Public product pages
- Customer builder portal
- Admin agent dashboards
- Operations command center
- Developer platform
- App marketplace
- Billing and workspace settings

## UI Rules

- Empty states explain what to do next.
- Failed states show reason and next action.
- Destructive or sensitive actions require confirmation.
- Buttons map to backend actions rather than static UI-only state.
