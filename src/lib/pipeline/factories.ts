import type { FC } from 'react'

import type { GameState, PlayerState } from '../types'
import type { Intent, IntentHandler, KillIntent, PipelineInputProps } from './types'

export interface ProtectionHandlerConfig {
  /** Must be 'kill' -- these factories are structurally KillIntent-specific */
  intentType: 'kill'
  priority: number
  /** Defaults to matching intent.targetId === effectPlayer.id */
  appliesTo?: (intent: Intent, player: PlayerState, state: GameState) => boolean
  reason: string
  /** Reason stored in history data; defaults to `reason` if omitted */
  historyDataReason?: string
  historyKey: string
}

export function createProtectionHandler(config: ProtectionHandlerConfig): IntentHandler {
  const defaultAppliesTo = (intent: Intent, effectPlayer: PlayerState, _state: GameState): boolean =>
    intent.type === config.intentType && 'targetId' in intent && intent.targetId === effectPlayer.id

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
                reason: config.historyDataReason ?? config.reason,
              },
            },
          ],
        },
      }
    },
  }
}

export interface RedirectHandlerConfig {
  /** Must be 'kill' -- these factories are structurally KillIntent-specific */
  intentType: 'kill'
  priority: number
  UIComponent: FC<PipelineInputProps>
  historyKey: string
  /** Defaults to matching intent.targetId === effectPlayer.id */
  appliesTo?: (intent: Intent, player: PlayerState, state: GameState) => boolean
}

export function createRedirectHandler(config: RedirectHandlerConfig): IntentHandler {
  const defaultAppliesTo = (intent: Intent, effectPlayer: PlayerState, _state: GameState): boolean =>
    intent.type === config.intentType && 'targetId' in intent && intent.targetId === effectPlayer.id

  return {
    intentType: config.intentType,
    priority: config.priority,
    appliesTo: config.appliesTo ?? defaultAppliesTo,
    handle: (intent, effectPlayer) => {
      const kill = intent as KillIntent
      return {
        action: 'request_ui',
        UIComponent: config.UIComponent,
        resume: (newTargetId: unknown) => {
          const targetId = newTargetId as string

          if (targetId === effectPlayer.id) {
            return { action: 'allow' }
          }

          return {
            action: 'redirect',
            newIntent: { ...kill, targetId },
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
                        redirect: targetId,
                      },
                    },
                  ],
                  data: {
                    action: 'kill_redirected',
                    sourceId: kill.sourceId,
                    originalTargetId: effectPlayer.id,
                    redirectTargetId: targetId,
                  },
                },
              ],
            },
          }
        },
      }
    },
  }
}
