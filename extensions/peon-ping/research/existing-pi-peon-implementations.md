# Existing pi + peon implementations

Research date: 2026-07-08

## Management summary — why build `pi-peon-adapter` ourselves?

There are already several pi packages that integrate peon/OpenPeon-style sounds.
However, they mostly solve a broader problem than this adapter should solve: they
play sounds themselves, manage sound packs, expose settings UIs, or target legacy
hook scripts. The desired `pi-peon-adapter` is intentionally narrower: forward pi
lifecycle events to the existing `peon` CLI/runtime and let peon own all sound,
notification, relay, pack, and mute policy.

Building a small adapter ourselves is justified because it gives us:

- **Lower operational risk** — fewer moving parts inside every pi session.
- **Clear ownership boundaries** — pi observes lifecycle events; peon handles
  notifications.
- **Current pi compatibility** — use `@earendil-works/pi-coding-agent`, not old
  package names.
- **Exact event semantics** — include `SessionEnd`, skip noisy startup cases, and
  decide deliberately whether tool failures are all-tool or bash-only.
- **Debuggability before publishing** — explicit plain-text debug logging via
  `PI_PEON_ADAPTER_DEBUG_LOG=/path/to/log.txt` for soak testing weird behavior.
- **Auditability** — a minimal adapter is easier to review than packages that
  download packs, detect audio players, open settings UIs, or mutate config.

The closest existing implementation is `@helle253/pi-peon`, and its structure is
worth studying. But it has no tests, uses older `@mariozechner/*` imports, targets
hook scripts instead of the current `peon` CLI, omits `SessionEnd`, and includes
extra enable/disable/settings machinery that may be outside the desired scope.
Its split into multiple files is intriguing, but because the package defines no
tests, the split does not actually prove testability.

Decision: **make, do not buy**. Use existing packages as references, especially
`@helle253/pi-peon`, but implement a small current-pi adapter with our desired
runtime contract and diagnostics.

## Packages found

### `pi-peon-ping`

- npm: `pi-peon-ping@0.2.0`
- repository: <https://github.com/joshuadavidthomas/pi-peon-ping>
- pi package page: <https://pi.dev/packages/pi-peon-ping>
- description: full pi extension for peon-ping/OpenPeon sound notifications.

Characteristics:

- Plays sound categories directly from OpenPeon packs.
- Provides `/peon` settings UI.
- Provides `/peon install` pack installation.
- Handles pack config/state under `~/.config/peon-ping/`.
- Detects local audio players.
- Handles remote relay support.
- Older peer dependency names: `@mariozechner/pi-coding-agent` and
  `@mariozechner/pi-tui`.

Why not buy:

- It is a full sound system inside pi, not a tiny adapter to the `peon` CLI.
- It owns config, packs, audio playback, and UI policy that should remain in
  peon for this project.
- It is larger than needed and therefore harder to audit/debug for soak testing.

### `@baozs/pi-peon-ping-win`

- npm: `@baozs/pi-peon-ping-win@2.0.1`
- repository: <https://github.com/Gohan/pi-peon-ping-win>
- pi package page: <https://pi.dev/packages/@baozs/pi-peon-ping-win>
- description: Windows-focused fork of `pi-peon-ping`.

Characteristics:

- Adds native Windows audio support.
- Adds WinForms popups and event-aware notification content.
- Uses newer `@earendil-works/*` peer dependency names.
- Still derives from the full `pi-peon-ping` sound-system approach.

Why not buy:

- It solves native Windows playback and popup behavior, which is not the core
  problem for a CLI-forwarding adapter.
- It still duplicates sound/notification policy inside pi instead of delegating
  to `peon`.

### `@wierdbytes/pi-peon`

- npm: `@wierdbytes/pi-peon@0.1.1`
- repository: <https://github.com/wierdbytes/pi-wierd-stuff>
- pi package page: <https://pi.dev/packages/@wierdbytes/pi-peon>
- description: CESP/OpenPeon sound-pack player for pi lifecycle events.

Characteristics:

- Full CESP/OpenPeon sound-pack player.
- Auto-downloads the default pack if missing.
- Provides `/peon` settings modal, pack picker, preview, mute/test/reset
  commands.
- Handles player detection and pack registry access.
- Has dependencies on `@wierdbytes/pi-common` and `@wierdbytes/pi-events`.

Why not buy:

- It is intentionally a full player and pack manager.
- It is broader and more opinionated than a direct `peon` CLI adapter.
- Good package for users wanting an all-in-one pi sound extension, but not for a
  minimal bridge that keeps policy in peon.

### `@helle253/pi-peon`

- npm: `@helle253/pi-peon@0.1.4`
- repository: <https://github.com/helle253/pi-peon>
- pi package page: <https://pi.dev/packages/@helle253/pi-peon>
- description: thin pi extension forwarding lifecycle events to peon-ping /
  OpenPeon runtime.

Characteristics:

- Closest conceptual match.
- Forwards pi lifecycle events to existing hook scripts.
- Adds `/peon-enable` and `/peon-disable` commands.
- Adds `--peon-disabled` and `--peon-script` flags.
- Supports session and persistent enable/disable state.
- Uses separate modules for commands, controller, events, runtime, settings, and
  session state.
- Defines no test files in the npm package.

Why not buy:

- It targets `peon.sh` / `peon.ps1` hook scripts, not direct `peon` CLI dispatch.
- It uses old `@mariozechner/pi-coding-agent` imports/peer dependency.
- It omits `SessionEnd`.
- It maps events differently from the current adapter contract.
- It does not provide the explicit debug log path needed for soak testing.
- It includes additional enable/disable/settings behavior that may duplicate
  peon's own policy layer.
- The module split looks promising, but without tests it does not demonstrate
  testability in practice.

## Make-vs-buy conclusion

Existing packages prove that peon-style notification integration for pi is useful,
but none is an exact fit for the desired adapter:

```text
pi lifecycle event → peon hook JSON → peon CLI/runtime
```

The adapter should be small enough to understand at a glance, testable without a
real peon install, silent by default, and debuggable via an explicit text log
while it is run pre-publish. Existing implementations are valuable references,
but adopting one would either bring too much product surface area or require
forking away enough behavior that writing the adapter directly is simpler.
