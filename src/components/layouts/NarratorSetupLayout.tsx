import type { ReactNode } from 'react'

import { interpolate, useI18n } from '../../lib/i18n'
import type { NightStepAudience } from '../../lib/roles/types'
import { cn } from '../../lib/utils'
import { Button, Icon } from '../atoms'
import type { IconName } from '../atoms/icon'
import { ScreenFooter } from './ScreenFooter'

interface NarratorSetupLayoutProps {
  icon: IconName
  roleName: string
  playerName: string
  children: ReactNode
  footer?: ReactNode
  // If provided, shows a default "Show to Player" button
  onShowToPlayer?: () => void
  showToPlayerDisabled?: boolean
  showToPlayerLabel?: string
  /**
   * Who this screen is for. Affects background gradient and shows a contextual banner.
   * - `narrator` — blue/indigo background, "This is your decision" banner
   * - `player_choice` — amber/warm background, "Wake player and ask them" banner
   * If omitted, defaults to narrator styling.
   */
  audience?: NightStepAudience
}

export function NarratorSetupLayout({
  icon,
  roleName,
  playerName,
  children,
  footer,
  onShowToPlayer,
  showToPlayerDisabled,
  showToPlayerLabel,
  audience,
}: NarratorSetupLayoutProps) {
  const { t } = useI18n()

  const isPlayerChoice = audience === 'player_choice'

  return (
    <div
      className={cn(
        'min-h-app flex flex-col bg-gradient-to-b',
        isPlayerChoice
          ? 'from-amber-950 via-orange-950/50 to-grimoire-darker'
          : 'from-indigo-950 via-grimoire-purple to-grimoire-darker',
      )}
    >
      {/* Audience Banner */}
      {audience === 'narrator' && (
        <div className='mx-4 mt-4 mb-0 w-full max-w-lg self-center'>
          <div className='flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-900/30 px-3 py-2'>
            <Icon name='eye' size='sm' className='flex-shrink-0 text-blue-400' />
            <span className='text-xs text-blue-300'>{t.game.storytellerDecision}</span>
          </div>
        </div>
      )}
      {isPlayerChoice && (
        <div className='mx-4 mt-4 mb-0 w-full max-w-lg self-center'>
          <div className='flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-900/40 px-3 py-2'>
            <Icon name='userRound' size='sm' className='flex-shrink-0 text-amber-400' />
            <span className='text-xs font-medium text-amber-300'>
              {interpolate(t.game.wakePlayerPrompt, { player: playerName })}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className={cn(
          'px-4 py-6 text-center',
          !isPlayerChoice && 'bg-gradient-to-b from-blue-900/50 to-transparent',
          isPlayerChoice && 'bg-gradient-to-b from-amber-900/30 to-transparent',
        )}
      >
        <div className='mb-3 flex justify-center'>
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center border',
              isPlayerChoice ? 'bg-amber-500/20 border-amber-400/30' : 'bg-blue-500/20 border-blue-400/30',
            )}
          >
            <Icon name={icon} size='2xl' className={cn(isPlayerChoice ? 'text-amber-300' : 'text-blue-300')} />
          </div>
        </div>
        <h1 className='font-tarot text-xl tracking-wider text-parchment-100 uppercase'>{t.game.narratorSetup}</h1>
        <p className='mt-1 text-sm text-parchment-400'>
          {roleName} - {playerName}
        </p>
      </div>

      {/* Content */}
      <div className='mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 pb-4'>{children}</div>

      {/* Footer */}
      <ScreenFooter borderColor={isPlayerChoice ? 'border-amber-500/30' : 'border-blue-500/30'}>
        {footer ?? (
          <Button onClick={onShowToPlayer} disabled={showToPlayerDisabled} fullWidth size='lg' variant='night'>
            <Icon name='eye' size='md' className='mr-2' />
            {showToPlayerLabel ?? t.game.showToPlayer}
          </Button>
        )}
      </ScreenFooter>
    </div>
  )
}
