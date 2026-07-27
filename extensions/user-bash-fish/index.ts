/**
 * User-Bash Fish Extension
 *
 * Runs YOUR `!` / `!!` shell commands in fish, while leaving the agent's
 * built-in bash tool on bash.
 *
 * Why: pi has a single `shellPath` setting shared by both the agent's bash
 * tool and user `!` commands, and it is documented as bash-compatible. The
 * `user_bash` event fires only for user `!` / `!!` commands, so returning
 * fish-backed operations here splits the two cleanly without touching the
 * agent's tool.
 *
 * We reuse pi's local shell backend (`createLocalBashOperations`) so we keep
 * streaming output, truncation + temp-file overflow, cancellation, timeouts,
 * and process-tree killing for free — it just invokes `fish -c <command>`
 * instead of `bash -c <command>`.
 *
 * Configure the fish binary with the `PI_USER_SHELL` env var (default
 * `/usr/bin/fish`). If that path is missing, we fall back to pi's default
 * (bash) so `!` commands keep working.
 */

import { existsSync } from 'node:fs'
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import { createLocalBashOperations } from '@earendil-works/pi-coding-agent'

const FISH = process.env.PI_USER_SHELL || '/usr/bin/fish'

export default function (pi: ExtensionAPI) {
  if (!existsSync(FISH)) {
    console.warn(`user-bash-fish: ${FISH} not found; ! commands will use bash`)
    return
  }

  pi.on('user_bash', () => {
    return { operations: createLocalBashOperations({ shellPath: FISH }) }
  })
}
