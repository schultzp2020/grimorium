import { useState } from 'react'

import { isMalfunctioning } from '../../lib/effects/registry'
import { useI18n } from '../../lib/i18n'
import type { DayActionProps } from '../../lib/pipeline/types'
import { getRole } from '../../lib/roles/registry'
import { isAlive } from '../../lib/types'
import { BackButton, Button, Icon } from '../atoms'
import { PlayerPickerList } from '../inputs'
import { MysticDivider } from '../items'
import { ScreenFooter } from '../layouts/ScreenFooter'

/**
 * Day action component for the Slayer's ability.
 * The Slayer picks a target to shoot. If the target is the Demon, they die.
 */
export function SlayerActionScreen({ state, playerId, onComplete, onBack }: DayActionProps) {
  const { t } = useI18n()
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)

  const slayer = state.players.find((p) => p.id === playerId)
  const alivePlayers = state.players.filter((p) => isAlive(p))

  const handleConfirm = () => {
    if (!selectedTarget || !slayer) {
      return
    }

    const target = state.players.find((p) => p.id === selectedTarget)
    if (!target) {
      return
    }

    const targetRole = getRole(target.roleId)
    // When malfunctioning, the shot always misses
    const isDemon = !isMalfunctioning(slayer) && targetRole?.team === 'demon'

    if (isDemon) {
      onComplete({
        entries: [
          {
            type: 'slayer_shot',
            message: [
              {
                type: 'i18n',
                key: 'roles.slayer.history.killedDemon',
                params: {
                  slayer: playerId,
                  target: selectedTarget,
                },
              },
            ],
            data: {
              slayerId: playerId,
              targetId: selectedTarget,
              hit: true,
            },
          },
        ],
        addEffects: {
          [selectedTarget]: [{ type: 'dead', expiresAt: 'never' }],
        },
        removeEffects: { [playerId]: ['slayer_bullet'] },
      })
    } else {
      onComplete({
        entries: [
          {
            type: 'slayer_shot',
            message: [
              {
                type: 'i18n',
                key: 'roles.slayer.history.missed',
                params: {
                  slayer: playerId,
                  target: selectedTarget,
                },
              },
            ],
            data: {
              slayerId: playerId,
              targetId: selectedTarget,
              hit: false,
              ...(isMalfunctioning(slayer) ? { malfunctioned: true } : {}),
            },
          },
        ],
        removeEffects: { [playerId]: ['slayer_bullet'] },
      })
    }
  }

  return (
    <div className='flex min-h-app flex-col bg-linear-to-b from-amber-950 via-orange-950 to-grimoire-dark'>
      {/* Header */}
      <div className='bg-linear-to-b from-amber-900/50 to-transparent px-4 py-4'>
        <div className='mx-auto max-w-lg'>
          <div className='mb-4 flex items-center'>
            <BackButton onClick={onBack} />
            <span className='ml-1 text-xs text-parchment-500'>{t.common.back}</span>
          </div>

          <div className='text-center'>
            <div className='mb-2 flex justify-center'>
              <Icon name='crosshair' size='3xl' className='text-glow-red text-red-400' />
            </div>
            <h1 className='font-tarot text-2xl tracking-widest-xl text-parchment-100 uppercase'>
              {t.game.slayerAction}
            </h1>
            <p className='text-sm text-parchment-400'>{t.game.slayerActionDescription}</p>
            {slayer && <p className='mt-1 text-sm font-medium text-amber-400'>{slayer.name}</p>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 pb-4'>
        <MysticDivider className='mb-6' />

        {/* Select Target */}
        <div className='mb-6'>
          <div className='mb-3 flex items-center gap-2 px-1'>
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-red-700 text-sm font-bold text-parchment-100'>
              1
            </span>
            <span className='font-tarot text-sm tracking-wider text-parchment-100 uppercase'>
              {t.game.selectTarget}
            </span>
          </div>
          <PlayerPickerList
            players={alivePlayers}
            selected={selectedTarget ? [selectedTarget] : []}
            onSelect={setSelectedTarget}
            selectionCount={1}
            variant='red'
          />
        </div>
      </div>

      {/* Footer */}
      <ScreenFooter borderColor='border-red-500/30'>
        <Button onClick={handleConfirm} disabled={!selectedTarget} fullWidth size='lg' variant='slayer'>
          <Icon name='crosshair' size='md' className='mr-2' />
          {t.game.confirmSlayerShot}
        </Button>
      </ScreenFooter>
    </div>
  )
}
