# AI Cost Management

AI cost management records provider usage and maps it to workspace, project, and agent cost.

## Providers

- OpenAI
- Gemini
- Claude
- Groq
- Hugging Face
- Other

## Tracked Fields

- requests
- input/output tokens
- latency
- errors
- estimated cost
- credits consumed
- workspace/project/agent links

## APIs

- `GET /api/v1/admin/business/ai-costs`
- `POST /api/v1/admin/business/ai-costs`

Costs are estimated from recorded provider events. VaanForge does not infer provider invoices unless provider billing integration is connected.
