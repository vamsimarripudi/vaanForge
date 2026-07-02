# Prompt Injection Defense

VaanForge treats user-provided prompts, templates, tickets, uploaded text, memory entries, and agent handoffs as untrusted input.

## Protected Sources

- project prompts
- uploaded documents
- marketplace templates
- support tickets
- knowledge base entries
- memory entries
- agent handoffs

## Current Scanner

The current implementation uses deterministic rules for:

- instruction override attempts
- hidden prompt extraction
- tool exfiltration requests
- role confusion and bypass attempts

This is intentionally described as a deterministic scanner, not a trained ML model.

## Outcomes

- `allowed`
- `review_required`
- `quarantined`

Risky input is stored as a prompt risk event and creates a security event for admin review.
