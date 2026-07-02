# Marketplace Architecture

The KRAVIA App Marketplace lets developers and partners publish apps, plugins, templates, workflow automations, integrations, and agent extensions.

## Flow

```mermaid
flowchart LR
  Publisher["Publisher"] --> Draft["Draft App"]
  Draft --> Version["Immutable Version"]
  Version --> Reviews["Security / Code / Permission / Manual Reviews"]
  Reviews --> Published["Published Listing"]
  Published --> Consent["Workspace Permission Consent"]
  Consent --> Install["Install"]
  Install --> Update["Update / Rollback"]
```

## Rules

- No app is listed before review approval.
- App versions are immutable.
- Installs require permission consent.
- Paid installs connect to billing usage and payout metadata.
- Review, install, update, uninstall, and rollback actions are audited.

