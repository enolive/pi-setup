# peon-ping extension — refactor and test plan

## Motivation

### Elevator pitch

AI coding agents are starting to work unattended, but humans still miss the important moments: when the agent finishes,
fails, or needs attention.

We already have a prototype that connects pi to peon notifications, but it is silent when it breaks and has no tests, so
we cannot trust it enough to publish.

The proposal is a small investment: turn the prototype into a minimal tested adapter with opt-in diagnostics. It keeps
notification policy in peon, keeps pi integration tiny, and makes long-running agent sessions easier to trust.

### Details

For a longer management discussion, see [`research/management-slide-deck.md`](research/management-slide-deck.md).

If the make-vs-buy
decision needs to be revisited, see
[`research/existing-pi-peon-implementations.md`](research/existing-pi-peon-implementations.md)
for the market scan and management summary explaining why this adapter should be
built instead of adopting an existing package.

### Technical motivation

The extension is a thin but stateful bridge: it maps pi lifecycle events to
specific JSON payloads and pipes them into the `peon` CLI. Getting the payload
wrong is silent — peon either plays no sound or plays the wrong one, and there
is no error to observe. The mapping rules also have non-obvious guard conditions
(skip `SessionStart` on reload/fork/no UI, only fire tool failures for Bash
errors) that are easy to break when touching the code.

The current `index.ts` mixes three concerns in one file:

- pi handler registration and pi-event-to-peon-payload mapping;
- peon executable lookup;
- child-process dispatch.

Split by real integration boundary, not by artificial domain concepts.

---

## Target file layout

The extension should eventually move into a standalone pi package named
`pi-peon-adapter`. While it still lives in this setup repo, keep the same
shape under `extensions/peon-ping/` so the move is mostly a copy/rename later.

Keep unit tests side-by-side with the implementation they exercise. Only shared
test helpers and broader integration tests go in `test/`.

```text
# current state inside this repo
extensions/peon-ping/
  index.ts                 # EVERYTHING

# standalone-shaped layout to create under a new project/repo
pi-peon-adapter/
  package.json
  tsconfig.json
  vitest.config.ts         # test config once vitest tests are added
  index.ts                 # facade: export { default } from './src'
  src/
    index.ts               # extension composition
    pi.ts                  # pi handler registration + payload mapping
    pi.test.ts             # side-by-side tests for pi.ts
    peon.ts                # executable resolution + child-process dispatch
    peon.test.ts           # side-by-side tests for peon.ts
  test/
    helpers/
      fake-pi.ts           # fake pi handler collector + fake ctx if shared
      fake-child.ts        # fake child/spawn helpers if shared
    integration.test.ts    # extension-level wiring test
```

Do not add a separate protocol/types file yet. The peon payload type can live in
`pi.ts` until it is genuinely shared enough to justify another module.

When a task touches event mapping, runtime dispatch, or file boundaries, consult
[`research/helle253-pi-peon-reference.md`](research/helle253-pi-peon-reference.md)
for reference-implementation inspection notes. Use its "What to copy
conceptually" / "What not to copy directly" sections as action guidance without
repeating those details here. This is not a separate blocking step before Task 0.

---

## Progress

Use this as a lightweight breadcrumb trail if work gets interrupted by side
quests.

- [x] Rewrite this plan to match the current single-file implementation and the
  desired incremental refactor direction.
- [x] Task 0 — Add standalone-package scaffolding for `pi-peon-adapter`.
- [x] Task 1 — Extract `src/pi.ts`.
- [x] Task 2 — Extract `src/peon.ts`.
- [x] Task 3 — Shrink `src/index.ts` and keep root `index.ts` as a facade.
- [ ] Task 4 — Add opt-in diagnostics.
- [ ] Task 5 — Add debug-log activation notification.
- [ ] Add/adjust side-by-side tests and the small integration test.

---

## Refactor tasks

Do these tasks incrementally. Each task should leave the extension working and
should be testable on its own; avoid a large all-at-once rewrite. If a later
step starts feeling unnecessary, stop and keep the smaller structure.

### Task 0 — Add standalone-package scaffolding

Prepare `extensions/peon-ping/` so it can become a standalone package named
`pi-peon-adapter` later.

Add local project files next to the extension and introduce the standalone-shaped
source layout:

- `package.json`
  - `"name": "pi-peon-adapter"`
  - `"type": "module"`
  - `"main": "src/index.ts"`
  - `"keywords": ["pi-package"]`
  - `"pi": { "extensions": ["./index.ts"] }`
  - scripts for the local package, for example:
    - `"test": "vitest run"`
    - `"test:unit": "vitest run src"`
    - `"test:integration": "vitest run test/integration.test.ts"`
    - `"typecheck": "tsc --noEmit"`
  - `@earendil-works/pi-coding-agent` as a peer dependency
  - test/typecheck tooling as dev dependencies only if not inherited from this
    setup repo
- `tsconfig.json`
  - strict settings compatible with the root project
  - include `index.ts`, `src/**/*.ts`, and `test/**/*.ts`
  - exclude `node_modules`
- `vitest.config.ts` once tests are introduced
  - node environment
  - `restoreMocks: true`
  - `clearMocks: true`
  - exclude `test/helpers/**/*.ts` from coverage if coverage is added
- `src/index.ts`
  - move the current implementation here unchanged as the first mechanical step
- root `index.ts`
  - replace with a tiny facade that re-exports the default extension from
    `./src`, matching the `pi-requesty` package-facing entrypoint pattern
  - this keeps the current setup repo's `./extensions/*/index.ts` manifest
    working while matching the future package's public entrypoint
- optional local `README.md` later, once behavior and install commands are final

Keep this first step small: do not move files out of the setup repo yet, and do
not refactor behavior while creating the package shape. The goal is only to make
the extension directory self-contained enough that the later standalone
extraction is mechanical.

Follow the `pi-requesty` convention of keeping imports extensionless inside
`src/`, e.g. `import { registerPiHandlers } from './pi'`.

### Task 1 — Extract `src/pi.ts`

Move all pi-bound behavior from `src/index.ts` into `src/pi.ts`:

- `HookEvent` type
- `HookPayload` interface
- `PeonSink` interface: `{ send(payload: HookPayload): void }`
- `registerPiHandlers(pi, peon)`
- private `sessionIdFor(ctx)` helper
- private/base payload helpers as useful

`pi.ts` owns all pi event mapping and guard conditions:

- `session_start`
  - skip when `ctx.hasUI` is false
  - skip reasons `"reload"` and `"fork"`
  - emit `SessionStart`
  - `source` is `"resume"` for resume, otherwise `"startup"`
- `input` → `UserPromptSubmit`
  - this maps closer to raw user submission and matches the useful part of the
    inspected reference implementation; a local debug-log soak confirmed it
    emits before agent/tool/agent_end activity with `source=interactive`
- `agent_end` → `Stop`
- `tool_execution_end`
  - skip when `isError` is false
  - skip when `toolName !== "bash"`
  - emit `PostToolUseFailure`, `tool_name: "Bash"`, `error: "bash failed"`
- `session_before_compact` → `PreCompact`
- `session_shutdown` → `SessionEnd`

Every emitted payload includes:

- `session_id`, derived from `ctx.sessionManager.getSessionFile()` when
  available and prefixed with `pi-`;
- `cwd`, copied from `ctx.cwd`.

### Task 2 — Extract `src/peon.ts`

Move executable lookup and process dispatch into `src/peon.ts`:

- `resolveExecutable(name, options?)`
- `createPeonSink(peonPath, options?)`
- `dispatchPeonEvent(peonPath, payload, options?)`

Use dependency injection at the boundary so tests do not need global module
mocking:

- injectable `pathEnv`
- injectable `canExecute(path): boolean`
- injectable `spawn`
- injectable `setTimeout` / `clearTimeout` if timeout behavior is tested

Defaults should use real Node APIs.

Current process behavior to preserve:

- spawn `peonPath` with piped stdio;
- write `JSON.stringify(payload)` to stdin;
- close stdin;
- clear timeout on child `error` or `close`;
- kill child after 5 seconds if it does not close/error;
- do not await completion or throw from send.

### Task 3 — Shrink `src/index.ts`

`src/index.ts` should only compose the pieces:

1. choose `process.env.PEON_BIN || "peon"`;
2. resolve the executable;
3. warn and return when missing;
4. call `registerPiHandlers(pi, createPeonSink(peonPath))`.

Optionally expose a factory for integration testing without global mocks:

```ts
export interface PeonPingDeps {
  peonBin?: string
  resolveExecutable?: (name: string) => string | undefined
  createPeonSink?: (path: string) => PeonSink
  warn?: (message: string) => void
}

export function createPeonPingExtension(deps?: PeonPingDeps) { ...
}

export default createPeonPingExtension()
```

### Task 4 — Add opt-in diagnostics

Add small, removable diagnostics support for pre-publish soak testing. This is
not a general logging subsystem.

Keep this first diagnostics pass intentionally narrow. Log only pi-event receipt,
handler decisions, and the handoff to `PeonSink.send()`. Do not instrument
`peon.ts` process details yet: missing executables are already visible via
`console.warn`, and fire-and-forget child process behavior should stay quiet
unless a later soak test shows that deeper runtime diagnostics are needed.

Implementation shape:

- add a tiny diagnostics helper, either local to `src/pi.ts` at first or as
  `src/diagnostics.ts` if the helper is clearer on its own;
- enable debug logging only when `process.env.PI_PEON_ADAPTER_DEBUG_LOG` contains
  a non-empty path;
- check the env var dynamically on each log attempt so logging can be turned
  on/off without reloading pi;
- write plain-text log lines only;
- include timestamp, hook name, cwd, session id when a payload exists, and the
  skip/send decision;
- if writing fails, silently disable debug logging for that process until the env
  path changes;
- do not add a UI notification in this task.

Suggested events to log:

- pi hook received, including relevant event details such as `reason`,
  `toolName`, and `isError`;
- handler dispatch decisions, including skipped hooks and their reason;
- `PeonSink.send()` handoff, including `hook_event_name`, `cwd`, and
  `session_id`.

Tests:

- avoid spreading debug-log assertions through the side-by-side unit tests;
- add one high-level integration test that enables
  `PI_PEON_ADAPTER_DEBUG_LOG`, drives a small event flow, and snapshots the log
  after normalizing timestamps.

---

### Task 5 — Add debug-log activation notification

Consider a later, separate task for notifying users when debug logging becomes
active. This was deliberately split out of Task 4 because detecting env-var
changes and showing a one-time notification requires UI context and can easily
turn into lifecycle/poller complexity.

Desired behavior, if this remains useful after the first diagnostics soak:

- when `PI_PEON_ADAPTER_DEBUG_LOG` changes from empty to a non-empty path and a
  pi UI context is available, show a one-time `ctx.ui.notify` message that debug
  logging is enabled and includes the configured log path;
- avoid adding repeated notification calls to every handler body;
- prefer a small central mechanism, such as a handler wrapper that records the
  latest context and/or checks notification state once per received hook;
- if polling is introduced, define its lifecycle explicitly so tests and reloads
  do not leak intervals;
- keep `console.warn` for startup/setup problems without context, such as a
  missing `peon` executable.

Tests for this task should be explicit about notification timing and one-time
behavior, and should not be mixed into the basic diagnostics logging test.

---

## Test placement and scope

### `src/pi.test.ts` — side-by-side with `src/pi.ts`

Test through `registerPiHandlers()`, not detached mapper functions. Use a fake
`ExtensionAPI` that stores `pi.on(event, handler)` registrations and a fake
`PeonSink` that records payloads.

Cases:

- registers all expected handlers;
- `session_start` reason `"startup"` emits `SessionStart`, `source: "startup"`;
- `session_start` reason `"resume"` emits `SessionStart`, `source: "resume"`;
- `input` emits `UserPromptSubmit`;
- `agent_end` emits `Stop`;
- `tool_execution_end` with `isError: true`, `toolName: "bash"` emits
  `PostToolUseFailure`, `tool_name: "Bash"`, `error: "bash failed"`;
- `session_before_compact` emits `PreCompact`;
- `session_shutdown` emits `SessionEnd`;
- session id is derived from the session file basename and prefixed with `pi-`;
- fallback session id starts with `pi-` when no session file exists;
- guard conditions do not send payloads:
  - `session_start` reason `"reload"`;
  - `session_start` reason `"fork"`;
  - `session_start` with `ctx.hasUI: false`;
  - `tool_execution_end` with `isError: false`;
  - `tool_execution_end` with non-bash tool name.

No Node module mocking should be needed.

### `src/peon.test.ts` — side-by-side with `src/peon.ts`

Test the process boundary with injected fakes, not global module mocks.

`resolveExecutable()` cases:

- finds an executable by name on injected `PATH`;
- returns `undefined` for a name not on injected `PATH`;
- resolves an absolute/path-containing executable when `canExecute` returns
  true;
- returns `undefined` for direct paths when `canExecute` returns false;
- returns first match when multiple path entries contain the executable.

`dispatchPeonEvent()` / `createPeonSink()` cases:

- writes JSON payload to child stdin;
- ends child stdin;
- clears timeout on `close`;
- clears timeout on `error`;
- kills child after timeout;
- swallows spawn/stdin errors if the implementation keeps that behavior.

No real `peon` binary should be required.

### `test/helpers/`

Put shared helper code here only if it is used by multiple tests. Prefer small,
focused helper files over one catch-all `helpers.ts`, following the `pi-requesty`
style:

- `test/helpers/fake-pi.ts`
  - `makePi()` fake `ExtensionAPI` handler collector;
  - `makeCtx(overrides?)` fake pi context, if shared by multiple tests.
- `test/helpers/fake-child.ts`
  - fake child/spawn builders for `peon.test.ts` and integration tests, if shared.

If a helper is only used by one side-by-side test file, keep it local to that
file instead.

### `test/integration.test.ts`

Keep broader extension-level wiring tests here. These should stay few and
focused.

Cases:

- when executable resolution fails, the extension warns and registers no pi
  handlers;
- when executable resolution succeeds, the extension registers handlers and a
  representative event reaches the injected peon sink.

Use the optional `createPeonPingExtension(deps)` factory so this test can inject
resolver/sink/warn dependencies instead of mocking `process.env`, `console`, fs,
or child process modules.

---

## Diagnostics / logging

Pi does not currently expose a first-class extension logger with session-aware
context and rotation. Do not build a full logging subsystem in this adapter.

Add debug logging now so the extension can be run for a while before publishing
and weird behavior can be distinguished from external factors such as ACP or
model issues. Keep it small and easy to remove later:

- enabled only via an explicit log path, for example
  `PI_PEON_ADAPTER_DEBUG_LOG=/tmp/pi-peon-adapter.log`;
- the presence of that explicit path is the only criterion for producing debug
  logs; when it is unset, do not log debug information at all;
- if the configured log path becomes unavailable or writing fails, silently stop
  attempting debug logging for that process instead of warning repeatedly;
- plain text, not NDJSON or another structured format;
- append short human-readable lines with timestamp, hook name, cwd/session id
  when available, and the peon executable path/error when relevant;
- no rotation, retention policy, or global log management inside the adapter;
  users can point the path at a system-managed location such as `/tmp` or a
  `/var/log` file that is already handled by external rotation/wiping policy.

Important actionable warnings should remain visible without enabling debug logs:

- startup/setup problems without a context, such as missing `peon`, should use
  `console.warn`;
- runtime problems with a pi context may use `ctx.ui.notify(..., "warning" | "error")`
  if they are actionable for the user and not expected to be noisy.

Normal successful dispatch should stay silent unless explicit debug logging is
enabled. A user-visible notification for debug-log activation is deferred to
Task 5.

---

## Non-goals

- Do not test the real `peon` CLI.
- Do not require an installed sound pack.
- Do not introduce a separate peon protocol/types file unless the implementation
  grows enough to need it.
- Do not introduce a permanent custom logging system; temporary debug logging
  should remain removable.
- Do not reintroduce the removed awaited `sendToPeon()` / `runPeon()` design;
  the extension is currently fire-and-forget.
