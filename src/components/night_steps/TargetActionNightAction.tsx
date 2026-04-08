import type { EffectToAdd, NightActionProps } from '../../lib/roles/types'
import type { TeamId } from '../../lib/teams'
import type { Game, GameState, PlayerState } from '../../lib/types'
import type { IconName } from '../atoms/icon'

export type TargetFilterFn = (player: PlayerState, self: PlayerState, state: GameState, game: Game) => boolean

export interface TargetConfig {
  /** Number of targets to select. Default: 1 */
  count?: number | { min: number; max: number }
  /** Filter for eligible targets */
  filter: 'alive-others' | 'alive-all' | 'dead' | TargetFilterFn
  /** Memory constraint — prevent selecting same target as last night */
  memory?: 'different-from-last'
  applyEffect?: EffectToAdd
  /** 'target' (default) applies to selected player, 'self' applies to the acting player */
  applyEffectTo?: 'target' | 'self'
  /** When applyEffectTo is 'self', stores targetId in effect data under this key */
  effectTargetDataKey?: string
  emitIntent?: { type: 'kill'; cause: string }
  skipWhenMalfunctioning?: boolean
  autoReplaceEffect?: boolean
}

export interface TargetActionConfig {
  roleId: string
  icon: IconName
  team: TeamId
  target: TargetConfig
  firstNightReveal?: 'evil' | 'good'
  historyKeys: {
    action: string
    shownTeam?: string
  }
}

// Placeholder — component implementation follows in A2-A5
export function TargetActionNightAction(_props: { config: TargetActionConfig } & NightActionProps): JSX.Element {
  throw new Error('Not implemented yet')
}
