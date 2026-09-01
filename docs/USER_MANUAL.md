# ProdPilot user manual

## Create an account

1. Open the application.
2. Choose **Create an account**.
3. Enter your name, email address, and a password containing at least 8 characters.
4. Select **Create account**. You are signed in automatically.

## Add a task

1. Choose **New task** from the dashboard or tasks page.
2. Enter a short task title. Add a description, priority, and due date if useful.
3. Select **Add task**.

## Complete, edit, or delete a task

- Select the empty square next to a task to complete it. Select it again to mark it pending.
- On **My tasks**, select **Edit** to change its details, then select **Save changes**.
- Select **Delete** and confirm only when you no longer need the task; deletion cannot be undone.

## Track progress

The dashboard shows total, pending, and completed task counts plus a completion percentage. **My tasks** has **All**, **Pending**, and **Completed** tabs to focus your view.

## If something goes wrong

- Check your email/password and try signing in again.
- A missing or stopped API will show an error instead of silently losing data. If using Docker, check `docker compose ps` and `docker compose logs server`.
- Your account data and tasks remain separate from other users’ data.
