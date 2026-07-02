# Executive Dashboard

The executive dashboard is the internal control center for running VaanForge as a commercial SaaS business.

## Route

- `admin.vaanforge.com/executive`

## API

- `GET /api/v1/admin/executive`
- `GET /api/v1/admin/business/executive`

## Metrics

- MRR and ARR from active paid subscriptions and billing plans
- active, free, and paid users from subscription records
- conversion and churn from subscription status
- AI credit consumption from usage events
- infrastructure cost estimate from provider and infrastructure cost events
- API usage from developer API usage logs
- deployment success from deployment records
- support and incident counts from support and operations records
- marketplace and partner revenue from revenue event tables

Every metric includes a source map in the API response. No chart should be rendered without backend data.
