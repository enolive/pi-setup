# peon-ping extension — refactor and test plan

## Motivation

### Elevator pitch

AI agents increasingly work unattended: they run commands, wait on tools, hit
errors, compact context, and finish tasks while the user is looking elsewhere.
`pi-peon-adapter` turns those invisible lifecycle moments into immediate,
configurable local signals through `peon`, without pi needing to grow its own
sound/notification subsystem. The value is faster human response, fewer missed
failures, and better situational awareness during long-running coding-agent
sessions — with a tiny adapter that delegates all notification policy to an
existing dedicated tool.

Leaving the current one-file extension as-is is risky because failures are mostly
silent: a missed or malformed hook looks the same as peon being muted, ACP acting
weird, a model behaving unexpectedly, or the user simply not noticing the sound.
The main reason for further work is therefore **tests**: the event-to-hook mapping
and guard conditions are the product. They need executable coverage so we can
change pi versions, adjust event choices, or publish the adapter without relying
on manual listening tests. The refactor exists mostly to make those tests small
and trustworthy; opt-in debug logging is the supporting tool for soak testing in
real sessions.

For a slide-style version of this argument, see
[`research/management-slide-deck.md`](research/management-slide-deck.md). If the make-vs-buy
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

# standalone-shaped layout to create under extensions/peon-ping/
# and later copy to a dedicated pi-peon-adapter repository/package
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
- [ ] Task 0 — Add standalone-package scaffolding for `pi-peon-adapter`.
- [ ] Task 1 — Extract `src/pi.ts`.
- [ ] Task 2 — Extract `src/peon.ts`.
- [ ] Task 3 — Shrink `src/index.ts` and keep root `index.ts` as a facade.
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
- `before_agent_start` → `UserPromptSubmit`
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

export function createPeonPingExtension(deps?: PeonPingDeps) { ... }
export default createPeonPingExtension()
```

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
- `before_agent_start` emits `UserPromptSubmit`;
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

- when debug logging is activated and a pi context with UI is available, show a
  one-time `ctx.ui.notify` message that debug logging is enabled and includes the
  configured log path;
- startup/setup problems without a context, such as missing `peon`, should use
  `console.warn`;
- runtime problems with a pi context may use `ctx.ui.notify(..., "warning" | "error")`
  if they are actionable for the user and not expected to be noisy.

Normal successful dispatch should stay silent.

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
