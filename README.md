# ProdPilot

ProdPilot is a beginner-friendly full-stack productivity application built for an **Agile Development Process and DevOps** course. It lets each user securely manage daily tasks, set priorities and due dates, complete work, and see their overall progress.

![ProdPilot architecture](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20MongoDB-465fff)

## Team

| Member | Role | Main responsibility |
| --- | --- | --- |
| Abdulkalam | Project Lead & DevOps Engineer | Git, Docker, CI/CD, deployment, final integration, documentation |
| Dinesh | Frontend Developer | React UI, responsive design, dashboard, task pages |
| Harshid Giriver | Backend Developer | Express, MongoDB, REST API, authentication, task CRUD |

## Features

- Account registration and JWT-based login
- Private task lists: users can access only their own tasks
- Create, edit, delete, and mark tasks completed
- Priority and optional due dates
- Pending/completed task filters
- Live task progress dashboard
- Backend input validation and clear error messages
- Docker Compose development/demo stack
- GitHub Actions build, test, and Docker image checks

## Architecture

```text
Browser (React + Vite/Nginx)
            |
            | HTTP / JSON + JWT
            v
Express API (Node.js) ---- Mongoose ---- MongoDB
            |
      GitHub Actions
  (tests, build, Docker build)
```

The client deliberately contains presentation and API-call logic only. The server owns authentication, validation, task ownership rules, and database access. This separation keeps the work easy to divide across the team and reduces merge conflicts.

## Project structure

```text
ProdPilot/
├── client/                 # React user interface (Dinesh)
│   ├── src/components/     # Reusable UI components
│   ├── src/pages/          # Login, register, dashboard, task pages
│   └── Dockerfile
├── server/                 # Express API (Harshid Giriver)
│   ├── src/models/         # User and Task MongoDB schemas
│   ├── src/controllers/    # Authentication and task logic
│   ├── src/routes/         # REST endpoint definitions
│   └── Dockerfile
├── .github/workflows/      # Continuous integration
├── docs/                   # Agile, API, and deployment evidence
├── docker-compose.yml
└── README.md
```

## Quick start — Docker (recommended)

Docker packages the application and MongoDB into isolated containers. This means every team member runs the same versions without manually installing Node or MongoDB.

- An **image** is the reusable package of software instructions.
- A **container** is a running instance of that image.
- **Docker Compose** starts the React app, API, and MongoDB together and lets them communicate on a private network.

1. Copy the safe example environment file and choose a non-public secret:

   ```bash
   cp .env.example .env
   # Edit .env and replace JWT_SECRET with a long random value
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env` instead.

2. Build and start the three services:

   ```bash
   docker compose up --build
   ```

3. Open [http://localhost:8040](http://localhost:8040). The API health endpoint is [http://localhost:5000/api/health](http://localhost:5000/api/health).

4. Stop containers with `docker compose down`. MongoDB data remains in its named volume. To remove the database too (only if you intend to lose local data), run `docker compose down -v`.

## Project planning and CPM

The authenticated **Projects** page includes project activities, team roles/skills, manual assignment, reviewable deterministic auto-assignment, CSV/JSON team import, and a critical-path SVG network. See [Project planning documentation](docs/PROJECT_PLANNING.md) for usage, API endpoints, limits, and tested CPM examples.

## Quick start — local development

Use this route when Node.js 22+ and MongoDB are installed locally.

1. Install pnpm once. pnpm is the project’s package manager; it respects the exact versions stored in `pnpm-lock.yaml`:

   ```bash
   npm install -g pnpm@11.19.0
   ```

2. Install all workspace dependencies from the repository root:

   ```bash
   pnpm install
   ```

3. Create your server configuration:

   ```bash
   cp server/.env.example server/.env
   ```

   Set `JWT_SECRET` to a long random string. Keep `MONGO_URI=mongodb://127.0.0.1:27017/prodpilot` if MongoDB is running locally.

4. Start MongoDB, then start the client and server together:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:5173](http://localhost:5173). Vite forwards `/api` requests to the API at port `5000` during development.

## Verify the project

```bash
pnpm test         # API smoke tests
pnpm build        # production React build
docker compose build
```

## REST API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Receive JWT token |
| GET | `/api/tasks` | Get the current user’s tasks |
| GET | `/api/tasks/:id` | Get one task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task / mark complete |
| DELETE | `/api/tasks/:id` | Delete a task |

See [docs/API.md](docs/API.md) for request examples, response formats, and status codes.

## Data design

### User

| Field | Reason |
| --- | --- |
| `name` | Personal greeting and account identity |
| `email` | Unique sign-in identifier |
| `password` | Stored only as a bcrypt hash, never plain text |
| timestamps | Supports future audit/history features |

### Task

| Field | Reason |
| --- | --- |
| `title` | Required, clear description of work |
| `description` | Optional supporting detail |
| `priority` | Helps users focus (low/medium/high) |
| `dueDate` | Optional planning deadline |
| `completed`, `completedAt` | Progress tracking and completion history |
| `user` | MongoDB relationship that makes tasks private to their owner |

## Git workflow

The repository uses a simplified industry workflow:

```text
feature/your-feature  →  develop  →  main
       PR + review        final release PR
```

Do not commit directly to `main`. Start each task from the current `develop` branch:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/short-feature-name
git add .
git commit -m "feat: add task filter"
git push -u origin feature/short-feature-name
```

Open a pull request to `develop`, request review, and merge only after the CI check passes. More Agile evidence is available in [docs/AGILE.md](docs/AGILE.md).

## CI/CD explanation

Every push or pull request to `develop` or `main` runs the GitHub Actions workflow. It:

1. Checks out the code.
2. Installs the exact dependencies in `pnpm-lock.yaml`.
3. Runs API smoke tests.
4. Builds the React production bundle.
5. Builds both Docker images.

This is Continuous Integration: mistakes are discovered before merging. The included deployment workflow adds Continuous Delivery: after CI succeeds on `main`, it connects to EC2 and rebuilds the Docker stack. Configure the three GitHub secrets described in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) before using it.

## Documentation map

- [API reference](docs/API.md)
- [Agile artifacts](docs/AGILE.md)
- [AWS EC2 deployment guide](docs/DEPLOYMENT.md)

## Suggested demonstration flow

1. Register a new user.
2. Add a high-priority task with a due date.
3. Create another task, then edit its title.
4. Mark the first task complete and point out the dashboard progress change.
5. Open the Completed filter.
6. Show `docker compose ps`, GitHub Actions, and Agile artifacts to connect the app to DevOps and Agile requirements.

## Security notes

- Secrets are provided through `.env` files and excluded from Git.
- Passwords are salted and hashed with bcrypt.
- Authentication uses time-limited JWTs.
- Task routes verify the signed-in user before reading or changing data.
- Both client and server validate user inputs.

Before public deployment, add HTTPS, use a managed database with backups, restrict CORS to the public frontend URL, and store secrets in the platform’s secret manager.
