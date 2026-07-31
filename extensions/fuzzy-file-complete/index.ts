// Fuzzy `@` file completion backed by `fuzzyFilter` from pi-tui.
//
// Replaces the built-in `@` file suggestions (which shell out to `fd` on every
// keystroke and rank with a naive exact/startsWith/substring scorer) with:
//   1. one `fd` run per session (cached), so we don't pipe through stdin/stdout
//      on every keystroke, and
//   2. in-process subsequence fuzzy matching via `fuzzyFilter` — the same
//      matcher pi uses for slash commands and the github-issue example.
//
// `pi.exec` only exposes stdout/stderr/code (no stdin), so we run `fd` once,
// keep the path list in memory, and let `fuzzyFilter` do the ranking. This is
// the "incorporate fuzzy.js" approach: a single fd call, everything else
// in-process.
//
// Test with:  pi -e .

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import {
  type AutocompleteItem,
  type AutocompleteProvider,
  type AutocompleteSuggestions,
  fuzzyFilter,
} from '@earendil-works/pi-tui'

type Entry = { path: string; isDirectory: boolean }

const MAX_RESULTS = 20
// Match the built-in cap so the initial `fd` scan stays cheap. The built-in
// passes --max-results 100; we mirror that.
const FD_MAX = 100

// `@` token, optionally quoted: @foo, @"foo bar". Mirrors the built-in
// `extractAtPrefix` shape so triggering feels identical.
const AT_RE = /(?:^|[ \t])(@(?:"[^"]*|[^"\s@]*))$/

// Candidate binary names in probe order. `fd` is the upstream/cargo name;
// `fdfind` is the Debian/Ubuntu package name. Whichever responds to
// `--version` first wins and is cached for the session.
const FD_CANDIDATES = ['fd', 'fdfind']

function basenameOf(p: string): string {
  const i = p.lastIndexOf('/')
  return i === -1 ? p : p.slice(i + 1)
}

// Probe each candidate with `--version`. A missing binary makes pi.exec
// resolve { code: 1, stdout: "" } (spawn ENOENT is caught internally), so
// code 0 + non-empty stdout is a reliable existence signal.
async function resolveFd(pi: ExtensionAPI, signal?: AbortSignal): Promise<string | undefined> {
  for (const candidate of FD_CANDIDATES) {
    if (signal?.aborted) return undefined
    const probe = await pi.exec(candidate, ['--version'], { signal, timeout: 2_000 })
    if (!signal?.aborted && probe.code === 0 && probe.stdout.trim()) return candidate
  }
  return undefined
}

async function loadFileList(
  pi: ExtensionAPI,
  cwd: string,
  fdBin: string,
  signal: AbortSignal,
): Promise<Entry[] | undefined> {
  // fd respects .gitignore, lists files + dirs, skips .git. Same flags the
  // built-in uses, minus the per-keystroke query filtering (we do that in JS).
  const result = await pi.exec(
    fdBin,
    [
      '.',
      cwd,
      '--type',
      'f',
      '--type',
      'd',
      '--follow',
      '--hidden',
      '--exclude',
      '.git',
      '--exclude',
      '.git/*',
      '--exclude',
      '.git/**',
      '--max-results',
      String(FD_MAX),
    ],
    { signal, timeout: 10_000 },
  )
  if (signal.aborted || result.code !== 0 || !result.stdout) return undefined
  const entries: Entry[] = []
  for (const line of result.stdout.split('\n')) {
    if (!line) continue
    const isDir = line.endsWith('/')
    const path = isDir ? line.slice(0, -1) : line
    if (!path || path === '.git' || path.startsWith('.git/')) continue
    entries.push({ path, isDirectory: isDir })
  }
  return entries
}

function buildItem(entry: Entry, isQuoted: boolean): AutocompleteItem {
  // Match the built-in value shape so delegating applyCompletion to `current`
  // reuses the built-in insertion logic (trailing "/" for dirs, quoting).
  const value = isQuoted
    ? `@"${entry.path}${entry.isDirectory ? '/' : ''}"`
    : `@${entry.path}${entry.isDirectory ? '/' : ''}`
  return {
    value,
    label: basenameOf(entry.path) + (entry.isDirectory ? '/' : ''),
    description: entry.path,
  }
}

const MUTATING_TOOLS = new Set(['bash', 'edit', 'write'])

export default function (pi: ExtensionAPI): void {
  pi.on('session_start', async (_event, ctx) => {
    // Probe up front: register nothing if fd is unavailable, so the built-in
    // `@` provider stays intact.
    const fdBin = await resolveFd(pi, ctx.signal)
    if (!fdBin) {
      ctx.ui.notify('fuzzy-file-complete: neither `fd` nor `fdfind` found on PATH; `@` keeps the built-in', 'error')
      return
    }

    const cwd = ctx.cwd
    let cache: Promise<Entry[] | undefined> | undefined

    const getFileList = (signal: AbortSignal): Promise<Entry[] | undefined> => {
      if (!cache) cache = loadFileList(pi, cwd, fdBin, signal)
      return cache
    }

    // Invalidate when a tool may have changed the tree; next `@` re-runs fd lazily.
    pi.on('tool_execution_end', event => {
      if (!event.isError && MUTATING_TOOLS.has(event.toolName)) cache = undefined
    })

    ctx.ui.addAutocompleteProvider((current): AutocompleteProvider => ({
      async getSuggestions(lines, cursorLine, cursorCol, options): Promise<AutocompleteSuggestions | null> {
        const before = (lines[cursorLine] ?? '').slice(0, cursorCol)
        const m = before.match(AT_RE)
        if (!m) return current.getSuggestions(lines, cursorLine, cursorCol, options)

        const atPrefix = m[1] ?? ''
        const isQuoted = atPrefix.startsWith('@"')
        const query = isQuoted ? atPrefix.slice(2) : atPrefix.slice(1)

        const entries = await getFileList(options.signal)
        // On abort or load failure, fall back to the built-in fd-based search.
        if (options.signal.aborted || !entries || entries.length === 0) {
          ctx.ui.notify('fuzzy-file-complete: Failed to load file list, falling back to fd-based search', 'warning')
          return current.getSuggestions(lines, cursorLine, cursorCol, options)
        }

        // fuzzyFilter splits the query on whitespace and "/" and requires
        // every token to match — exactly the "fzf-like" behavior we want.
        const filtered = fuzzyFilter(entries, query, e => e.path)
        if (filtered.length === 0) {
          return current.getSuggestions(lines, cursorLine, cursorCol, options)
        }

        const items = filtered.slice(0, MAX_RESULTS).map(e => buildItem(e, isQuoted))
        return { items, prefix: atPrefix }
      },

      applyCompletion(lines, cursorLine, cursorCol, item, prefix) {
        return current.applyCompletion(lines, cursorLine, cursorCol, item, prefix)
      },

      shouldTriggerFileCompletion(lines, cursorLine, cursorCol) {
        return current.shouldTriggerFileCompletion?.(lines, cursorLine, cursorCol) ?? true
      },
    }))
  })
}
