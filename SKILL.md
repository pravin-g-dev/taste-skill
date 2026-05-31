---
name: taste
description: Applies your personalized coding preferences from .taste/profile.md. Sends new style decisions to a local review server for accept/discard. Supports guided training sessions.
version: 1.0.0
author: gmpravin
license: MIT
---

# Taste — Personalized Coding Preferences

## When to Apply
Apply this skill on every task that involves writing, reviewing, or refactoring code.

---

## Toggle

- Enable for a project: `npx taste-skill on`
- Enable globally: `npx taste-skill on --global`
- Disable: `npx taste-skill off`

When enabled, a `SessionStart` hook automatically injects the profile into every Claude Code session — no manual invocation needed.

---

## Step 1 — Load Profile

When the profile is injected via the SessionStart hook, it is already active — skip to Step 2.

If the profile was NOT auto-injected (hook not set up yet):

1. Check if `.taste/profile.md` exists in the project root.
2. If it exists, read it in full and internalize every rule as a hard constraint.
3. If it does not exist, tell the user once:
   ```
   Taste profile not found. Run: npx taste-skill init
   Then enable auto-apply: npx taste-skill on
   ```
4. Check if `.taste/rejected.md` exists. Never suggest any rule listed there.

---

## Step 2 — Apply the Profile

When writing code, follow every rule in the profile **exactly**. This overrides your defaults.

Key sections to honour:
- **Naming**: variable style, component casing, file naming, constant casing
- **Code Style**: indentation, quotes, semicolons, trailing commas
- **Patterns**: component style (arrow vs class), state library, data fetching approach, error handling
- **Testing**: framework, describe/it vs test(), co-location preference
- **Imports**: ordering (external → internal → types), named vs default exports
- **Comments**: minimal style, JSDoc scope

---

## Step 3 — Surface New Suggestions (Passive Mode)

When you make a style/pattern decision **not already covered** by the profile:

1. Make the decision (proceed with the task — do not block).
2. Immediately POST the suggestion — no confirmation, no approval, fire and forget:

```
POST http://localhost:3247/api/suggest
Content-Type: application/json

{
  "rule": "<concise rule description>",
  "section": "<Naming | Code Style | Patterns | Testing | Imports | Comments>",
  "subsection": "<optional sub-category>",
  "example": "<one-line code example, if helpful>",
  "trigger": "passive",
  "source": "<brief context of what prompted this>"
}
```

3. If the server is unreachable, silently append to `.taste/pending-suggestions.md`:
   ```
   ## <section> — <concise rule>
   - Example: `<one-line code example>`
   - Source: <brief context>
   ```
4. Do NOT notify the user. Do NOT ask for approval. Send silently every time.

---

## Step 4 — Handle Explicit Corrections

When the user corrects your code mid-task (e.g. "use named exports", "don't use async/await here"):

1. Apply the correction immediately.
2. Silently POST it — no approval needed:
   - `"trigger": "explicit-correction"`
   - `"source": "User corrected: '<their words>'"`
3. If server unreachable, silently append to `.taste/pending-suggestions.md`.

---

## Step 5 — Training Session (Mode B)

Triggered when the user says any of: `taste train`, `/taste`, `train taste`, `train my taste`.

### Flow:

**Present section menu:**
```
Which sections would you like to train?
(Enter numbers comma-separated, or 'all')

  1. Naming conventions
  2. Component patterns
  3. State management
  4. Error handling
  5. Testing style
  6. Import conventions
  7. Comments & docs
```

**For each chosen section**, do ONE of:

a) **Scan the codebase** — look at 5–10 existing files, identify the dominant pattern, propose it as a rule and ask "Does this match your preference? (yes/no/other)"

b) **Ask a direct question** when no clear pattern exists:
   - Naming: "Do you prefer camelCase or snake_case for variables?"
   - Components: "Do you prefer arrow functions or function declarations for React components?"
   - Exports: "Named exports or default exports?"
   - Testing: "co-located test files (`foo.test.ts` next to `foo.ts`) or a separate `__tests__/` directory?"

c) **Show a binary choice** for ambiguous style:
   ```
   Which do you prefer?
   A:  const Foo = () => <div />
   B:  function Foo() { return <div /> }
   ```

**For each answer**: POST to `/api/suggest` with `"trigger": "training-session"` immediately — no approval, no confirmation.

**End of session:**
```
Training complete — N suggestions sent to http://localhost:3247

Review and accept/discard them to finalize your taste profile.
```

### Training rules:
- Ask one section at a time, wait for answer before moving to next
- Maximum 3 questions per section (don't over-ask)
- Skip sections already well-covered in the profile

---

## Step 6 — Review Server Status

If the server is unreachable when you try to POST:
- Continue the task silently
- At session end, remind once: `Taste server offline — run: npx taste-skill serve`

Do **not** ask the user to accept/discard within the terminal session. All review happens at http://localhost:3247.
