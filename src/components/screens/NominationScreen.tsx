import { useMemo, useState } from 'react'

import { useI18n } from '../../lib/i18n'
import { type GameState, getAlivePlayers } from '../../lib/types'
import { BackButton, Button, Icon } from '../atoms'
import { PlayerPickerList } from '../inputs'
import { MysticDivider } from '../items'
import { ScreenFooter } from '../layouts/ScreenFooter'

interface Props {
  state: GameState
  nominatorsToday?: Set<string>
  nomineesToday?: Set<string>
  onNominate: (nominatorId: string, nomineeId: string) => void
  onBack: () => void
}

export function NominationScreen({ state, nominatorsToday, nomineesToday, onNominate, onBack }: Props) {
  const { t } = useI18n()
  const [nominator, setNominator] = useState<string | null>(null)
  const [nominee, setNominee] = useState<string | null>(null)

  const alivePlayers = getAlivePlayers(state)

  const nomineeCandidates = alivePlayers

  const handleSelectNominator = (playerId: string) => {
    setNominator(playerId)
  }

  const handleNominate = () => {
    if (nominator && nominee) {
      onNominate(nominator, nominee)
    }
  }

  const canNominate = nominator && nominee

  // Build annotations for players who already nominated today
  const nominatorAnnotations = useMemo(() => {
    if (!nominatorsToday || nominatorsToday.size === 0) {
      return undefined
    }
    const annotations: Record<string, string> = {}
    for (const player of alivePlayers) {
      if (nominatorsToday.has(player.id)) {
        annotations[player.id] = t.game.alreadyNominated
      }
    }
    return Object.keys(annotations).length > 0 ? annotations : undefined
  }, [nominatorsToday, alivePlayers, t])

  // Build disabled set + annotations for players who have already been nominated
  const nomineeAnnotations = useMemo(() => {
    if (!nomineesToday || nomineesToday.size === 0) {
      return undefined
    }
    const annotations: Record<string, string> = {}
    for (const player of alivePlayers) {
      if (nomineesToday.has(player.id)) {
        annotations[player.id] = t.game.alreadyBeenNominated
      }
    }
    return Object.keys(annotations).length > 0 ? annotations : undefined
  }, [nomineesToday, alivePlayers, t])

  // Build disabled sets for enforcement
  const disabledNominators = useMemo(() => {
    if (!nominatorsToday || nominatorsToday.size === 0) {
      return undefined
    }
    return nominatorsToday
  }, [nominatorsToday])

  const disabledNominees = useMemo(() => {
    if (!nomineesToday || nomineesToday.size === 0) {
      return undefined
    }
    return nomineesToday
  }, [nomineesToday])

  return (
    <div className='flex min-h-app flex-col bg-linear-to-b from-red-950 via-grimoire-blood to-grimoire-darker'>
      {/* Header */}
      <div className='sticky top-0 z-10 border-b border-red-500/30 bg-grimoire-dark/95 px-4 py-3 backdrop-blur-xs'>
        <div className='mx-auto flex max-w-lg items-center gap-3'>
          <BackButton onClick={onBack} />
          <div>
            <h1 className='font-tarot text-lg tracking-wider text-parchment-100 uppercase'>{t.game.newNomination}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='mx-auto w-full max-w-lg flex-1 px-4 py-6'>
        {/* Nominator Selection */}
        <div className='mb-6'>
          <label className='mb-3 flex items-center gap-2 text-xs tracking-wider text-parchment-400 uppercase'>
            <Icon name='userRound' size='sm' />
            {t.game.whoIsNominating}
          </label>
          <PlayerPickerList
            players={alivePlayers}
            selected={nominator ? [nominator] : []}
            onSelect={handleSelectNominator}
            selectionCount={1}
            variant='red'
            annotations={nominatorAnnotations}
            disabled={disabledNominators}
          />
        </div>

        {/* Divider */}
        <MysticDivider icon='swords' iconClassName='text-red-500/50' className='mb-6' />

        {/* Nominee Selection */}
        <div className='mb-6'>
          <label className='mb-3 flex items-center gap-2 text-xs tracking-wider text-parchment-400 uppercase'>
            <Icon name='userX' size='sm' />
            {t.game.whoAreTheyNominating}
          </label>
          <PlayerPickerList
            players={nomineeCandidates}
            selected={nominee ? [nominee] : []}
            onSelect={setNominee}
            selectionCount={1}
            variant='red'
            annotations={nomineeAnnotations}
            disabled={disabledNominees}
          />
        </div>

        {/* Summary */}
        {nominator && nominee && (
          <div className='mb-6 rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-center'>
            <p className='text-sm text-parchment-200'>
              <span className='font-medium text-parchment-100'>
                {alivePlayers.find((p) => p.id === nominator)?.name}
              </span>{' '}
              {t.game.nominatesVerb}{' '}
              <span className='font-medium text-red-300'>{alivePlayers.find((p) => p.id === nominee)?.name}</span>{' '}
              {t.game.forExecution}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <ScreenFooter borderColor='border-red-500/30'>
        <Button onClick={handleNominate} disabled={!canNominate} fullWidth size='lg' variant='evil'>
          <Icon name='swords' size='md' className='mr-2' />
          {t.game.startNomination}
        </Button>
      </ScreenFooter>
    </div>
  )
}
