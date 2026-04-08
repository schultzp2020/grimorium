import { useState } from 'react'

import { Button, Icon } from '../../../../components/atoms'
import { getEffectTranslations, registerEffectTranslations } from '../../../i18n'
import type { Language } from '../../../i18n'
import type { EffectConfigEditorProps, EffectDefinition } from '../../types'
import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('butler_master', 'en', en)
registerEffectTranslations('butler_master', 'es', es)

function ButlerMasterConfigEditor({ data, state, playerId, language, onSave, onCancel }: EffectConfigEditorProps) {
  const t = getEffectTranslations('butler_master', language as Language)
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(
    (data?.masterId as string | undefined) ?? null,
  )

  // Show all players except the Butler themselves
  const players = state.players.filter((p) => p.id !== playerId)

  const handleSave = () => {
    if (!selectedMasterId) {
      return
    }
    onSave({ ...data, masterId: selectedMasterId })
  }

  return (
    <div className='space-y-4'>
      <p className='text-xs font-bold tracking-wider text-parchment-300 uppercase'>{t.configSelectMaster}</p>
      <div className='max-h-48 space-y-1 overflow-y-auto'>
        {players.map((p) => {
          const isSelected = selectedMasterId === p.id
          return (
            <button
              type='button'
              key={p.id}
              onClick={() => setSelectedMasterId(p.id)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                isSelected
                  ? 'border-violet-400/50 bg-violet-500/20 text-violet-200'
                  : 'border-white/10 bg-white/5 text-parchment-300 hover:border-white/30'
              }`}
            >
              <Icon
                name={isSelected ? 'circleDot' : 'circle'}
                size='sm'
                className={isSelected ? 'text-violet-400' : 'text-parchment-500'}
              />
              <span>{p.name}</span>
            </button>
          )
        })}
      </div>

      <div className='flex gap-2 pt-2'>
        <Button onClick={onCancel} variant='ghost' className='flex-1'>
          {t.configCancel}
        </Button>
        <Button onClick={handleSave} variant='primary' className='flex-1' disabled={!selectedMasterId}>
          {t.configSave}
        </Button>
      </div>
    </div>
  )
}

import { hasEffect } from '../../../types'

/**
 * Butler Master — marks which player is the Butler's chosen master.
 *
 * The Butler may only vote if their master is also voting.
 * This effect is applied to the Butler (not the master) each night
 * and stores the master's player ID in `data.masterId`.
 *
 * Voting restriction is enforced visually in VotingPhase — the narrator
 * sees a prominent indicator and manually enforces the rule, consistent
 * with how the physical game works.
 */
const definition: EffectDefinition = {
  id: 'butler_master',
  icon: 'handHeart',
  defaultType: 'marker',
  ConfigEditor: ButlerMasterConfigEditor,
  preventsVoting: true,
  canVote: (player, _state, votes) => {
    // If the Butler is dead, they lose their ability, so the restriction lifts
    if (hasEffect(player, 'dead')) {
      return true
    }

    // If we're not in an active voting session or don't have vote data, default allow so they aren't fully disabled globally
    if (!votes) {
      return true
    }

    // Check if the master has voted
    const masterId = player.effects.find((e) => e.type === 'butler_master')?.data?.masterId as string
    if (!masterId) {
      return true
    } // No master assigned, no restriction

    // Can only vote if the master has voted
    return !!votes[masterId]
  },
}

export default definition
