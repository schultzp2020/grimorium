import { useMemo } from 'react'

import { getRoleName, useI18n } from '../../lib/i18n'
import { getRole } from '../../lib/roles/registry'
import { getTeam } from '../../lib/teams'
import type { Game, GameState, PlayerState } from '../../lib/types'
import { cn } from '../../lib/utils'
import { BackButton, Button, Icon } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'

interface Props {
  game: Game
  state: GameState
  onRevealRole: (playerId: string) => void
  onStartNight: () => void
  onMainMenu: () => void
}

export function RoleRevelationScreen({ game, state, onRevealRole, onStartNight, onMainMenu }: Props) {
  const { t } = useI18n()

  const revealedPlayerIds = useMemo(
    () => new Set(game.history.filter((e) => e.type === 'role_revealed').map((e) => e.data.playerId as string)),
    [game.history],
  )

  const allRevealed = state.players.every((p) => revealedPlayerIds.has(p.id))

  const revealedCount = state.players.filter((p) => revealedPlayerIds.has(p.id)).length

  return (
    <div className='flex min-h-app flex-col bg-linear-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker'>
      {/* Header */}
      <div className='bg-linear-to-b from-mystic-gold/10 to-transparent px-4 py-4'>
        <div className='mx-auto max-w-lg'>
          {/* Back button row */}
          <div className='mb-4 flex items-center'>
            <BackButton onClick={onMainMenu} />
            <span className='ml-1 text-xs text-parchment-500'>{t.common.mainMenu}</span>
          </div>

          {/* Title section */}
          <div className='text-center'>
            <div className='mb-2 flex justify-center'>
              <Icon name='eye' size='3xl' className='text-mystic-gold text-glow-gold' />
            </div>
            <h1 className='font-tarot text-2xl tracking-widest-xl text-parchment-100 uppercase'>
              {t.game.roleRevelation}
            </h1>
            <p className='text-sm text-parchment-400'>{t.game.roleRevelationDescription}</p>
            <p className='mt-1 text-xs text-parchment-500'>
              {revealedCount} / {state.players.length}
            </p>
            <p className='text-parchment-600 mt-3 flex items-center justify-center gap-1.5 text-xs'>
              <Icon name='eye' size='xs' className='shrink-0' />
              <span>{t.game.roleRevelationNarratorHint}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Player List */}
      <div className='mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 pb-4'>
        <div className='space-y-1'>
          {state.players.map((player) => {
            const isRevealed = revealedPlayerIds.has(player.id)
            return (
              <PlayerRevealRow
                key={player.id}
                player={player}
                isRevealed={isRevealed}
                onClick={() => onRevealRole(player.id)}
              />
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <ScreenFooter>
        <Button onClick={onStartNight} fullWidth size='lg' variant='dawn'>
          <Icon name='moon' size='md' className='mr-2' />
          {t.game.startFirstNight}
        </Button>
        {!allRevealed && (
          <button
            type='button'
            onClick={onStartNight}
            className='text-parchment-600 mt-2 flex min-h-11 w-full items-center justify-center py-2 text-center text-xs transition-colors hover:text-parchment-400'
          >
            {t.game.skipRoleRevelation}
          </button>
        )}
      </ScreenFooter>
    </div>
  )
}

function PlayerRevealRow({
  player,
  isRevealed,
  onClick,
}: {
  player: PlayerState
  isRevealed: boolean
  onClick: () => void
}) {
  const { t, language } = useI18n()
  const role = getRole(player.roleId)
  const team = role ? getTeam(role.team) : null

  const roleName = useMemo(() => getRoleName(player.roleId, language), [player.roleId, language])

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left group',
        isRevealed
          ? 'bg-white/5 hover:bg-white/8'
          : 'bg-mystic-gold/5 hover:bg-mystic-gold/10 border border-mystic-gold/20',
      )}
    >
      {/* Role Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border',
          isRevealed
            ? 'bg-parchment-500/10 border-parchment-500/20'
            : team?.isEvil
              ? 'bg-red-900/30 border-red-600/30'
              : 'bg-mystic-gold/10 border-mystic-gold/20',
        )}
      >
        {role ? (
          <Icon name={role.icon} size='md' className={cn(isRevealed ? 'text-parchment-500' : team?.colors.text)} />
        ) : (
          <Icon name='user' size='md' className='text-parchment-400' />
        )}
      </div>

      {/* Player Info */}
      <div className='min-w-0 flex-1'>
        <div className={cn('font-medium text-sm', isRevealed ? 'text-parchment-400' : 'text-parchment-100')}>
          {player.name}
        </div>
        {role && (
          <span className={cn('text-xs', isRevealed ? 'text-parchment-600' : team?.colors.text)}>{roleName}</span>
        )}
      </div>

      {/* Status */}
      {isRevealed ? (
        <div className='flex items-center gap-1 text-emerald-500'>
          <Icon name='checkCircle' size='md' />
          <span className='text-xs'>{t.game.revealed}</span>
        </div>
      ) : (
        <div className='flex items-center gap-1 text-mystic-gold group-hover:text-mystic-gold/80'>
          <Icon name='eye' size='md' />
        </div>
      )}
    </button>
  )
}
