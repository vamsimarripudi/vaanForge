# VaanForge Pricing

Pricing and limits are backend-owned. The frontend must not hardcode entitlement decisions.

| Plan | Price | Projects | Users | AI Credits | Storage | Deployments |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Free | ₹0 | 1 active | 1 | 500/month | 1 GB | 5/month |
| Creator | ₹999/month | 10 | 1 | 5,000/month | 10 GB | configured |
| Professional | ₹2,999/month | 50 | 5 | 25,000/month | 100 GB | configured |
| Studio | ₹7,999/month | 250 | 25 | 100,000/month | 500 GB | configured |
| Business | ₹19,999/month | unlimited | 100 | 500,000/month | 2 TB | configured |
| Enterprise | Custom | contract | contract | contract | contract | contract |

When a limit is exceeded, VaanForge blocks safely, shows the current plan, shows the required plan, provides an upgrade action, and logs a usage event.

