import { type Game, getCurrentState } from '../../lib/types'
import { useI18n } from '../../lib/i18n'
import { RichMessage } from '../items/RichMessage'
import { Icon, type IconName, BackButton } from '../atoms'

type Props = {
  game: Game
  onClose: () => void
}

const eventIcons: Record<string, { name: IconName; className: string }> = {
  game_created: { name: 'sparkles', className: 'text-mystic-gold' },
  night_started: { name: 'moon', className: 'text-indigo-400' },
  role_revealed: { name: 'eye', className: 'text-purple-400' },
  night_action: { name: 'swords', className: 'text-red-400' },
  night_skipped: { name: 'zapOff', className: 'text-parchment-500' },
  night_resolved: { name: 'sun', className: 'text-yellow-400' },
  day_started: { name: 'sun', className: 'text-orange-400' },
  nomination: { name: 'userPlus', className: 'text-orange-300' },
  vote: { name: 'vote', className: 'text-purple-300' },
  execution: { name: 'skull', className: 'text-red-500' },
  effect_added: { name: 'sparkles', className: 'text-cyan-400' },
  effect_removed: { name: 'x', className: 'text-parchment-500' },
  game_ended: { name: 'trophy', className: 'text-mystic-gold' },
}

export function HistoryView({ game, onClose }: Props) {
  const { t, language } = useI18n()
  const state = getCurrentState(game)

  const formatTime = (timestamp: number) => {
    const locale = language === 'es' ? 'es-ES' : 'en-US'
    return new Date(timestamp).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker'>
      {/* Header */}
      <div className='sticky top-0 z-10 border-b border-mystic-gold/20 bg-grimoire-dark/95 px-4 py-3 backdrop-blur-xs'>
        <div className='mx-auto flex max-w-lg items-center gap-3'>
          <BackButton onClick={onClose} />
          <div className='flex items-center gap-3'>
            <Icon name='history' size='md' className='text-mystic-gold' />
            <h1 className='font-tarot text-lg tracking-wider text-parchment-100 uppercase'>{t.game.gameHistory}</h1>
          </div>
        </div>
      </div>

      {/* Event List - Simple, no cards */}
      <div className='mx-auto max-w-lg px-4 py-4'>
        <div className='space-y-0'>
          {game.history
            .filter((entry) => entry.message.length > 0) // Hide entries with no message
            .map((entry, index, filteredHistory) => {
              const iconConfig = eventIcons[entry.type]
              const isLast = index === filteredHistory.length - 1

              return (
                <div key={entry.id} className='relative'>
                  {/* Timeline line */}
                  {!isLast && <div className='absolute top-8 bottom-0 left-[11px] w-px bg-parchment-500/20' />}

                  {/* Event row */}
                  <div className='flex gap-4 py-3'>
                    {/* Icon */}
                    <div className='mt-0.5 flex-shrink-0'>
                      {iconConfig ? (
                        <Icon name={iconConfig.name} size='sm' className={iconConfig.className} />
                      ) : (
                        <Icon name='circle' size='sm' className='text-parchment-500' />
                      )}
                    </div>

                    {/* Content */}
                    <div className='min-w-0 flex-1'>
                      <div className='text-sm leading-relaxed text-parchment-200'>
                        <RichMessage message={entry.message} state={state} />
                      </div>
                      <div className='mt-1 text-xs text-parchment-500'>{formatTime(entry.timestamp)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {game.history.length === 0 && (
          <div className='py-12 text-center text-parchment-500'>
            <Icon name='history' size='3xl' className='mx-auto mb-4 opacity-30' />
            <p className='text-sm'>{t.history.noEventsYet}</p>
          </div>
        )}
      </div>
    </div>
  )
}
