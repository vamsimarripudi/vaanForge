# VaanForge Navigation Architecture

Owner: KRAVIA PRIVATE LIMITED  
Product: VaanForge

This document defines the subdomain-aware navigation, route guard, redirect behavior, and page shell foundation for VaanForge. Full feature pages are intentionally not implemented in this layer.

## Page Shell Model

Every official VaanForge subdomain maps to one page shell definition in `frontend/src/app/domainShells.tsx`.

Each Page shell includes:

- Product title
- Page title
- Description
- Canonical URL
- Robots policy
- OpenGraph metadata where public
- Guard requirement
- Navigation items
- Default route
- Shared state rendering

Private, admin, internal, file, and API-like surfaces use `noindex,nofollow`.

## Route Guard System

Route guard types:

- `public`: visible without login
- `authenticated`: requires a signed-in user
- `workspace_member`: requires workspace membership
- `billing_required`: requires an active billing plan
- `developer_access`: requires developer access
- `admin_access`: requires admin or super-admin role
- `super_admin_access`: requires super-admin role
- `support_access`: requires support/customer-support permission
- `internal_service`: reserved for API, webhook, event, upload, or asset ingress

Users must not see navigation items they cannot access. API, webhook, event, upload, and asset domains are not treated as normal frontend pages.

## Redirect Behavior

| Condition | Behavior |
| --- | --- |
| Unauthenticated user opens protected shell | Redirect to `auth.vaanforge.com/login` |
| Authenticated user opens auth shell | Redirect to `app.vaanforge.com` |
| Billing required and inactive | Redirect to `plans.vaanforge.com/upgrade` |
| Permission denied | Show Permission denied state |
| Plan limit reached | Show Plan limit state with upgrade action |
| Unknown subdomain | No shell match; production should route to `vaanforge.com` or 404 |
| API/webhook/event domains | Show not-found/internal ingress state if reached in browser |

## Shared States

Every shell supports:

- Loading
- Empty
- Error
- Permission Denied
- Plan Limit Reached
- Not Found
- Maintenance
- Offline
- Session Expired

Each state has a title, explanation, primary action, and secondary action where useful.

## Subdomain-aware navigation

### app.vaanforge.com

- Projects
- Factory
- Agents
- Deployments
- Docs
- Support
- Settings

### profile.vaanforge.com

- Overview
- Personal Info
- Security
- Sessions
- Usage
- Plan
- API Keys
- Notifications
- Activity

### settings.vaanforge.com

- Account
- Workspace
- Team
- Billing
- Usage
- API Keys
- AI Preferences
- Notifications
- Security
- Data & Privacy
- Integrations
- Developer
- Support

### support.vaanforge.com

- Dashboard
- My Tickets
- Create Ticket
- Knowledge Base
- Announcements
- System Status
- Contact Support

### admin.vaanforge.com

- Dashboard
- Users
- Workspaces
- Billing
- Support
- Agents
- Marketplace
- Deployments
- Audit
- Security
- Operations
- Settings

### developers.vaanforge.com

- Overview
- Apps
- API Keys
- Webhooks
- SDKs
- Docs
- Usage

### marketplace.vaanforge.com

- Browse
- Installed
- Publisher
- Reviews
- Categories

### plans.vaanforge.com

- Pricing
- Compare
- Checkout
- Billing Help
- Terms

## Environment-Aware URLs

Shell links use the central frontend helper `shellUrl(...)` and `DOMAIN_URLS`. Values come from `VITE_VAANFORGE_*` environment variables and fall back to the approved `vaanforge.com` domain shape only inside the central helper.

Do not hardcode cross-subdomain URLs inside page components.

## Validation

The shell layer is covered by `scripts/qa-subdomain-shells-contract.js`, which validates:

- Every official domain has a shell definition
- Every route guard exists
- Every shared state exists
- Redirect behavior evidence exists
- Domain helper URL generation exists
- Metadata is configured
- Navigation documentation is synchronized
