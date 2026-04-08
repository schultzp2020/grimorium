import { useState } from 'react'

import { Badge, Button, Icon } from '../../../../components/atoms'
import { getEffectTranslations, registerEffectTranslations } from '../../../i18n'
import type { Language } from '../../../i18n'
import type { Perception } from '../../../pipeline/types'
import type { TeamId } from '../../../teams'
import { type EffectConfigEditorProps, type EffectDefinition, type EffectDescriptionProps } from '../../types'
import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('misregister', 'en', en)
registerEffectTranslations('misregister', 'es', es)

// Badge variant for alignment rendering
const ALIGNMENT_BADGE_VARIANT: Record<string, 'townsfolk' | 'demon'> = {
  good: 'townsfolk',
  evil: 'demon',
}

function MisregisterDescription({ instance, language }: EffectDescriptionProps) {
  const t = getEffectTranslations('misregister', language as Language)
  const canRegisterAs = instance.data?.canRegisterAs as { teams?: string[]; alignments?: string[] } | undefined

  if (!canRegisterAs) {
    return null
  }

  const alignments = canRegisterAs.alignments ?? []
  const teams = canRegisterAs.teams ?? []

  if (alignments.length === 0 && teams.length === 0) {
    return null
  }

  return (
    <span className='inline-flex flex-wrap items-center gap-1'>
      <span>{t.mightRegisterAs}</span>
      {alignments.map((a) => (
        <Badge key={`alignment-${a}`} variant={ALIGNMENT_BADGE_VARIANT[a] ?? 'default'}>
          {(t[`alignment_${a}`] as string | undefined) ?? a}
        </Badge>
      ))}
      {teams.map((team) => (
        <Badge key={`team-${team}`} variant={team as TeamId}>
          {(t[`team_${team}`] as string | undefined) ?? team}
        </Badge>
      ))}
    </span>
  )
}

const ALL_TEAMS: TeamId[] = ['townsfolk', 'outsider', 'minion', 'demon']
const ALL_ALIGNMENTS: ('good' | 'evil')[] = ['good', 'evil']

function MisregisterConfigEditor({ data, language, onSave, onCancel }: EffectConfigEditorProps) {
  const t = getEffectTranslations('misregister', language as Language)

  const existing = data?.canRegisterAs as { teams?: string[]; alignments?: string[] } | undefined

  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set(existing?.teams ?? []))
  const [selectedAlignments, setSelectedAlignments] = useState<Set<string>>(new Set(existing?.alignments ?? []))

  const toggleTeam = (team: string) => {
    setSelectedTeams((prev) => {
      const next = new Set(prev)
      if (next.has(team)) {
        next.delete(team)
      } else {
        next.add(team)
      }
      return next
    })
  }

  const toggleAlignment = (alignment: string) => {
    setSelectedAlignments((prev) => {
      const next = new Set(prev)
      if (next.has(alignment)) {
        next.delete(alignment)
      } else {
        next.add(alignment)
      }
      return next
    })
  }

  const handleSave = () => {
    onSave({
      ...data,
      canRegisterAs: {
        teams: [...selectedTeams],
        alignments: [...selectedAlignments],
      },
    })
  }

  const hasSelection = selectedTeams.size > 0 || selectedAlignments.size > 0

  return (
    <div className='space-y-4'>
      {/* Alignments */}
      <div>
        <p className='mb-2 text-xs font-bold tracking-wider text-parchment-300 uppercase'>{t.configAlignments}</p>
        <div className='flex gap-2'>
          {ALL_ALIGNMENTS.map((alignment) => {
            const isSelected = selectedAlignments.has(alignment)
            return (
              <button
                type='button'
                key={alignment}
                onClick={() => toggleAlignment(alignment)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                  isSelected
                    ? alignment === 'good'
                      ? 'border-blue-400/50 bg-blue-500/20 text-blue-200'
                      : 'border-red-400/50 bg-red-500/20 text-red-200'
                    : 'border-white/10 bg-white/5 text-parchment-400 hover:border-white/30'
                }`}
              >
                <Icon name={isSelected ? 'checkSquare' : 'square'} size='sm' />
                {(t[`alignment_${alignment}`] as string | undefined) ?? alignment}
              </button>
            )
          })}
        </div>
      </div>

      {/* Teams */}
      <div>
        <p className='mb-2 text-xs font-bold tracking-wider text-parchment-300 uppercase'>{t.configTeams}</p>
        <div className='grid grid-cols-2 gap-2'>
          {ALL_TEAMS.map((team) => {
            const isSelected = selectedTeams.has(team)
            return (
              <button
                type='button'
                key={team}
                onClick={() => toggleTeam(team)}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                  isSelected
                    ? 'border-white/30 bg-white/10 text-parchment-100'
                    : 'border-white/10 bg-white/5 text-parchment-400 hover:border-white/30'
                }`}
              >
                <Icon name={isSelected ? 'checkSquare' : 'square'} size='sm' />
                <Badge variant={team}>{(t[`team_${team}`] as string | undefined) ?? team}</Badge>
              </button>
            )
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className='flex gap-2 pt-2'>
        <Button onClick={onCancel} variant='ghost' className='flex-1'>
          {t.configCancel}
        </Button>
        <Button onClick={handleSave} variant='primary' className='flex-1' disabled={!hasSelection}>
          {t.configSave}
        </Button>
      </div>
    </div>
  )
}

/**
 * Misregister effect — a generic effect for any role that might register
 * differently to information abilities.
 *
 * Instance data configures what this player can misregister as:
 * - `data.canRegisterAs.teams` — teams they might appear as (e.g., ['minion', 'demon'])
 * - `data.canRegisterAs.alignments` — alignments they might appear as (e.g., ['evil'])
 *
 * The perception modifier reads `data.perceiveAs` to apply narrator-configured
 * overrides during night actions (via `PerceptionConfigStep` +
 * `applyPerceptionOverrides()`).
 *
 * Used by:
 * - Recluse — good player that might register as evil / Minion / Demon
 * - Spy — evil player that might register as good / Townsfolk / Outsider
 */
const definition: EffectDefinition = {
  id: 'misregister',
  icon: 'drama',
  defaultType: 'perception',
  perceptionModifiers: [
    {
      context: ['alignment', 'team', 'role'],
      modify: (perception, _target, _observer, _state, effectData) => {
        const overrides = effectData?.perceiveAs as Partial<Perception> | undefined
        if (!overrides) {
          return perception
        }
        return { ...perception, ...overrides }
      },
    },
  ],
  Description: MisregisterDescription,
  ConfigEditor: MisregisterConfigEditor,
}

export default definition
