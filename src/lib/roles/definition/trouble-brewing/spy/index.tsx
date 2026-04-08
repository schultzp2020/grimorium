import { useState } from 'react'

import { Button, Icon } from '../../../../../components/atoms'
import { EvilTeamReveal } from '../../../../../components/items/EvilTeamReveal'
import { Grimoire } from '../../../../../components/items/Grimoire'
import {
  HandbackButton,
  NightActionLayout,
  NightStepListLayout,
  PlayerFacingScreen,
} from '../../../../../components/layouts'
import type { NightStep } from '../../../../../components/layouts'
import { isMalfunctioning } from '../../../../effects/registry'
import { getRoleName, getRoleTranslations, registerRoleTranslations, useI18n } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import type { NightActionProps, NightStepDefinition } from '../../../types'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('spy', 'en', en)
registerRoleTranslations('spy', 'es', es)

type Phase = 'step_list' | 'show_evil_team' | 'view_grimoire'

/**
 * The Spy — Minion role.
 *
 * First night: Shown the evil team (other Minions + Demon), then views
 * the Grimoire.
 *
 * Subsequent nights: Views the Grimoire only.
 *
 * You might register as good & as a Townsfolk or Outsider, even if you
 * are dead. Misregistration is handled by the `misregister` effect.
 *
 * When malfunctioning (Poisoned/Drunk), the Spy does NOT see the
 * Grimoire. The narrator handles deception manually.
 */
const spyNightSteps: NightStepDefinition[] = [
  {
    id: 'show_evil_team',
    icon: 'swords',
    getLabel: (t) => t.game.stepShowEvilTeam,
    condition: (_game, _player, state) => state.round === 1,
    audience: 'player_reveal',
  },
  {
    id: 'view_grimoire',
    icon: 'bookUser',
    getLabel: (t) => t.game.stepViewGrimoire,
    audience: 'player_reveal',
  },
]

function SpyNightAction({ state, player, onComplete, onOpenGrimoire }: NightActionProps) {
  const { t, language } = useI18n()
  const [phase, setPhase] = useState<Phase>('step_list')
  const [showEvilTeamDone, setShowEvilTeamDone] = useState(false)

  const isFirstNight = state.round === 1
  const malfunctioning = isMalfunctioning(player)
  const roleT = getRoleTranslations('spy', language)

  const handleComplete = () => {
    onComplete({
      entries: [
        {
          type: 'night_action',
          message: [
            {
              type: 'i18n',
              key: 'roles.spy.history.viewedGrimoire',
              params: { player: player.id },
            },
          ],
          data: {
            roleId: 'spy',
            playerId: player.id,
            action: 'view_grimoire',
            ...(malfunctioning ? { malfunctioned: true } : {}),
          },
        },
      ],
    })
  }

  // ================================================================
  // RENDER: Step List
  // ================================================================

  if (phase === 'step_list') {
    const steps: NightStep[] = []

    if (isFirstNight) {
      steps.push({
        id: 'show_evil_team',
        icon: 'swords',
        label: t.game.stepShowEvilTeam,
        status: showEvilTeamDone ? 'done' : 'pending',
        audience: 'player_reveal' as const,
      })
    }

    steps.push({
      id: 'view_grimoire',
      icon: 'bookUser',
      label: t.game.stepViewGrimoire,
      status: 'pending',
      audience: 'player_reveal' as const,
    })

    return (
      <NightStepListLayout
        icon='hatGlasses'
        roleName={getRoleName('spy', language)}
        playerName={player.name}
        isEvil
        steps={steps}
        onSelectStep={(stepId) => setPhase(stepId as Phase)}
      />
    )
  }

  // ================================================================
  // RENDER: Show Evil Team (first night, player-facing)
  // ================================================================

  if (phase === 'show_evil_team') {
    return (
      <PlayerFacingScreen playerName={player.name}>
        <NightActionLayout player={player} title={roleT.evilTeamTitle} description={roleT.evilTeamDescription}>
          <div className='mb-6'>
            <EvilTeamReveal state={state} viewer={player} viewerType='minion' />
          </div>

          <HandbackButton
            onClick={() => {
              setShowEvilTeamDone(true)
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

  // ================================================================
  // RENDER: Malfunctioning — don't show real Grimoire
  // ================================================================

  if (malfunctioning) {
    return (
      <NightActionLayout
        player={player}
        title={roleT.spyMalfunctionTitle}
        description={roleT.spyMalfunctionDescription}
        audience='narrator'
      >
        <div className='mb-6 text-center'>
          <div className='inline-flex items-center gap-2 rounded-lg border border-amber-600/30 bg-amber-900/30 px-4 py-2'>
            <Icon name='flask' size='md' className='text-amber-400' />
            <span className='text-sm font-medium text-amber-200'>{t.game.malfunctionWarning}</span>
          </div>
        </div>

        <Button onClick={handleComplete} fullWidth size='lg' variant='evil'>
          <Icon name='check' size='md' className='mr-2' />
          {t.common.continue}
        </Button>
      </NightActionLayout>
    )
  }

  // ================================================================
  // RENDER: View Grimoire (player-facing)
  // Uses shared Grimoire; when a player is tapped, opens modal (read-only, no Edit effects)
  // ================================================================

  return (
    <PlayerFacingScreen playerName={player.name}>
      <NightActionLayout player={player} title={roleT.spyGrimoireTitle} description={roleT.spyGrimoireDescription}>
        <div className='mb-6'>
          <Grimoire
            state={state}
            onPlayerSelect={(p) => onOpenGrimoire?.({ view: 'player_detail', player: p }, true)}
          />
        </div>

        <HandbackButton onClick={handleComplete} fullWidth size='lg' variant='evil'>
          <Icon name='check' size='md' className='mr-2' />
          {t.common.continue}
        </HandbackButton>
      </NightActionLayout>
    </PlayerFacingScreen>
  )
}

export default defineRole({
  id: 'spy',
  category: 'custom',
  team: 'minion',
  icon: 'hatGlasses',
  nightOrder: 36,
  wakeCondition: 'always',
  initialEffects: [
    {
      type: 'misregister',
      expiresAt: 'never',
      data: {
        canRegisterAs: {
          teams: ['townsfolk', 'outsider'],
          alignments: ['good'],
        },
      },
    },
  ],
  nightSteps: spyNightSteps,
  NightAction: SpyNightAction,
})
