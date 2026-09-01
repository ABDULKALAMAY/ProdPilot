# ProdPilot API reference

Base URL during local development: `http://localhost:5000/api`

All API responses are JSON. Protected task endpoints require this header:

```http
Authorization: Bearer <token>
```

## Authentication

| Method | Endpoint | Description | Success |
| --- | --- | --- | --- |
| POST | `/auth/register` | Create a user account | `201 Created` |
| POST | `/auth/login` | Sign in with email and password | `200 OK` |

### Register request

```json
{
  "name": "Abdulkalam",
  "email": "abdul@example.com",
  "password": "at-least-8-characters"
}
```

Both register and login return:

```json
{
  "token": "a-jwt-token",
  "user": {
    "id": "mongodb-id",
    "name": "Abdulkalam",
    "email": "abdul@example.com"
  }
}
```

## Tasks

| Method | Endpoint | Description | Success |
| --- | --- | --- | --- |
| GET | `/tasks` | List the signed-in user’s tasks | `200 OK` |
| GET | `/tasks?status=pending` | List only pending tasks | `200 OK` |
| GET | `/tasks?status=completed` | List only completed tasks | `200 OK` |
| GET | `/tasks/:id` | Get one task | `200 OK` |
| POST | `/tasks` | Create a task | `201 Created` |
| PUT | `/tasks/:id` | Edit a task or change completion | `200 OK` |
| DELETE | `/tasks/:id` | Delete a task | `204 No Content` |

### Create or update task body

```json
{
  "title": "Prepare sprint demo",
  "description": "Show login and task completion flow",
  "priority": "high",
  "dueDate": "2026-09-01",
  "completed": false
}
```

`title` is required when creating a task. `priority` must be `low`, `medium`, or `high`; the default is `medium`. `description` and `dueDate` are optional.

## Errors

The API returns an appropriate HTTP status and a readable `message`, for example:

```json
{ "message": "Authentication is required." }
```

Common statuses: `400` invalid data, `401` not signed in/invalid token, `404` missing resource, `409` duplicate account, and `500` server error.
