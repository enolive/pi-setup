/**
 * Fox Status Extension
 *
 * Fox-themed footer status bar.
 * Pairs with the avatar extension's fox mascot.
 *
 */

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent'

const FOX = '🦊'

function setFoxStatus(ctx: ExtensionContext, text: string | undefined) {
  if (!ctx.hasUI) return
  ctx.ui.setStatus('fox-status', text)
}

// noinspection JSUnusedGlobalSymbols
export default function (pi: ExtensionAPI) {
  let turnCount = 0

  pi.on('session_start', (_event, ctx) => {
    turnCount = 0
    setFoxStatus(ctx, `${FOX} 🌲`)
  })

  pi.on('agent_start', () => {
    turnCount = 0
  })

  pi.on('turn_start', (_event, ctx) => {
    turnCount++
    setFoxStatus(ctx, `${FOX} 🐾 #${turnCount}`)
  })

  pi.on('turn_end', (_event, ctx) => {
    setFoxStatus(ctx, `${FOX} ✅ #${turnCount}`)
  })

  pi.on('agent_settled', (_event, ctx) => {
    setFoxStatus(ctx, `${FOX} 💤`)
  })

  pi.on('session_shutdown', (_event, ctx) => {
    setFoxStatus(ctx, undefined)
  })
}
