/**
 * Shorten tool ids
 *
 * this is a hack for a bug that occurs in the current pi versions.
 * some models will generate tool call ids with a greater length than what certain other models accept.
 *
 * observed this effect with glm vs azure hosted openai models.
 *
 * will result in the following error message when switching from a glm session to gpt-sol
 *
 * ```json
 * {
 *  "origin": "provider",
 *  "message": "Invalid 'input[1].call_id': string too long. Expected a string with maximum length 64, but got a string with length 83 instead."
 * }
 * ```
 *
 * This extension caps the call id length
 */
import { createHash } from 'node:crypto'
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'

// Azure will refuse anything longer than 64 chars
const MAX_TOOL_CALL_ID_LENGTH = 64

function shorten(id: string): string {
  if (id.length <= MAX_TOOL_CALL_ID_LENGTH) return id
  return `call_${createHash('sha256').update(id).digest('hex')}`.slice(0, MAX_TOOL_CALL_ID_LENGTH)
}

// noinspection JSUnusedGlobalSymbols
export default function (pi: ExtensionAPI) {
  pi.on('context', event => ({
    messages: event.messages.map(msg => {
      if (msg.role === 'assistant' && Array.isArray(msg.content)) {
        return {
          ...msg,
          content: msg.content.map(block => (block.type === 'toolCall' ? { ...block, id: shorten(block.id) } : block)),
        }
      }
      if (msg.role === 'toolResult' && typeof msg.toolCallId === 'string') {
        return { ...msg, toolCallId: shorten(msg.toolCallId) }
      }
      return msg
    }),
  }))
}
