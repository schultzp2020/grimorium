import type { FC } from 'react'

import type { IconName } from '../../components/atoms/icon'
import type { InfoRoleConfig } from '../../components/night_steps/InfoRoleNightAction'
import type { TargetActionConfig } from '../../components/night_steps/TargetActionNightAction'
import type { WinConditionCheck } from '../pipeline/types'
import type { TeamId } from '../teams'
import type { Game, GameState, PlayerState } from '../types'
import type {
  EffectToAdd,
  NightActionProps,
  NightStepDefinition,
  RoleDefinition,
  RoleId,
  RoleRevealProps,
  SetupActionProps,
} from './types'

export interface BaseRoleFields {
  id: RoleId
  team: TeamId
  icon: IconName
  firstNightReveal?: 'evil' | 'good'
  initialEffects?: EffectToAdd[]
  winConditions?: WinConditionCheck[]
  distributionModifier?: Partial<Record<TeamId, number>>
  RoleReveal?: FC<RoleRevealProps>
}

export type WakeFn = (game: Game, player: PlayerState) => boolean

export type WakeCondition = 'always' | 'first-night-only' | 'not-first-night' | WakeFn

export interface PassiveSchema {
  category: 'passive'
}

export interface TargetActionSchema {
  category: 'target-action'
  nightOrder: number
  wakeCondition: WakeCondition
  target: TargetActionConfig['target']
  historyKeys: TargetActionConfig['historyKeys']
}

export interface InfoNarratorSetupSchema {
  category: 'info-narrator-setup'
  nightOrder: number
  wakeCondition: WakeCondition
  info: InfoRoleConfig
}

export interface CustomSchema {
  category: 'custom'
  nightOrder: number | null
  wakeCondition?: WakeCondition
  NightAction: FC<NightActionProps> | null
  nightSteps?: NightStepDefinition[]
  SetupAction?: FC<SetupActionProps>
}

export type RoleSchema = PassiveSchema | TargetActionSchema | InfoNarratorSetupSchema | CustomSchema

export function defineRole(schema: BaseRoleFields & PassiveSchema): RoleDefinition
export function defineRole(schema: BaseRoleFields & TargetActionSchema): RoleDefinition
export function defineRole(schema: BaseRoleFields & InfoNarratorSetupSchema): RoleDefinition
export function defineRole(schema: BaseRoleFields & CustomSchema): RoleDefinition
export function defineRole(_schema: BaseRoleFields & RoleSchema): RoleDefinition {
  throw new Error('Not implemented yet')
}
