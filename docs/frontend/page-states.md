# Page States

Every major VaanForge page should make backend state understandable.

## Required States

| State | Purpose | UX Rule |
| --- | --- | --- |
| Loading | Backend request is active. | Show what is loading; avoid stuck spinners. |
| Empty | Request succeeded with no records. | Explain next action. |
| Error | Request failed safely. | Show recoverable reason and action. |
| Permission denied | User lacks access. | Explain access requirement. |
| Plan limit | User hit a server-side limit. | Show current plan, required plan, and upgrade path. |
| Success | Backend confirmed completion. | Show next action. |

## Current Implementation

`Workspace.tsx` includes `StateBlock` for project and build views. New views should use shared state components rather than bespoke empty/error copy.
