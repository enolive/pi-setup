/**
 * Avatar Extension
 *
 * Displays a fox avatar image above the editor using the TUI Image component.
 * Only renders in terminals that support inline images (Kitty, iTerm2, Ghostty, WezTerm, Warp).
 */

import { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import { readFileSync } from 'node:fs'
import { Image, getCapabilities, ImageTheme } from '@earendil-works/pi-tui'
import path from 'path'

const imagePath = path.join(import.meta.dirname, 'avatar.png')
const base64Data = readFileSync(imagePath).toString('base64')

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

    const imageTheme: ImageTheme = {
      fallbackColor: (s: string) => theme.fg('muted', s),
    }

    const image = new Image(base64Data, 'image/png', imageTheme, {
      maxHeightCells: 9,
      filename: 'avatar.png',
    })

    ctx.ui.setWidget('avatar', (_tui, _theme) => ({
      render: (width: number) => image.render(width),
      invalidate: () => image.invalidate(),
    }))
  })
}
