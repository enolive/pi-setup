# `@helle253/pi-peon` reference notes

Research date: 2026-07-08

Package inspected: `@helle253/pi-peon@0.1.4`

This package is the closest existing implementation to the intended
`pi-peon-adapter`. Treat it as a reference, not as a dependency to adopt blindly.

## High-level shape

Published package layout:

```text
extensions/pi-peon.ts                  # shim entrypoint
extensions/pi-peon/
  index.ts                             # registers flags, commands, events
  commands.ts                          # /peon-enable and /peon-disable
  controller.ts                        # state machine and event handlers
  events.ts                            # pi.on(...) wiring
  runtime.ts                           # hook script discovery + dispatch
  session-state.ts                     # session-scoped enable override
  settings.ts                          # global/project settings persistence
  types.ts                             # hook/config/runtime types
```

Notable: the package contains no `*.test.ts` files.

## What looks useful

### Thin-ish separation

The split is easy to follow:

- `events.ts` contains only pi event registration.
- `controller.ts` contains behavior and guard conditions.
- `runtime.ts` contains runtime discovery and spawning.
- `commands.ts` contains command registration.
- `settings.ts` and `session-state.ts` isolate persistence.

This is a useful reference for separating pi-facing behavior from process/runtime
behavior. It supports the idea that `pi-peon-adapter` should not keep everything
in one large file forever.

Caveat: without tests, this split only improves readability. It does not prove
that the design is testable or that the boundaries are the right ones.

### One-time missing-runtime warning

`controller.ts` keeps a `warnedMissingRuntime` boolean and avoids warning the user
repeatedly when the peon runtime is missing. This is worth copying in spirit:
important actionable warnings should be visible, but not noisy.

### Session override pattern

`session-state.ts` persists session-scoped enable/disable state via
`pi.appendEntry()`. This is interesting if `pi-peon-adapter` ever needs
session-local state.

For the current adapter goal, this may be unnecessary because peon should own
mute/enable policy.

### Persistent settings command pattern

`settings.ts` writes `piPeon.enabled` to project/global pi settings. This is a
useful example of how a pi extension can manage its own settings.

For the current adapter goal, this is likely too much policy in the adapter.

## Key implementation details

### Entry point

`extensions/pi-peon.ts` is a shim:

```ts
export { default } from './pi-peon/index';
```

`extensions/pi-peon/index.ts` registers:

- `--peon-disabled`
- `--peon-script`
- `/peon-enable`
- `/peon-disable`
- lifecycle handlers via `registerPeonEvents()`

### Event mapping

`events.ts` registers:

| pi event | controller method | hook emitted |
|---|---|---|
| `session_start` | `handleSessionStart` | `SessionStart` |
| `session_tree` | `syncState` | none |
| `session_compact` | `syncState` | none |
| `input` | `handleInput` | `UserPromptSubmit` |
| `tool_result` | `handleToolResult` | `PostToolUseFailure` if `isError` |
| `agent_end` | `handleAgentEnd` | `Stop` |
| `session_before_compact` | `handleSessionBeforeCompact` | `PreCompact` |

Notably absent:

- `session_shutdown` → `SessionEnd`

### Runtime resolution

`runtime.ts` resolves hook scripts from:

- custom flag: `--peon-script`
- env vars:
  - `PI_PEON_SCRIPT`
  - `PI_OPENPEON_SCRIPT`
  - `PEON_SH_PATH`
- default paths:
  - `~/.claude/hooks/peon-ping/peon.sh`
  - `~/.claude/hooks/peon-ping/peon.ps1` on Windows
  - `~/.openclaw/hooks/peon-ping/peon.sh`

It also checks whether the `peon` CLI exists, but the actual dispatch path is the
hook script, not direct `peon` stdin dispatch.

### Payload shape

`fireHook()` sends JSON like:

```json
{
  "hook_event_name": "SessionStart",
  "notification_type": "",
  "cwd": "/project",
  "session_id": "pi-...",
  "permission_mode": "",
  "source": "pi"
}
```

It does not include richer tool-failure details such as:

```json
{
  "tool_name": "Bash",
  "error": "bash failed"
}
```

### Disable/config policy

The implementation has several layers of enablement:

1. `--peon-disabled`
2. session override via `/peon-enable` or `/peon-disable`
3. `piPeon.enabled` in `.pi/settings.json` or `~/.pi/agent/settings.json`

This is useful but may be duplicate policy if the `peon` CLI already handles
mute/enable behavior.

## Gaps relative to `pi-peon-adapter`

### Uses old pi package name

Imports and peer dependencies use:

```
@mariozechner/pi-coding-agent
```

The new adapter should use:

```
@earendil-works/pi-coding-agent
```

### Hook-script adapter, not direct CLI adapter

`@helle253/pi-peon` dispatches to `peon.sh` / `peon.ps1` hook scripts. The desired
adapter dispatches directly to the `peon` executable on stdin:

```text
pi event → JSON payload → peon CLI
```

This avoids depending on Claude/OpenClaw hook-script installation paths.

### Missing `SessionEnd`

The hook event type omits `SessionEnd`, and no handler maps `session_shutdown`.

The current adapter contract wants `session_shutdown` → `SessionEnd`.

### Different prompt event

`@helle253/pi-peon` maps `input` → `UserPromptSubmit`.

The current adapter maps `before_agent_start` → `UserPromptSubmit`.

This deserves a deliberate decision. `input` may better represent raw prompt
submission, but it fires before command/skill/template handling semantics differ
from `before_agent_start`. The adapter should choose based on what peon expects.

### Different tool-failure event

`@helle253/pi-peon` maps any `tool_result` with `isError=true` to
`PostToolUseFailure`.

The current adapter maps only `tool_execution_end` for `toolName === "bash"`.

This also deserves a deliberate decision:

- all-tool errors provide broader failure signals;
- bash-only errors reduce noise and match the current implementation.

### No explicit debug log path

There is no equivalent of:

```bash
PI_PEON_ADAPTER_DEBUG_LOG=/tmp/pi-peon-adapter.log
```

For pre-publish soak testing, the adapter needs plain-text debug logging behind
an explicit log path.

### No tests

The package defines no test files. The module boundaries may still be good, but
they are not backed by tests.

This matters because one reason to refactor `pi-peon-adapter` is testability. The
reference implementation shows a possible split, but not a verified test design.

## What to copy conceptually

- Keep event registration separate from runtime dispatch.
- Keep runtime resolution/dispatch isolated.
- Warn users for actionable missing-runtime problems, but only once.
- Consider `input` vs `before_agent_start` deliberately.
- Consider all-tool vs bash-only failure deliberately.

## What not to copy directly

- Old `@mariozechner/*` imports.
- Hook-script-only runtime discovery.
- Persistent enable/disable settings unless there is a strong need.
- Missing `SessionEnd`.
- Debug-less behavior.
- A file split without tests to validate the boundaries.
