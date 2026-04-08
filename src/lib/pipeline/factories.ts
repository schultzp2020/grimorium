import type { GameState, PlayerState } from '../types'
import type { Intent, IntentHandler, KillIntent } from './types'

export interface ProtectionHandlerConfig {
  /** Must be 'kill' -- these factories are structurally KillIntent-specific */
  intentType: 'kill'
  priority: number
  /** Defaults to matching intent.targetId === effectPlayer.id */
  appliesTo?: (intent: Intent, player: PlayerState, state: GameState) => boolean
  reason: string
  /** Reason stored in history data; defaults to `reason` if omitted */
  dataReason?: string
  historyKey: string
}

export function createProtectionHandler(config: ProtectionHandlerConfig): IntentHandler {
  const defaultAppliesTo = (intent: Intent, effectPlayer: PlayerState, _state: GameState): boolean =>
    'targetId' in intent && intent.targetId === effectPlayer.id

  return {
    intentType: config.intentType,
    priority: config.priority,
    appliesTo: config.appliesTo ?? defaultAppliesTo,
    handle: (intent, effectPlayer) => {
      const kill = intent as KillIntent
      return {
        action: 'prevent',
        reason: config.reason,
        stateChanges: {
          entries: [
            {
              type: 'night_action',
              message: [
                {
                  type: 'i18n',
                  key: config.historyKey,
                  params: {
                    player: kill.sourceId,
                    target: effectPlayer.id,
                  },
                },
              ],
              data: {
                action: 'kill_failed',
                sourceId: kill.sourceId,
                targetId: effectPlayer.id,
                reason: config.dataReason ?? config.reason,
              },
            },
          ],
        },
      }
    },
  }
}
