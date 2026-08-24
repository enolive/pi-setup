/**
 * Kitsune Fire — climb working indicator & one fox message per turn
 *
 * Frames and working message are independent:
 * - indicator: fixed-width climb loop
 * - message: one shuffled line per agent run
 */

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent'

const FOX = '🦊'
const FIRE = '🔥'

// Climb: ember → spark → blaze → settle (fox left-aligned, constant width)
const CLIMB = [
  FOX,
  `${FOX}·`,
  `${FOX}*`,
  `${FOX}✦`,
  `${FOX}${FIRE}`,
  `${FOX}✦${FIRE}`,
  `${FOX}${FIRE}${FIRE}`,
  `${FOX}✦${FIRE}`,
  `${FOX}${FIRE}`,
  `${FOX}✦`,
]
const CLIMB_WIDTH = Math.max(...CLIMB.map(cellWidth))
const FRAMES = CLIMB.map(step => padCells(step, CLIMB_WIDTH))

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

// noinspection JSUnusedGlobalSymbols
export default function (pi: ExtensionAPI) {
  let deck: string[] = []

  const nextMessage = (): string => {
    // cycle through randomly shuffled messages until they are exhausted. Then start over.
    if (deck.length === 0) deck = shuffle(MESSAGES)
    const raw = deck.pop()!
    // end every message with an ellipsis
    return `${raw}...`
  }

  const applyIndicator = (ctx: ExtensionContext) => {
    if (ctx.mode !== 'tui') return
    ctx.ui.setWorkingIndicator({ frames: FRAMES, intervalMs: 90 })
  }

  const applyMessage = (ctx: ExtensionContext) => {
    if (ctx.mode !== 'tui') return
    ctx.ui.setWorkingMessage(nextMessage())
  }

  pi.on('session_start', (_event, ctx) => applyIndicator(ctx))
  pi.on('agent_start', (_event, ctx) => applyMessage(ctx))
}

function padCells(s: string, width: number): string {
  const pad = Math.max(0, width - cellWidth(s))
  return s + ' '.repeat(pad)
}

/** Approximate terminal cell width (emoji ≈ 2, marks ≈ 1). */
function cellWidth(s: string): number {
  let w = 0
  for (const ch of s) {
    if (ch === FOX || ch === FIRE) w += 2
    else w += 1
  }
  return w
}

/**
 * Durstenfeld shuffle algorithm, see
 * https://stackoverflow.com/a/12646864
 */
function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
