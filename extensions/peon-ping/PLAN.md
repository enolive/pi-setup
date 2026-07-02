# peon-ping extension — test suite plan

## Motivation

The extension is a thin but stateful bridge: it maps pi lifecycle events to
specific JSON payloads and pipes them into the `peon` CLI. Getting the payload
wrong is silent — peon either plays no sound or plays the wrong one, and there
is no error to observe. The mapping rules also have non-obvious guard conditions
(skip on reload, skip when no UI, only fire on Bash errors) that are easy to
break when touching the code.

A test suite makes those contracts explicit and cheap to verify. It is also a
prerequisite for publishing: anyone installing via `pi install npm:pi-peon-ping`
should be able to run `bun test` and confirm the bridge behaves as documented
before trusting it with their setup.

---

## Task 0 — Base project harness

Set up the project scaffolding all subsequent tasks depend on.

- `package.json` — declare `bun` as dev dep, add `"test": "bun test"` script, set `"name": "pi-peon-ping"`, add `"pi-package"` keyword, `"pi"` manifest pointing at `./index.ts`, `@earendil-works/pi-coding-agent` in `peerDependencies`
- `tsconfig.json` — strict mode, `node` module resolution, `node` lib, exclude `node_modules`
- `test/helpers.ts` — shared builders:
  - `makePi()` — fake `ExtensionAPI` that, when `pi.on(event, fn)` is called, simply stores `fn` in a map keyed by event name. Same for `pi.registerCommand(name, def)`. Exposes `getHandler(event)` and `getCommand(name)` to retrieve them. No event bus, no simulation — the default export in `index.ts` is a plain function that calls `pi.on(...)` synchronously during setup, so calling it with `fakePi` is enough to populate the map.
  - `makeCtx(overrides?)` — fake `ExtensionContext` with sensible defaults (`cwd: "/project"`, `hasUI: true`, `sessionManager` returning a stable fake session file path)
  - Per-event fake builder functions: `makeSessionStartEvent`, `makeToolExecutionEndEvent`, etc.

The test flow for every handler test is then:

1. Call the default export with `makePi()` — this registers all handlers into the map
2. Retrieve the specific handler: `const handler = fakePi.getHandler("session_start")`
3. Invoke it directly: `await handler(makeSessionStartEvent({ reason: "startup" }), makeCtx())`
4. Assert what the mocked `sendToPeon` was called with

---

## Task 1 — Extract `lib.ts`

Move the pure/spawning internals out of `index.ts` so they are independently importable and testable.

- Create `lib.ts` exporting: `HookEvent` type, `HookPayload` interface, `resolveExecutable(name, pathEnv?)`, `sendToPeon(peonPath, payload): Promise<void>`, `runPeon(peonPath, args): Promise<{ stdout: string; stderr: string }>`
- `sendToPeon` returns `Promise<void>` resolving on child `close` (currently fire-and-forget void — tests need to await it)
- `runPeon` encapsulates what is currently inline in the `/peon` command handler: spawn the process, collect stdout and stderr, resolve on close, reject on spawn error
- Update `index.ts` to import all of the above from `./lib.ts`; the `/peon` command handler becomes a short delegation to `runPeon` followed by a `ctx.ui.notify` call; remove all now-duplicate local implementations

---

## Task 2 — `resolveExecutable` tests

File: `test/resolveExecutable.test.ts`

No mocking needed — uses real temp dirs and files.

Cases:

- finds an executable by name when it is on PATH
- returns `undefined` for a name not on PATH
- resolves an absolute path that is executable
- returns `undefined` for an absolute path that is not executable
- returns `undefined` for an absolute path that does not exist
- returns the first match when PATH contains multiple dirs

---

## Task 3 — `sendToPeon` tests

File: `test/sendToPeon.test.ts`

Mock `node:child_process` with `mock.module`. The mock `spawn` returns a fake child: a `stdin` that accumulates written bytes, an `on(event, fn)` that captures listeners, and an explicit way to trigger `close`/`error`.

Cases:

- sends the payload as JSON to `child.stdin`
- resolves when the child emits `close`
- resolves silently when `spawn` throws (ENOENT-style)
- resolves silently when `stdin.end` throws

---

## Task 4 — Handler happy-path tests

File: `test/handlers.test.ts`

Uses `makePi()` / `makeCtx()` from `test/helpers.ts`. Mocks `sendToPeon` via `mock.module("./lib.ts", ...)` and asserts what it was called with.

Cases:

- `session_start` reason `"startup"` → `sendToPeon` called with `SessionStart`, `source: "startup"`
- `session_start` reason `"resume"` → `sendToPeon` called with `SessionStart`, `source: "resume"`
- `before_agent_start` → `sendToPeon` called with `UserPromptSubmit`
- `agent_end` → `sendToPeon` called with `Stop`
- `tool_execution_end` with `isError: true`, `toolName: "bash"` → `sendToPeon` called with `PostToolUseFailure`, `tool_name: "Bash"`, `error` contains `"bash"`
- `session_before_compact` → `sendToPeon` called with `PreCompact`
- `session_shutdown` → `sendToPeon` called with `SessionEnd`
- `session_id` is derived from `ctx.sessionManager.getSessionFile()` and prefixed with `pi-`

---

## Task 5 — Handler guard-condition tests

File: `test/handlers-guards.test.ts` (or appended to Task 4 file)

Same mocking approach; asserts `sendToPeon` is **not** called.

Cases:

- `session_start` reason `"reload"` → `sendToPeon` not called
- `session_start` reason `"fork"` → `sendToPeon` not called
- `session_start` with `ctx.hasUI: false` → `sendToPeon` not called
- `tool_execution_end` with `isError: false` → `sendToPeon` not called

---

## Task 6 — `/peon` command tests

File: `test/command.test.ts`

Two layers:

**`runPeon` unit tests** — mock `node:child_process`; assert the right argv is spawned and that stdout/stderr are returned correctly:

- resolves with stdout when the child exits cleanly
- resolves with stderr when only stderr is written
- rejects on spawn error

**Command handler integration** — use `makePi()` / `makeCtx()`, retrieve the registered `/peon` command handler, invoke it, assert `ctx.ui.notify` is called correctly:

- no args → calls `runPeon` with `["status"]`, notifies with output and level `"info"`
- `"volume 0.3"` → calls `runPeon` with `["volume", "0.3"]`
- stderr output (no stdout) → notifies with level `"error"`
- no output → notifies with a `"(no output)"` fallback
- spawn error → notifies with the error message and level `"error"`
