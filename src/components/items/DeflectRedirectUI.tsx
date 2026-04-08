import { useState } from 'react'

import { getRoleTranslations, interpolate, useI18n } from '../../lib/i18n'
import type { KillIntent, PipelineInputProps } from '../../lib/pipeline/types'
import { hasEffect, isAlive } from '../../lib/types'
import { Button, Icon } from '../atoms'
import { PlayerPickerList } from '../inputs'

/**
 * Pipeline UI component shown when a kill is redirected by the Deflect effect.
 * The narrator selects a new target for the kill (or keeps the original).
 */
export function DeflectRedirectUI({ state, intent, onComplete }: PipelineInputProps) {
  const { t, language } = useI18n()
  const impT = getRoleTranslations('imp', language)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const kill = intent as KillIntent

  const originalTarget = state.players.find((p) => p.id === kill.targetId)

  // All alive players except the kill source (the demon) and safe players
  const alivePlayers = state.players.filter((p) => isAlive(p) && p.id !== kill.sourceId && !hasEffect(p, 'safe'))

  return (
    <div className='flex min-h-app flex-col items-center justify-center bg-gradient-to-b from-red-950 via-grimoire-purple to-grimoire-darker p-6'>
      <div className='w-full max-w-sm'>
        {/* Header */}
        <div className='mb-6 text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10'>
            <Icon name='trendingUpDown' size='2xl' className='text-amber-400' />
          </div>
          <h2 className='mb-2 font-tarot text-xl tracking-wider text-parchment-100 uppercase'>{impT.deflectTitle}</h2>
          <p className='text-sm text-parchment-400'>
            {interpolate(impT.deflectDescription, {
              target: originalTarget?.name ?? '?',
            })}
          </p>
        </div>

        {/* Player Selector */}
        <div className='mb-6'>
          <PlayerPickerList
            players={alivePlayers}
            selected={selectedTarget ? [selectedTarget] : []}
            onSelect={setSelectedTarget}
            selectionCount={1}
            variant='red'
          />
        </div>

        {/* Confirm */}
        <Button
          onClick={() => selectedTarget && onComplete(selectedTarget)}
          disabled={!selectedTarget}
          fullWidth
          size='lg'
          variant='evil'
        >
          <Icon name='skull' size='md' className='mr-2' />
          {t.common.confirm}
        </Button>
      </div>
    </div>
  )
}
