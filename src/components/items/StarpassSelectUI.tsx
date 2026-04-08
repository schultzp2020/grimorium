import { useMemo, useState } from 'react'

import { getRoleTranslations, useI18n } from '../../lib/i18n'
import type { PipelineInputProps } from '../../lib/pipeline/types'
import { getRole } from '../../lib/roles/registry'
import { isAlive } from '../../lib/types'
import { Button, Icon } from '../atoms'
import { PlayerPickerList } from '../inputs'

/**
 * Pipeline UI component shown when the Imp self-kills with alive minions.
 * The narrator selects which Minion becomes the new Imp.
 */
export function StarpassSelectUI({ state, onComplete }: PipelineInputProps) {
  const { language } = useI18n()
  const impT = getRoleTranslations('imp', language)
  const [selectedMinion, setSelectedMinion] = useState<string | null>(null)

  // Find alive minions
  const aliveMinions = useMemo(
    () =>
      state.players.filter((p) => {
        if (!isAlive(p)) {
          return false
        }
        const role = getRole(p.roleId)
        return role?.team === 'minion'
      }),
    [state.players],
  )

  return (
    <div className='flex min-h-app flex-col items-center justify-center bg-linear-to-b from-red-950 via-grimoire-purple to-grimoire-darker p-6'>
      <div className='w-full max-w-sm'>
        {/* Header */}
        <div className='mb-6 text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10'>
            <Icon name='sparkles' size='2xl' className='text-red-400' />
          </div>
          <h2 className='mb-2 font-tarot text-xl tracking-wider text-parchment-100 uppercase'>
            {impT.selectNewImpTitle}
          </h2>
          <p className='text-sm text-parchment-400'>{impT.selectNewImpDescription}</p>
        </div>

        {/* Minion Selector */}
        <div className='mb-6'>
          <PlayerPickerList
            players={aliveMinions}
            selected={selectedMinion ? [selectedMinion] : []}
            onSelect={setSelectedMinion}
            selectionCount={1}
            variant='red'
          />
        </div>

        {/* Confirm */}
        <Button
          onClick={() => selectedMinion && onComplete(selectedMinion)}
          disabled={!selectedMinion}
          fullWidth
          size='lg'
          variant='evil'
        >
          <Icon name='sparkles' size='md' className='mr-2' />
          {impT.confirmNewImp}
        </Button>
      </div>
    </div>
  )
}
