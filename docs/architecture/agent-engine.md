# Agent Engine

The agent engine converts requirements into blueprints and approved blueprints into executable work.

## Components

- Requirement parser
- Blueprint generator
- Task graph engine
- Code generation service
- File writer and diff review service
- Validation runner
- Repair loop
- Output storage
- Admin monitoring endpoints

## Rule

Completion is valid only after lint, type-check, tests, and build pass or the run is explicitly blocked/failed with evidence.

