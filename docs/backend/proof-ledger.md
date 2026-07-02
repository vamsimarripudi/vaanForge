# Proof Ledger

VaanForge proof records provide tamper-evident metadata for critical product events.

## Supported Events

- Blueprint approved
- Agent output finalized
- Generated file approved
- Deployment released
- Invoice issued
- Marketplace app published
- Legal policy accepted
- Release notes published

## Storage Rules

Proof records store only:

- SHA-256 hashes
- event metadata
- entity references
- verification status
- provider transaction ID when a real provider exists

Proof records must never store customer data, source code, uploaded files, secrets, private prompts, or provider keys.

## Providers

Current provider: `local`

The local provider stores proof metadata in the application ledger and verifies hash format and record integrity. It does not claim an on-chain transaction and does not fabricate transaction IDs.

Future provider: blockchain adapter interface

Any future blockchain adapter must implement the same `ProofProvider` contract and return a real transaction ID only after successful provider confirmation.
