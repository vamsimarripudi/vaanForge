# FAQ

## Is VaanForge a chatbot?

No. VaanForge is a governed AI software factory. It uses agents, but the product is organized around structured inputs, persisted outputs, approvals, validations, deployment controls, and operations evidence.

## Is the repository production-launched?

The repository contains production-oriented modules and validation gates. External launch status depends on environment configuration, credentials, infrastructure, compliance review, and KRAVIA PVT LTD approval.

## Can VaanForge use different AI providers?

Yes. The architecture keeps provider integration abstract so OpenAI, local LLMs, and future KRAVIA-controlled providers can sit behind the same boundary.

## Are marketplace listings seeded as fake data?

No. The marketplace is database-driven. Apps become installable only after reviewed versions are published.

## Which command checks the whole repository?

Use `npm.cmd run test:e2e` for contract coverage, then `npm.cmd run build` for production build validation.

