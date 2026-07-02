/**
 * Avatar Extension
 *
 * Displays a fox avatar image above the editor using the TUI Image component.
 * Only renders in terminals that support inline images (Kitty, iTerm2, Ghostty, WezTerm, Warp).
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import { readFileSync } from 'node:fs'
import { Image, getCapabilities, ImageTheme } from '@earendil-works/pi-tui'
import path from 'path'

// noinspection JSUnusedGlobalSymbols
export default function (pi: ExtensionAPI) {
  pi.on('session_start', async (_event, ctx) => {
    if (ctx.mode !== 'tui') return

    const caps = getCapabilities()
    if (!caps.images) {
      ctx.ui.notify(
        '[avatar]: terminal does not support inline images (needs Kitty, iTerm2, Ghostty, WezTerm or Warp) — widget disabled.',
        'warning',
      )
      return
    }

    const theme = ctx.ui.theme

    // Read and base64-encode the image at runtime
    const imagePath = path.join(import.meta.dirname, 'avatar.png')
    const imageData = readFileSync(imagePath)
    const base64Data = imageData.toString('base64')

    const imageTheme: ImageTheme = {
      fallbackColor: (s: string) => theme.fg('muted', s),
    }

    const image = new Image(base64Data, 'image/png', imageTheme, {
      maxWidthCells: 20,
      maxHeightCells: 7,
      filename: 'avatar.png',
    })

    ctx.ui.setWidget('avatar', (_tui, _theme) => ({
      render: (width: number) => image.render(width),
      invalidate: () => image.invalidate(),
    }))
  })
}
