# taste-skill

Self-hosted personalized coding preferences for Claude Code, OpenAI Codex, Cursor, and any [skills-compatible](https://skills.sh) AI agent.

No subscriptions. No cloud dependency. Your preferences live in your repo.

## How it works

```
Claude Code ──── POST suggestion ────▶ Review Server (localhost:3247)
     ▲                                        │
     └──── reads .taste/profile.md ◀──────────┘ (accept / discard)
```

1. Claude notices a style decision not in your profile → sends it to the local server
2. You review it in a web UI and click **Accept** or **Discard**
3. Accepted rules are saved to `.taste/profile.md`
4. Claude applies them on every future task

## Install

```bash
npx skills add gmpravin/taste-skill
```

Or clone directly:

```bash
git clone https://github.com/gmpravin/taste-skill
cd taste-skill && npm install
```

## Quick start

```bash
# 1. Generate initial profile from your codebase
npx taste-skill init

# 2. Start the review server
npx taste-skill serve

# 3. Open the review dashboard
open http://localhost:3247
```

## Training mode

In your Claude Code session, say:

```
taste train
```

Claude will walk you through each section (naming, patterns, testing, imports…), scan your codebase for existing patterns, and send suggestions to the review server for you to accept or discard.

## Profile format

Your preferences live in `.taste/profile.md`. Copy the template from `skills/taste/references/taste-template.md` as a starting point, or let `npx taste-skill init` generate it.

Example:

```markdown
## Naming
- Variables/functions: camelCase
- Components: PascalCase

## Patterns
- Components: arrow function
- State: Zustand
```

## API

The review server exposes a simple REST API:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/suggest` | Send a suggestion (from Claude) |
| GET | `/api/pending` | List pending suggestions |
| POST | `/api/accept/:id` | Accept → adds to profile.md |
| POST | `/api/discard/:id` | Discard → adds to rejected.md |
| GET | `/api/profile` | Read current profile |
| GET | `/api/rejected` | Read rejected rules |

## Files created

```
.taste/
  profile.md    ← accepted rules (Claude reads this)
  rejected.md   ← discarded rules (Claude never re-suggests these)
  pending.json  ← survives server restarts
```

Add `.taste/pending.json` to `.gitignore`. Commit `profile.md` to share preferences with your team.

## License

MIT
