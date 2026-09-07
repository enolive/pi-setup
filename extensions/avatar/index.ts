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

/** pi-tui BoundedTerminalWriter splits stdout writes > 1 MiB mid-APC → base64 leak. */
const MAX_IMAGE_BASE64_CHARS = 1024 * 1024

// noinspection JSUnusedGlobalSymbols
export default function (pi: ExtensionAPI) {
  const caps = getCapabilities()
  if (!caps.images) {
    console.warn(
      '[avatar] terminal does not support inline images (needs Kitty, iTerm2, Ghostty, WezTerm or Warp) — widget disabled.',
    )
    return
  }

  const imagePath = path.join(import.meta.dirname, 'avatar.png')
  const base64Data = readFileSync(imagePath).toString('base64')

  if (base64Data.length > MAX_IMAGE_BASE64_CHARS) {
    throw new Error(
      `[avatar] avatar.png too large (${Math.round(base64Data.length / 1024)} KB base64 > 1 MiB). Shrink it.`,
    )
  }

  pi.on('session_start', (_event, ctx) => {
    if (ctx.mode !== 'tui') return
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
