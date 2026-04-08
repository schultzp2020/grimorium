import { interpolate, useI18n } from '../../lib/i18n'
import type { GameState } from '../../lib/types'
import { Button, Icon } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'

interface Props {
  state: GameState
  deaths: string[]
  round: number
  onContinue: () => void
}

export function DawnScreen({ state, deaths, round, onContinue }: Props) {
  const { t } = useI18n()

  const deadPlayers = deaths.map((id) => state.players.find((p) => p.id === id)).filter(Boolean)

  return (
    <div className='flex min-h-app flex-col bg-linear-to-b from-amber-950 via-orange-950 to-grimoire-dark'>
      {/* Header */}
      <div className='bg-linear-to-b from-amber-900/40 to-transparent px-4 py-6'>
        <div className='mx-auto max-w-lg text-center'>
          <div className='mb-3 flex justify-center'>
            <Icon name='sunrise' size='4xl' className='text-amber-400 text-glow-gold' />
          </div>
          <h1 className='font-tarot text-3xl tracking-widest-xl text-parchment-100 uppercase'>{t.game.dawnTitle}</h1>
          <p className='mt-1 text-sm text-parchment-400'>
            {t.game.night} {round}
          </p>
        </div>
      </div>

      {/* Deaths */}
      <div className='flex flex-1 items-center justify-center px-4 pb-4'>
        <div className='mx-auto w-full max-w-lg'>
          {deadPlayers.length === 0 ? (
            <div className='py-12 text-center'>
              <Icon name='shield' size='3xl' className='mx-auto mb-4 text-emerald-400/60' />
              <p className='font-tarot text-xl tracking-wider text-parchment-200'>{t.game.dawnNoDeaths}</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {deadPlayers.map((player) =>
                player ? (
                  <div
                    key={player.id}
                    className='flex items-center gap-4 rounded-xl border border-red-500/30 bg-red-950/40 p-5'
                  >
                    <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-red-500/40 bg-red-900/50'>
                      <Icon name='skull' size='xl' className='text-red-400' />
                    </div>
                    <div className='flex-1'>
                      <div className='font-tarot text-xl tracking-wider text-parchment-100'>{player.name}</div>
                      <p className='mt-0.5 text-sm text-red-400/80'>
                        {interpolate(t.game.dawnDeathAnnouncement, {
                          player: player.name,
                        })}
                      </p>
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <ScreenFooter borderColor='border-amber-500/30'>
        <Button onClick={onContinue} fullWidth size='lg' variant='ember'>
          <Icon name='sun' size='md' className='mr-2' />
          {t.game.continueToDay}
        </Button>
      </ScreenFooter>
    </div>
  )
}
