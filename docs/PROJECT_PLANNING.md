# Project planning and CPM

Open **Projects** in the authenticated navigation at http://localhost:8040.
Create a project with its name, description and start date. The project has four sections:

- **Overview:** edit project details, view the summary, open the network or delete an owned project.
- **Activities:** create/edit/delete activities, select multiple immediate predecessors, set decimal durations, status, optional dates, requirements and assignments.
- **Network / CPM:** scrollable SVG from START through the activities to FINISH, with ES/EF/LS/LF/float in every activity node and in an accessible table. Green nodes and arrows identify critical work. Both branching and merging are supported.
- **Team:** add/edit/remove members or preview and import CSV/JSON.

Durations and CPM offsets are in days. Day zero is the project start date. Optional activity dates and status are metadata; they do not constrain CPM or exclude weekends. Float totals sum individual activity allowances and are not an extension of the project duration.

## Team and access

The owner and members whose role is **Project Manager** can change project details, activities, assignments and the team. Only the owner can delete the project. Other members have read access after signing in with their listed email. Membership does not create an account or send an invitation. Existing JWT authentication is used on every project endpoint; all lookups are scoped to ownership or team email.

The existing application has no organization directory. Team members are therefore stored per project, with name, email, role and skills. Existing task ownership and Task APIs are unchanged.

In Activities, **Auto Assign** previews suggestions for unassigned work. Exact role/skill phrases are scored against required role/skills and activity title/description. Ties prefer the least assigned member, then a stable member ID. No matching member leaves the activity unassigned. Existing assignments are preserved. Review/change the dropdowns, then choose **Apply assignments**. You can also change assignments in the activity editor.

### CSV example

```csv
name,email,role,skills
Arun,arun@example.com,Developer,"React,Node.js,MongoDB"
Maya,maya@example.com,Designer,Figma;Illustration
```

### JSON example

```json
[
  { "name": "Arun", "email": "arun@example.com", "role": "Developer", "skills": ["React", "Node.js", "MongoDB"] }
]
```

Imports are previewed before saving and validated atomically. Duplicate emails are rejected. Removing a member clears their assignments. CSV quoted commas, escaped quotes and CRLF are supported. TXT is not implemented; the parser is isolated in `client/src/utils/memberImport.js` for extension.

## CPM and limits

The backend uses topological ordering, a forward pass (maximum predecessor EF), and a backward pass (minimum successor LS). Terminal LF is the project duration. Critical edges require both critical endpoints and matching predecessor EF/successor ES, avoiding false critical shortcut edges. Floating-point noise is normalized without integer rounding.

IDs must be unique within a project and use 1–40 letters, numbers, hyphens or underscores; START/FINISH are reserved. IDs are stable after creation. Invalid IDs/durations, missing or duplicate predecessors, cycles and disconnected activity components are rejected. A single activity and an empty draft are allowed. Multiple roots/terminals must belong to one connected activity network. Remove successor references before deleting an activity.

Limits: 200 activities and 200 members per project; import files below 100 KB; existing API JSON limit of 100 KB. The graph and exact path count include **all** critical paths. For exponentially branching networks, the text preview lists the first 1,000. No graph or AI dependency was added.

## API

All endpoints use `/api/projects` with the existing Bearer JWT:

- `GET /`, `POST /`: list accessible projects, create an owned project.
- `GET /:id`, `PUT /:id`, `DELETE /:id`: project detail plus CPM, metadata edit, owner deletion.
- `POST /:id/activities`, `PUT /:id/activities/:activityId`, `DELETE /:id/activities/:activityId`: activity CRUD.
- `PUT /:id/activities`: atomically replace the whole graph with `{ "activities": [...] }`, including complete multi-root networks.
- `POST /:id/members`: add one member or import `{ "members": [...] }`.
- `PUT /:id/members/:memberId`, `DELETE /:id/members/:memberId`: member edit/removal.
- `POST /:id/auto-assign`: preview suggestions without changing assignments.
- `PUT /:id/assignments`: apply reviewed `{ "assignments": [{ "activityId": "A", "memberId": "..." }] }`.

Activities and members are embedded Mongoose schemas on Project, keeping graph changes atomic. Optimistic concurrency rejects overlapping writes rather than silently losing edits.

## Verification

```powershell
# MongoDB must be available (the existing Docker mongo service is sufficient).
$env:TEST_MONGO_URI = 'mongodb://127.0.0.1:27017'
$env:NODE_ENV = 'test'
pnpm test
pnpm build
```

The integration suite uses a uniquely named `prodpilot_test_*` database and removes only that test database after the run. Without `TEST_MONGO_URI`, it skips database integration tests while still running unit/health tests.

Verified reference results:

- A=4; B=3 after A; C=6 after A; D=5 after B; E=2 after C; F=4 after D,E: duration **16**, paths **A → B → D → F** and **A → C → E → F**. All floats are zero.
- A=2.5; B=3.5 after A; C=1.25 after A; D=2.75 after B,C: duration **8.75**, path **A → B → D**. C has ES=2.5, EF=3.75, LS=4.75, LF=6, float=**2.25**.

Tests cover graph validation, zero-duration work, multiple roots/terminals, non-tight critical-node edges, exact path counting, import parsing, deterministic assignment, JWT login, project CRUD/access controls, activity/member changes and existing Task API operations.

Implementation verification: all 21 tests passed with MongoDB integration enabled; the Vite production build and Docker build/start succeeded. Browser checks on port 8040 exercised registration/login, project creation, six activities with branching/merging predecessors, both highlighted reference critical paths, member creation, reviewed auto-assignment, manual assignment, decimal edits, visible cycle rejection, task creation/completion and Dashboard progress. A phone-width check confirmed contained horizontal graph scrolling and responsive navigation/cards. Temporary browser fixtures and integration databases were removed afterward.

## Changed files

- Backend: `server/src/app.js`; new `models/Project.js`, `routes/projectRoutes.js`, `controllers/projectController.js`, `services/cpm.js`, `services/assignment.js` under `server/src`.
- Frontend: `client/src/App.jsx`, `components/AppLayout.jsx`, `styles.css`; new `pages/ProjectsPage.jsx`, `components/ProjectForm.jsx`, `components/CPMNetwork.jsx`, `utils/memberImport.js` under `client/src`.
- Tests: `server/tests/cpm.test.js`, `server/tests/projects.integration.test.js`.
- Documentation: `README.md`, this file.
