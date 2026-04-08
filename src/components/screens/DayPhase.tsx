import { useState } from 'react'

import type { BlockStatus } from '../../lib/game'
import { interpolate, useI18n } from '../../lib/i18n'
import type { AvailableDayAction } from '../../lib/pipeline/types'
import type { GameState, PlayerState } from '../../lib/types'
import { cn } from '../../lib/utils'
import { Button, Icon } from '../atoms'
import { MysticDivider } from '../items'
import { Grimoire } from '../items/Grimoire'
import { ScreenFooter } from '../layouts/ScreenFooter'

interface NightSummary {
  deaths: string[]
  round: number
}

interface Props {
  state: GameState
  blockStatus: BlockStatus
  dayActions: AvailableDayAction[]
  nightSummary?: NightSummary
  nominationsBlocked?: boolean
  onNominate: () => void
  onDayAction: (action: AvailableDayAction) => void
  onEndDay: () => void
  onMainMenu: () => void
  onShowRoleCard?: (player: PlayerState) => void
  onEditEffects?: (player: PlayerState) => void
  onOpenGrimoirePlayer?: (player: PlayerState) => void
}

export function DayPhase({
  state,
  blockStatus,
  dayActions,
  nightSummary,
  nominationsBlocked,
  onNominate,
  onDayAction,
  onEndDay,
  onMainMenu,
  onShowRoleCard,
  onEditEffects,
  onOpenGrimoirePlayer,
}: Props) {
  const { t } = useI18n()
  const [summaryExpanded, setSummaryExpanded] = useState(true)
  const [grimoireExpanded, setGrimoireExpanded] = useState(false)

  const deadPlayers = nightSummary
    ? nightSummary.deaths.map((id) => state.players.find((p) => p.id === id)).filter(Boolean)
    : []

  return (
    <div className='flex min-h-app flex-col bg-gradient-to-b from-orange-950 via-amber-950 to-grimoire-dark'>
      {/* Header */}
      <div className='bg-gradient-to-b from-amber-900/50 to-transparent px-4 py-4'>
        <div className='mx-auto max-w-lg'>
          {/* Menu button row */}
          <div className='mb-4 flex items-center'>
            <button
              type='button'
              onClick={onMainMenu}
              className='-ml-3 flex min-h-[44px] min-w-[44px] items-center justify-center p-3 text-parchment-500 transition-colors hover:text-parchment-200'
            >
              <Icon name='menu' size='md' />
            </button>
          </div>

          {/* Title section */}
          <div className='text-center'>
            <div className='mb-2 flex justify-center'>
              <Icon name='sun' size='3xl' className='text-amber-400 text-glow-gold' />
            </div>
            <h1 className='font-tarot text-2xl tracking-widest-xl text-parchment-100 uppercase'>
              {t.game.day} {state.round}
            </h1>
            <p className='text-sm text-parchment-400'>{t.game.discussionAndNominations}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 pb-4'>
        {/* Night Summary Section (collapsible, default expanded) */}
        {nightSummary && (
          <div className='mb-6'>
            <button
              type='button'
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              className='group mb-2 flex w-full items-center gap-2 px-1'
            >
              <Icon name='moon' size='sm' className='text-indigo-400' />
              <span className='flex-1 text-left font-tarot text-sm tracking-wider text-parchment-100 uppercase'>
                {interpolate(t.game.nightSummary, {
                  round: nightSummary.round,
                })}
              </span>
              <Icon
                name={summaryExpanded ? 'chevronUp' : 'chevronDown'}
                size='sm'
                className='text-parchment-500 transition-colors group-hover:text-parchment-300'
              />
            </button>
            {summaryExpanded && (
              <div className='rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3'>
                {deadPlayers.length === 0 ? (
                  <p className='py-2 text-center text-sm text-parchment-400'>{t.game.noDeathsLastNight}</p>
                ) : (
                  <div className='space-y-2'>
                    {deadPlayers.map((player) =>
                      player ? (
                        <div key={player.id} className='flex items-center gap-2 text-sm'>
                          <Icon name='skull' size='sm' className='text-red-400' />
                          <span className='text-parchment-200'>{player.name}</span>
                          <span className='text-xs text-red-400/70'>
                            {interpolate(t.game.dawnDeathAnnouncement, {
                              player: player.name,
                            })}
                          </span>
                        </div>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Daytime Actions (primary section — above Grimoire) */}
        <div className='mb-6'>
          <div className='mb-3 flex items-center gap-2 px-1'>
            <Icon name='swords' size='sm' className='text-red-400' />
            <span className='font-tarot text-sm tracking-wider text-parchment-100 uppercase'>
              {t.game.daytimeActions}
            </span>
          </div>

          {/* Block Status Banner */}
          {blockStatus && (
            <div className='mb-3 rounded-xl border border-red-500/40 bg-red-900/30 p-3'>
              <div className='flex items-center gap-2'>
                <Icon name='swords' size='sm' className='text-red-400' />
                <span className='text-sm font-medium text-red-200'>
                  {interpolate(t.game.currentBlock, {
                    player: blockStatus.playerName,
                    count: blockStatus.voteCount,
                  })}
                </span>
              </div>
            </div>
          )}

          <div className='space-y-2'>
            {/* Nomination Button — disabled when nominations are blocked (e.g., Virgin execution) */}
            <button
              type='button'
              onClick={nominationsBlocked ? undefined : onNominate}
              disabled={nominationsBlocked}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl transition-colors group bg-gradient-to-r border',
                nominationsBlocked
                  ? 'from-gray-900/30 to-gray-800/20 border-gray-500/20 opacity-50 cursor-not-allowed'
                  : 'from-red-900/30 to-red-800/20 border-red-500/30 hover:border-red-500/50',
              )}
            >
              <div className='flex h-12 w-12 items-center justify-center rounded-full border border-red-500/40 bg-red-900/40 transition-transform group-hover:scale-105'>
                <Icon name='userX' size='lg' className='text-red-400' />
              </div>
              <div className='flex-1 text-left'>
                <div className='font-tarot tracking-wider text-parchment-100 uppercase'>{t.game.newNomination}</div>
                <p className='mt-0.5 text-xs text-parchment-500'>{t.game.accusePlayerDescription}</p>
              </div>
              <Icon
                name='arrowRight'
                size='md'
                className='text-parchment-500 transition-colors group-hover:text-parchment-300'
              />
            </button>

            {/* Dynamic Day Actions from Effects */}
            {dayActions.map((action) => (
              <button
                type='button'
                key={action.id}
                onClick={() => onDayAction(action)}
                className='group flex w-full items-center gap-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-900/30 to-orange-800/20 p-4 transition-colors hover:border-amber-500/50'
              >
                <div className='flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/40 bg-amber-900/40 transition-transform group-hover:scale-105'>
                  <Icon name={action.icon} size='lg' className='text-amber-400' />
                </div>
                <div className='flex-1 text-left'>
                  <div className='font-tarot tracking-wider text-parchment-100 uppercase'>{action.label}</div>
                  <p className='mt-0.5 text-xs text-parchment-500'>{action.description}</p>
                </div>
                <Icon
                  name='arrowRight'
                  size='md'
                  className='text-parchment-500 transition-colors group-hover:text-parchment-300'
                />
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <MysticDivider className='mb-6' />

        {/* Grimoire Section (collapsible, default collapsed) */}
        <div className='mb-6'>
          <button
            type='button'
            onClick={() => setGrimoireExpanded(!grimoireExpanded)}
            className='group mb-2 flex w-full items-center gap-2 px-1'
          >
            <Icon name='bookUser' size='sm' className='text-mystic-gold' />
            <span className='flex-1 text-left font-tarot text-sm tracking-wider text-parchment-100 uppercase'>
              {t.game.grimoire}
            </span>
            <Icon
              name={grimoireExpanded ? 'chevronUp' : 'chevronDown'}
              size='sm'
              className={cn(
                'transition-colors',
                grimoireExpanded ? 'text-parchment-400' : 'text-parchment-500 group-hover:text-parchment-300',
              )}
            />
          </button>
          {grimoireExpanded && (
            <div className='overflow-hidden rounded-xl border border-white/10 bg-white/5'>
              <Grimoire
                state={state}
                compact
                onPlayerSelect={onOpenGrimoirePlayer}
                onShowRoleCard={onShowRoleCard}
                onEditEffects={onEditEffects}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <ScreenFooter borderColor='border-indigo-500/30'>
        <Button onClick={onEndDay} fullWidth size='lg' variant='dawn'>
          <Icon name='moon' size='md' className='mr-2' />
          {blockStatus
            ? interpolate(t.game.endDayExecute, { player: blockStatus.playerName })
            : t.game.endDayNoExecution}
        </Button>
      </ScreenFooter>
    </div>
  )
}
