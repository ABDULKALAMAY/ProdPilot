# Agile artifacts — ProdPilot

These lightweight artifacts show how the team can use Scrum while keeping the semester project achievable.

## Product vision

ProdPilot helps students and early-career professionals convert daily intentions into visible progress through a clean, secure, easy-to-use task workspace.

## Product backlog

| ID | User story | Priority | Estimate |
| --- | --- | --- | --- |
| PB-01 | As a new user, I want to create an account so that my tasks remain private. | Must | 5 |
| PB-02 | As a user, I want to sign in securely so that I can access my workspace. | Must | 5 |
| PB-03 | As a user, I want to create tasks with a title, priority, and due date. | Must | 5 |
| PB-04 | As a user, I want to edit or delete my tasks so that my plan stays accurate. | Must | 5 |
| PB-05 | As a user, I want to mark work complete so that I can track progress. | Must | 3 |
| PB-06 | As a user, I want separate pending and completed views so that I can focus. | Should | 3 |
| PB-07 | As a user, I want a progress dashboard so that I can see my achievements. | Should | 3 |
| PB-08 | As a developer, I want automated build and test checks so that broken changes are detected early. | Must | 5 |
| PB-09 | As a developer, I want Docker containers so that the app runs consistently. | Must | 5 |
| PB-10 | As a project lead, I want deployment instructions so that the project can be demonstrated online. | Should | 3 |

## Sprint plan

| Sprint | Goal | Backlog items | Owners | Definition of done |
| --- | --- | --- | --- | --- |
| 1 | Establish a secure foundation | PB-01, PB-02 | Harshid + Dinesh | Register/login work; code reviewed and merged to `develop`. |
| 2 | Deliver core task workflow | PB-03, PB-04, PB-05 | Harshid + Dinesh | User can create, edit, delete, and complete only their own tasks. |
| 3 | Finish product and delivery pipeline | PB-06 to PB-10 | All members | Dashboard, Docker, CI checks, documentation, and release review pass. |

## Sprint backlog example — Sprint 2

| Task | Owner | Estimate | Status |
| --- | --- | --- | --- |
| Create Task MongoDB schema | Harshid Giriver | 2h | Done |
| Build protected task REST endpoints | Harshid Giriver | 4h | Done |
| Create reusable task form | Dinesh | 3h | Done |
| Build task list and filters | Dinesh | 3h | Done |
| Integrate frontend and API | Dinesh + Harshid | 3h | Done |
| Review pull request and verify behavior | Abdulkalam | 2h | Done |

## Daily Scrum sample

| Member | Yesterday | Today | Blocker |
| --- | --- | --- | --- |
| Abdulkalam | Reviewed feature structure and README | Configure Docker and CI | Need final repository URL for deployment secrets |
| Dinesh | Completed task-list interface | Connect edit/delete actions | Waiting for task API response contract |
| Harshid Giriver | Implemented authentication | Finish task validation and API tests | None |

## Sprint review sample

The team demonstrated registration, login, adding a high-priority task, completing it, filtering completed tasks, and the dashboard progress percentage. The reviewer accepted the core task workflow and asked for a short deployment demonstration in the final sprint.

## Sprint retrospective sample

| Keep doing | Improve next sprint | Action |
| --- | --- | --- |
| Small feature branches and PR reviews reduced conflicts. | Share endpoint contracts earlier. | Backend adds API examples before frontend integration begins. |
| Daily 10-minute check-ins surfaced blockers quickly. | Test the full Docker stack before the final day. | Reserve one team session each week for integration testing. |

## Sample burndown data

Use this data in Excel/Google Sheets to make a line chart with **Day** on the horizontal axis and **remaining story points** on the vertical axis.

| Day | Ideal remaining | Actual remaining |
| --- | ---: | ---: |
| 1 | 24 | 24 |
| 2 | 21 | 22 |
| 3 | 18 | 18 |
| 4 | 15 | 15 |
| 5 | 12 | 13 |
| 6 | 9 | 8 |
| 7 | 6 | 5 |
| 8 | 3 | 2 |
| 9 | 0 | 0 |
