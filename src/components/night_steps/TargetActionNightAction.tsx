import { useState } from 'react'

import { isMalfunctioning } from '../../lib/effects/registry'
import { getRoleName, getRoleTranslations, interpolate, useI18n } from '../../lib/i18n'
import type { Intent } from '../../lib/pipeline/types'
import type { EffectToAdd, NightActionProps, NightActionResult } from '../../lib/roles/types'
import { isEvilTeam } from '../../lib/teams'
import type { TeamId } from '../../lib/teams'
import { isAlive } from '../../lib/types'
import type { Game, GameState, PlayerState } from '../../lib/types'
import { Button, Icon } from '../atoms'
import type { IconName } from '../atoms/icon'
import { PlayerPickerList } from '../inputs'
import { InfoBox } from '../items'
import { EvilTeamReveal } from '../items/EvilTeamReveal'
import { HandbackButton, NightActionLayout, NightStepListLayout, PlayerFacingScreen } from '../layouts'
import type { NightStep } from '../layouts'

export type TargetFilterFn = (player: PlayerState, self: PlayerState, state: GameState, game: Game) => boolean

export interface TargetConfig {
  filter: 'alive-others' | 'alive-all' | 'dead' | TargetFilterFn
  applyEffect?: EffectToAdd
  applyEffectTo?: 'target' | 'self'
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

export function resolveTargetFilter(
  filter: TargetConfig['filter'],
  self: PlayerState,
  state: GameState,
  game: Game,
): PlayerState[] {
  if (typeof filter === 'function') {
    return state.players.filter((p) => filter(p, self, state, game))
  }
  switch (filter) {
    case 'alive-others': {
      return state.players.filter((p) => isAlive(p) && p.id !== self.id)
    }
    case 'alive-all': {
      return state.players.filter((p) => isAlive(p))
    }
    case 'dead': {
      return state.players.filter((p) => !isAlive(p))
    }
  }
}

export function buildTargetActionResult(
  config: TargetActionConfig,
  player: PlayerState,
  targetId: string,
  isFirstNight: boolean,
  malfunctioning: boolean,
): NightActionResult {
  const entries: NightActionResult['entries'] = []

  if (isFirstNight && config.firstNightReveal && config.historyKeys.shownTeam) {
    entries.push({
      type: 'night_action',
      message: [
        {
          type: 'i18n',
          key: config.historyKeys.shownTeam,
          params: { player: player.id },
        },
      ],
      data: {
        roleId: config.roleId,
        playerId: player.id,
        action: 'first_night_info',
      },
    })
  }

  entries.push({
    type: 'night_action',
    message: [
      {
        type: 'i18n',
        key: config.historyKeys.action,
        params: { player: player.id, target: targetId },
      },
    ],
    data: {
      roleId: config.roleId,
      playerId: player.id,
      targetId,
      ...(malfunctioning ? { malfunctioned: true } : {}),
    },
  })

  const skipDueToMalfunction = malfunctioning && config.target.skipWhenMalfunctioning

  let addEffects: Record<string, EffectToAdd[]> | undefined
  if (config.target.applyEffect && !skipDueToMalfunction) {
    const effectTarget = config.target.applyEffectTo === 'self' ? player.id : targetId
    const effectToAdd: EffectToAdd = { ...config.target.applyEffect }

    if (config.target.applyEffectTo === 'self' && config.target.effectTargetDataKey) {
      effectToAdd.data = {
        ...effectToAdd.data,
        [config.target.effectTargetDataKey]: targetId,
      }
    }

    if (config.target.applyEffectTo !== 'self') {
      effectToAdd.sourcePlayerId = player.id
    }

    addEffects = { [effectTarget]: [effectToAdd] }
  }

  let removeEffects: Record<string, string[]> | undefined
  const shouldAutoReplace = config.target.autoReplaceEffect ?? false
  if (shouldAutoReplace && config.target.applyEffect) {
    const effectOwner = config.target.applyEffectTo === 'self' ? player.id : targetId
    removeEffects = { [effectOwner]: [config.target.applyEffect.type] }
  }

  let intent: Intent | undefined
  if (config.target.emitIntent && !skipDueToMalfunction) {
    intent = {
      type: config.target.emitIntent.type,
      sourceId: player.id,
      targetId,
      cause: config.target.emitIntent.cause,
    }
  }

  return {
    entries,
    ...(addEffects ? { addEffects } : {}),
    ...(removeEffects ? { removeEffects } : {}),
    ...(intent ? { intent } : {}),
  }
}

export function TargetActionNightAction({
  config,
  game,
  state,
  player,
  onComplete,
}: { config: TargetActionConfig } & NightActionProps) {
  const { t, language } = useI18n()
  const roleT = getRoleTranslations(config.roleId, language)

  type Phase = 'step_list' | 'show_team' | 'choose_target'
  const [phase, setPhase] = useState<Phase>('step_list')
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [showTeamDone, setShowTeamDone] = useState(false)

  const isFirstNight = state.round === 1
  const isEvil = isEvilTeam(config.team)
  const malfunctioning = isMalfunctioning(player)

  const eligibleTargets = resolveTargetFilter(config.target.filter, player, state, game)

  const handleConfirm = () => {
    if (!selectedTarget) {
      return
    }

    const target = state.players.find((p) => p.id === selectedTarget)
    if (!target) {
      return
    }

    const result = buildTargetActionResult(config, player, selectedTarget, isFirstNight, malfunctioning)
    onComplete(result)
  }

  const handleSkipNoTargets = () => {
    onComplete({
      entries: [
        {
          type: 'night_action',
          message: [
            {
              type: 'i18n',
              key: 'history.noEligibleTargetsAction',
              params: { role: config.roleId },
            },
          ],
          data: {
            roleId: config.roleId,
            playerId: player.id,
            action: 'no_targets',
          },
        },
      ],
    })
  }

  if (phase === 'step_list') {
    const steps: NightStep[] = []

    if (isFirstNight && config.firstNightReveal) {
      steps.push({
        id: 'show_team',
        icon: 'swords',
        label: t.game.stepShowEvilTeam,
        status: showTeamDone ? 'done' : 'pending',
        audience: 'player_reveal' as const,
      })
    }

    steps.push({
      id: 'choose_target',
      icon: config.icon,
      label: t.game.stepChoosePlayer,
      status: 'pending',
      audience: 'player_choice' as const,
    })

    return (
      <NightStepListLayout
        icon={config.icon}
        roleName={getRoleName(config.roleId, language)}
        playerName={player.name}
        isEvil={isEvil}
        steps={steps}
        onSelectStep={(stepId) => setPhase(stepId as Phase)}
      />
    )
  }

  if (phase === 'show_team') {
    const viewerType = config.team === 'demon' ? 'demon' : 'minion'
    return (
      <PlayerFacingScreen playerName={player.name}>
        <NightActionLayout player={player} title={roleT.evilTeamTitle} description={roleT.evilTeamDescription}>
          <div className='mb-6'>
            <EvilTeamReveal state={state} viewer={player} viewerType={viewerType} />
          </div>

          <HandbackButton
            onClick={() => {
              setShowTeamDone(true)
              setPhase('step_list')
            }}
            fullWidth
            size='lg'
            variant='evil'
          >
            <Icon name='check' size='md' className='mr-2' />
            {t.common.continue}
          </HandbackButton>
        </NightActionLayout>
      </PlayerFacingScreen>
    )
  }

  if (eligibleTargets.length === 0) {
    return (
      <NightActionLayout
        player={player}
        title={roleT.info}
        description={t.game.noEligibleTargetsDescription}
        audience='player_choice'
      >
        <div className='flex flex-1 items-center justify-center'>
          <InfoBox
            icon={config.icon}
            title={t.game.noEligibleTargets}
            description={t.game.noEligibleTargetsDescription}
          />
        </div>

        <Button onClick={handleSkipNoTargets} fullWidth size='lg' variant={isEvil ? 'evil' : 'night'}>
          <Icon name='check' size='md' className='mr-2' />
          {t.common.confirm}
        </Button>
      </NightActionLayout>
    )
  }

  return (
    <NightActionLayout
      player={player}
      title={roleT.info}
      description={roleT.selectTarget ? interpolate(roleT.selectTarget, { player: player.name }) : ''}
      audience='player_choice'
    >
      <div className='mb-6'>
        <PlayerPickerList
          players={eligibleTargets}
          selected={selectedTarget ? [selectedTarget] : []}
          onSelect={setSelectedTarget}
          selectionCount={1}
          variant={isEvil ? 'red' : 'blue'}
        />
      </div>

      <Button
        onClick={handleConfirm}
        disabled={!selectedTarget}
        fullWidth
        size='lg'
        variant={isEvil ? 'evil' : 'night'}
      >
        <Icon name={config.icon} size='md' className='mr-2' />
        {t.common.confirm}
      </Button>
    </NightActionLayout>
  )
}
