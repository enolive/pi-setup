/**
 * Kitsune Fire — climb working indicator + cycling fox messages
 *
 * Fox-fire climb animation with constant visual width (6 cells).
 * While the agent runs, random kitsune lines rotate via setWorkingMessage.
 */

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent'

/** Approximate terminal cell width (emoji ≈ 2, marks ≈ 1). */
function cellWidth(s: string): number {
  let w = 0
  for (const ch of s) {
    if (ch === '🦊' || ch === '🔥' || ch === '✨') w += 2
    else w += 1
  }
  return w
}

function padCells(s: string, width: number): string {
  const pad = Math.max(0, width - cellWidth(s))
  return s + ' '.repeat(pad)
}

// Climb: ember → spark → blaze → settle (fox left-aligned, width 6)
const RAW_FRAMES = ['🦊', '🦊·', '🦊*', '🦊✦', '🦊🔥', '🦊✦🔥', '🦊🔥🔥', '🦊✦🔥', '🦊🔥', '🦊✦']

const WIDTH = Math.max(...RAW_FRAMES.map(cellWidth))
const FRAMES = RAW_FRAMES.map(f => padCells(f, WIDTH))

const MESSAGES = [
  'kindling foxfire',
  'ears perked',
  'sniffing the stack',
  'chasing a scent',
  'tail ablaze',
  'weaving nine tails',
  'padding through code',
  'yipping at bugs',
  'ember thoughts',
  'hunting a fix',
  'spirit blaze rising',
  'sharpening fangs',
  'moonlit refactor',
  'pouncing on the problem',
  'ash & insight',
  'whispering to the compiler',
  'foxhole deep dive',
  'spark → flame → answer',
  'stealing a solution',
  'kitsune concentration',
]

function shuffle<T>(items: T[]): T[] {
  return items.sort(() => Math.random() - 0.5)
}

export default function (pi: ExtensionAPI) {
  let timer: ReturnType<typeof setInterval> | undefined
  let deck: string[] = []
  let deckIndex = 0

  const stopMessages = (ctx: ExtensionContext) => {
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
    ctx.ui.setWorkingMessage()
  }

  const nextMessage = (): string => {
    if (deckIndex >= deck.length) {
      deck = shuffle(MESSAGES)
      deckIndex = 0
    }
    return `${deck[deckIndex++]}...`
  }

  const startMessages = (ctx: ExtensionContext) => {
    stopMessages(ctx)
    ctx.ui.setWorkingMessage(nextMessage())
    timer = setInterval(() => {
      ctx.ui.setWorkingMessage(nextMessage())
    }, 2200)
  }

  pi.on('session_start', (_event, ctx) => {
    if (ctx.mode !== 'tui') return
    ctx.ui.setWorkingIndicator({
      frames: FRAMES,
      intervalMs: 90,
    })
  })

  pi.on('agent_start', (_event, ctx) => {
    if (ctx.mode !== 'tui') return
    startMessages(ctx)
  })

  pi.on('agent_end', (_event, ctx) => {
    stopMessages(ctx)
  })
}
