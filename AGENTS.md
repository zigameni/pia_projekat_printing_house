## Purpose

This project uses a persistent Markdown conversation log to prevent loss of context when the AI coding session is reset, compacted, or restarted.

The conversation log is the persistent memory of the coding agent.

**You MUST read it before doing meaningful work and MUST update it after every user/assistant interaction that affects the project.**

Do not rely solely on the current chat/session history.

---

# 1. Persistent Conversation Log

The canonical conversation history is:

```text
CONVERSATION_LOG.md
```

If this file does not exist, create it immediately.

The file must contain a chronological record of the conversation between the user and the AI coding agent.

It should contain:

* User messages
* Assistant messages
* Important decisions
* Requirements
* Changes requested
* Changes completed
* Problems discovered
* Errors encountered
* Current objectives
* Important technical context
* Open questions
* Things that must NOT be changed
* Relevant implementation details

The log is not optional.

---

# 2. Start-of-Task Procedure

At the beginning of EVERY task, before modifying files:

### Step 1 — Read the conversation log

Read:

```text
CONVERSATION_LOG.md
```

Do this even if the current conversation appears to contain enough context.

### Step 2 — Determine the current state

From the log, identify:

1. What are we currently building?
2. What was the user's most recent objective?
3. What has already been implemented?
4. What decisions have already been made?
5. What remains unfinished?
6. Are there constraints or rules that must be respected?
7. What was the last known state of the project?

### Step 3 — Inspect the project when necessary

Do not assume the log perfectly describes the current code.

When needed, inspect the relevant files and compare the actual project state with the log.

### Step 4 — Continue from the existing objective

Do NOT start a new interpretation of the project simply because the current session is new.

A session reset does not mean the project has a new objective.

---

# 3. Conversation Logging

After EVERY user message, record the user's message in:

```text
CONVERSATION_LOG.md
```

After EVERY assistant response, record the assistant's response in the same file.

The log should preserve the conversation in chronological order.

Use this format:

```markdown
## [YYYY-MM-DD HH:MM]

### USER

<User's message>

### ASSISTANT

<Assistant's response>
```

For example:

```markdown
## 2026-09-10 09:30

### USER

Make the login page use a dark theme.

### ASSISTANT

I will update the login page styling to use the existing dark theme tokens without changing the authentication logic.
```

Do not intentionally omit relevant conversation content.

---

# 4. Important Context Summary

In addition to the chronological conversation, maintain a concise current-state section near the top of `CONVERSATION_LOG.md`.

Use:

```markdown
# Current Project Context

## Current Objective

<What we are currently trying to accomplish>

## Current Task

<The immediate task being worked on>

## Completed

- <completed item>
- <completed item>

## In Progress

- <item currently being worked on>

## Pending

- <unfinished item>

## Important Decisions

- <decision>
- <decision>

## Constraints

- <constraint>
- <constraint>

## Do Not Change

- <thing that must remain unchanged>
- <thing that must remain unchanged>

## Known Problems

- <problem>
- <problem>

## Relevant Technical Context

- <important implementation detail>
- <architecture detail>
- <dependency detail>
```

Keep this section updated as the project evolves.

The summary is for quickly recovering context.

The chronological conversation below it is the detailed source of history.

---

# 5. The Log Is Persistent Memory

Treat `CONVERSATION_LOG.md` as persistent memory across sessions.

If the AI session appears to have restarted:

1. Do not assume previous work is forgotten.
2. Read `CONVERSATION_LOG.md`.
3. Recover the current objective.
4. Recover previous decisions.
5. Inspect the current code.
6. Continue the work.

Never tell the user that previous context is unavailable until you have checked the persistent log.

---

# 6. Never Guess Missing Context

If the conversation log contains information about a previous decision, requirement, implementation, or instruction, use that information.

Do not replace known information with assumptions.

If the log genuinely does not contain enough information to safely proceed, ask the user rather than making a potentially destructive assumption.

For example:

> "The project log says we decided to keep the existing authentication flow, but it doesn't specify whether the new screen should replace or extend the current settings page. Which should I do?"

Do NOT arbitrarily choose an interpretation when doing so could change the direction of the project.

---

# 7. Protect the User's Intent

The user's latest request should be interpreted in the context of the entire persistent conversation.

Do not treat each message as an isolated task.

For example, if earlier messages establish:

```text
We are migrating the project to PostgreSQL.
Do not modify the frontend.
```

and the next session begins with:

```text
Fix the database issue.
```

the agent must understand that "database issue" refers to the ongoing PostgreSQL migration and must not randomly modify the frontend.

---

# 8. Before Making Changes

Before editing code, determine:

```text
CURRENT OBJECTIVE
        ↓
CURRENT TASK
        ↓
RELEVANT EXISTING IMPLEMENTATION
        ↓
USER CONSTRAINTS
        ↓
PLANNED CHANGE
```

If the proposed change conflicts with an earlier decision recorded in the log, stop and resolve the conflict before making the change.

Do not silently override previous decisions.

---

# 9. After Making Changes

After modifying the project:

1. Verify what changed.
2. Test the relevant functionality when possible.
3. Record the changes in `CONVERSATION_LOG.md`.
4. Update the Current Project Context.
5. Record any errors or unresolved issues.
6. Record what should happen next.

For example:

```markdown
## Latest Implementation State

- Updated `src/auth/login.ts`
- Added validation for empty email addresses
- Existing authentication API was left unchanged
- Tests pass
- Password reset flow remains untouched

## Next Step

Investigate the mobile layout of the login form.
```

---

# 10. Do Not Rewrite History

The chronological conversation history should be append-only.

Do not rewrite old conversation entries merely to make them cleaner.

If something previously recorded becomes incorrect, preserve the original entry and add a correction:

```markdown
## Correction

The previous implementation used X. This was changed to Y on 2026-09-10 because the user requested Y.
```

The history should remain useful for reconstructing what happened.

---

# 11. Keep the Log Manageable

The conversation log should contain the conversation, but it should also remain practical to read.

Do NOT endlessly duplicate large generated files, source code, or entire command outputs into the log.

Instead, record concise summaries when appropriate.

For example, instead of copying a 500-line build output:

```markdown
### ASSISTANT

Build completed successfully.

Relevant result:
- TypeScript compilation passed
- 0 errors
- 3 existing warnings
```

However, preserve the actual user's requests and the assistant's substantive responses.

---

# 12. Tool and Command Results

When tools, shell commands, tests, or builds are used, record their meaningful results.

Example:

```markdown
### Implementation Result

Command:
`npm test`

Result:
- 42 tests passed
- 0 failed

Files changed:
- `src/components/Login.tsx`
- `src/styles/login.css`
```

Do not clutter the log with irrelevant output.

---

# 13. Session Recovery Protocol

If you detect that the current session lacks context, immediately perform:

```text
READ CONVERSATION_LOG.md
        ↓
READ CURRENT PROJECT CONTEXT
        ↓
READ RECENT CONVERSATION ENTRIES
        ↓
INSPECT RELEVANT PROJECT FILES
        ↓
RECONSTRUCT CURRENT OBJECTIVE
        ↓
CONTINUE
```

Do not start making unrelated changes.

Do not "clean up" the project simply because the previous session is unavailable.

Do not redesign existing functionality unless explicitly requested.

---

# 14. When the User Changes Direction

If the user explicitly changes the project direction, record the change.

Example:

```markdown
## Decision Change

Previous direction:
- Use REST API

New direction:
- Use GraphQL

Reason:
- User requested the architecture change.
```

The new direction becomes the current objective.

Do not continue following obsolete instructions when the user has explicitly superseded them.

---

# 15. Conflicting Instructions

Use this priority order:

1. The user's latest explicit instruction
2. Earlier explicit user decisions that have not been superseded
3. This `AGENTS.md`
4. Existing project conventions
5. Your own assumptions

If instructions conflict, do not silently choose a potentially destructive interpretation.

Explain the conflict and ask for clarification when necessary.

---

# 16. Avoid Unrelated Changes

When recovering from a reset, be especially conservative.

Only modify files relevant to the current objective.

Do NOT:

* Refactor unrelated code
* Rename unrelated files
* Change architecture without authorization
* Upgrade dependencies without authorization
* Rewrite working code unnecessarily
* Change styling unrelated to the request
* "Improve" things merely because you think they could be better

The goal is to continue the user's work, not restart the project.

---

# 17. Conversation Log Integrity

Before finishing a task, verify that:

* The latest user request is recorded.
* The assistant's response/action is recorded.
* The current objective is accurate.
* Completed work is recorded.
* Pending work is recorded.
* Important decisions are recorded.
* Known problems are recorded.
* The next logical step is clear.

The next AI session should be able to open `CONVERSATION_LOG.md` and understand what is happening without relying on the previous AI session.

---

# 18. If CONVERSATION_LOG.md Is Missing or Corrupted

If the file does not exist:

1. Create it.
2. Add the current project context.
3. Record the current user request.
4. Continue the task.

If the file exists but appears incomplete:

1. Do not delete it.
2. Preserve what exists.
3. Reconstruct missing context from the current conversation and project files where possible.
4. Clearly mark reconstructed information as reconstructed.

Example:

```markdown
## Reconstructed Context

The previous session appears to have ended unexpectedly.
The following context was reconstructed from the current project files.
```

---

# 19. Critical Rule

**NEVER make a substantial project change immediately after a session reset without first reading `CONVERSATION_LOG.md`.**

The persistent log exists specifically to prevent context loss.

When in doubt:

> Read the log first. Inspect the project second. Change code third.

---

# 20. End-of-Response Checklist

Before finishing each meaningful response, internally verify:

```text
[ ] Did I understand the current objective?
[ ] Did I use the persistent conversation log?
[ ] Did I avoid unrelated changes?
[ ] Did I preserve previous decisions?
[ ] Did I record the user's request?
[ ] Did I record my response/action?
[ ] Did I update the current project context?
[ ] Did I record important implementation results?
[ ] Did I record unfinished work?
[ ] Could a completely new AI session continue from the log?
```

If the answer to any applicable item is "no", fix the log before finishing.
