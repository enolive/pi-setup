/**
 * Fox Status Extension
 *
 * Fox-themed working spinner and footer status bar.
 * Pairs with the avatar extension's fox mascot.
 *
 * Usage:
 *   pi -e ./extensions/fox-status
 */

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent'

const FOX = '🦊'

function setFoxStatus(ctx: ExtensionContext, text: string | undefined) {
  ctx.ui.setStatus('fox-status', text)
}

export default function (pi: ExtensionAPI) {
  let turnCount = 0

  pi.on('session_start', (_event, ctx) => {
    if (!ctx.hasUI) return
    setFoxStatus(ctx, `${FOX} 🌲`)
  })

  pi.on('agent_start', (_event, ctx) => {
    if (!ctx.hasUI) return
    setFoxStatus(ctx, `${FOX} 🎯`)
  })

  pi.on('turn_start', (_event, ctx) => {
    if (!ctx.hasUI) return
    turnCount++
    setFoxStatus(ctx, `${FOX} 🐾 #${turnCount}`)
  })

  pi.on('turn_end', (_event, ctx) => {
    if (!ctx.hasUI) return
    setFoxStatus(ctx, `${FOX} ✅ #${turnCount}`)
  })

  pi.on('agent_settled', (_event, ctx) => {
    if (!ctx.hasUI) return
    setFoxStatus(ctx, `${FOX} 💤`)
  })

  pi.on('session_shutdown', (_event, ctx) => {
    if (!ctx.hasUI) return
    setFoxStatus(ctx, undefined)
  })
}
