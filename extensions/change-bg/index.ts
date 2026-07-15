import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'

// OSC 11 sets the terminal's default background; OSC 111 resets it to the
// terminal's configured default. pi renders on the main screen (no alt
// buffer) and does not paint an overall background, so setting the default
// bg is what fills the empty area pi leaves untouched.
const SET_BG = '\x1b]11;#0D0D0D\x1b\\'
const RESET_BG = '\x1b]111\x1b\\'

export default function (pi: ExtensionAPI) {
  pi.on('session_start', async (_event, ctx) => {
    if (ctx.mode !== 'tui') return
    process.stdout.write(SET_BG)
  })

  pi.on('session_shutdown', async (event, ctx) => {
    if (ctx.mode !== 'tui') return
    // Only restore when actually quitting — keep it black across
    // reload / new / resume / fork (session_start re-applies it anyway).
    if (event.reason !== 'quit') return
    process.stdout.write(RESET_BG)
  })
}
