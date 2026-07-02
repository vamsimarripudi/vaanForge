# Notification Center

Notifications are unified across billing, projects, agents, deployments, marketplace, support, security, announcements, and system events.

## Actions

- Read
- Mark all read
- Archive
- Filter by read state
- Filter by source
- Open related deep link

## APIs

- `GET /api/v1/notifications`
- `POST /api/v1/notifications/read-all`
- `PATCH /api/v1/notifications/:notificationId/read`
- `POST /api/v1/notifications/:notificationId/archive`

Notification creation may publish realtime updates and optional SMS when enabled.
