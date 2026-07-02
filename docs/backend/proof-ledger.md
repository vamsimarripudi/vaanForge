# Proof Ledger

The proof ledger stores only hashes and metadata.

It must never store:

- source code
- customer data
- secrets
- private files
- raw invoices

If no blockchain provider is configured, records use `local-ledger` provider mode. This is intentional and avoids fake blockchain transaction claims.
