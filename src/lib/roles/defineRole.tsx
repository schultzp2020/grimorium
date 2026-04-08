import type { FC } from 'react'
import { useState } from 'react'

import { Icon } from '../../components/atoms'
import type { IconName } from '../../components/atoms/icon'
import { DefaultRoleReveal } from '../../components/items/DefaultRoleReveal'
import { EvilTeamReveal } from '../../components/items/EvilTeamReveal'
import { HandbackButton, NightActionLayout, NightStepListLayout, PlayerFacingScreen } from '../../components/layouts'
import type { NightStep } from '../../components/layouts'
import { InfoRoleNightAction, type InfoRoleConfig } from '../../components/night_steps/InfoRoleNightAction'
import { TargetActionNightAction, type TargetActionConfig } from '../../components/night_steps/TargetActionNightAction'
import { getRoleName, getRoleTranslations, useI18n } from '../i18n'
import type { Translations } from '../i18n/types'
import type { WinConditionCheck } from '../pipeline/types'
import { isEvilTeam } from '../teams'
import type { TeamId } from '../teams'
import { isAlive } from '../types'
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

function resolveWakeCondition(wakeCondition: WakeCondition): (game: Game, player: PlayerState) => boolean {
  if (typeof wakeCondition === 'function') {
    return wakeCondition
  }
  switch (wakeCondition) {
    case 'always': {
      return (_game, player) => isAlive(player)
    }
    case 'first-night-only': {
      return (game, player) => isAlive(player) && (game.history.at(-1)?.stateAfter.round ?? 0) === 1
    }
    case 'not-first-night': {
      return (game, player) => isAlive(player) && (game.history.at(-1)?.stateAfter.round ?? 0) > 1
    }
  }
}

const FIRST_NIGHT_REVEAL_ORDER = 4

function buildFirstNightRevealNightAction(roleId: string, icon: IconName, team: TeamId): FC<NightActionProps> {
  return function FirstNightRevealNightAction({ state, player, onComplete }: NightActionProps) {
    const { t, language } = useI18n()
    const [phase, setPhase] = useState<'step_list' | 'show_team'>('step_list')
    const roleT = getRoleTranslations(roleId, language)
    const evil = isEvilTeam(team)

    const handleComplete = () => {
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: `roles.${roleId}.history.shownEvilTeam`,
                params: { player: player.id },
              },
            ],
            data: {
              roleId,
              playerId: player.id,
              action: 'first_night_info',
            },
          },
        ],
      })
    }

    if (phase === 'step_list') {
      const steps: NightStep[] = [
        {
          id: 'show_team',
          icon: 'swords',
          label: t.game.stepShowEvilTeam,
          status: 'pending',
          audience: 'player_reveal' as const,
        },
      ]

      return (
        <NightStepListLayout
          icon={icon}
          roleName={getRoleName(roleId, language)}
          playerName={player.name}
          isEvil={evil}
          steps={steps}
          onSelectStep={() => setPhase('show_team')}
        />
      )
    }

    const viewerType = team === 'demon' ? 'demon' : 'minion'

    return (
      <PlayerFacingScreen playerName={player.name}>
        <NightActionLayout player={player} title={roleT.evilTeamTitle} description={roleT.evilTeamDescription}>
          <div className='mb-6'>
            <EvilTeamReveal state={state} viewer={player} viewerType={viewerType} />
          </div>

          <HandbackButton onClick={handleComplete} fullWidth size='lg' variant='evil'>
            <Icon name='check' size='md' className='mr-2' />
            {t.common.continue}
          </HandbackButton>
        </NightActionLayout>
      </PlayerFacingScreen>
    )
  }
}

type BaseFields = Pick<
  RoleDefinition,
  'id' | 'team' | 'icon' | 'initialEffects' | 'winConditions' | 'distributionModifier' | 'RoleReveal'
>

function buildPassiveRole(base: BaseFields, schema: BaseRoleFields & PassiveSchema): RoleDefinition {
  if (schema.firstNightReveal) {
    return {
      ...base,
      nightOrder: FIRST_NIGHT_REVEAL_ORDER,
      shouldWake: (game) => {
        const state = game.history.at(-1)?.stateAfter
        return state?.round === 1
      },
      NightAction: buildFirstNightRevealNightAction(schema.id, schema.icon, schema.team),
      nightSteps: [
        {
          id: 'show_evil_team',
          icon: 'swords',
          getLabel: (t: Translations) => t.game.stepShowEvilTeam,
          condition: (_game: Game, _player: PlayerState, state: GameState) => state.round === 1,
          audience: 'player_reveal',
        },
      ],
    }
  }

  return {
    ...base,
    nightOrder: null,
    NightAction: null,
  }
}

function buildTargetActionRole(base: BaseFields, schema: BaseRoleFields & TargetActionSchema): RoleDefinition {
  const config: TargetActionConfig = {
    roleId: schema.id,
    icon: schema.icon,
    team: schema.team,
    target: schema.target,
    firstNightReveal: schema.firstNightReveal,
    historyKeys: schema.historyKeys,
  }

  const nightSteps: NightStepDefinition[] = []

  if (schema.firstNightReveal) {
    nightSteps.push({
      id: 'show_team',
      icon: 'swords',
      getLabel: (t: Translations) => t.game.stepShowEvilTeam,
      condition: (_game: Game, _player: PlayerState, state: GameState) => state.round === 1,
      audience: 'player_reveal',
    })
  }

  nightSteps.push({
    id: 'choose_target',
    icon: schema.icon,
    getLabel: (t: Translations) => t.game.stepChoosePlayer,
    audience: 'player_choice',
  })

  return {
    ...base,
    nightOrder: schema.nightOrder,
    shouldWake: resolveWakeCondition(schema.wakeCondition),
    nightSteps,
    NightAction: (props: NightActionProps) => <TargetActionNightAction config={config} {...props} />,
  }
}

function buildInfoNarratorSetupRole(
  base: BaseFields,
  schema: BaseRoleFields & InfoNarratorSetupSchema,
): RoleDefinition {
  return {
    ...base,
    nightOrder: schema.nightOrder,
    shouldWake: resolveWakeCondition(schema.wakeCondition),
    NightAction: (props: NightActionProps) => <InfoRoleNightAction config={schema.info} {...props} />,
  }
}

function buildCustomRole(base: BaseFields, schema: BaseRoleFields & CustomSchema): RoleDefinition {
  return {
    ...base,
    nightOrder: schema.nightOrder,
    shouldWake: schema.wakeCondition ? resolveWakeCondition(schema.wakeCondition) : undefined,
    NightAction: schema.NightAction,
    nightSteps: schema.nightSteps,
    SetupAction: schema.SetupAction,
  }
}

export function defineRole(schema: BaseRoleFields & PassiveSchema): RoleDefinition
export function defineRole(schema: BaseRoleFields & TargetActionSchema): RoleDefinition
export function defineRole(schema: BaseRoleFields & InfoNarratorSetupSchema): RoleDefinition
export function defineRole(schema: BaseRoleFields & CustomSchema): RoleDefinition
export function defineRole(schema: BaseRoleFields & RoleSchema): RoleDefinition {
  const base: BaseFields = {
    id: schema.id,
    team: schema.team,
    icon: schema.icon,
    initialEffects: schema.initialEffects,
    winConditions: schema.winConditions,
    distributionModifier: schema.distributionModifier,
    RoleReveal: schema.RoleReveal ?? DefaultRoleReveal,
  }

  switch (schema.category) {
    case 'passive': {
      return buildPassiveRole(base, schema)
    }
    case 'target-action': {
      return buildTargetActionRole(base, schema)
    }
    case 'info-narrator-setup': {
      return buildInfoNarratorSetupRole(base, schema)
    }
    case 'custom': {
      return buildCustomRole(base, schema)
    }
  }
}
