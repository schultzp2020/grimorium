import { useMemo } from 'react'

import { getRoleName, useI18n } from '../../lib/i18n'
import { getRole } from '../../lib/roles/registry'
import type { Game, GameState, PlayerState } from '../../lib/types'
import { cn } from '../../lib/utils'
import { Button, Icon, type IconName } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'

interface Props {
  game: Game
  state: GameState
  onOpenSetupAction: (playerId: string, roleId: string) => void
  onContinue: () => void
  onShowRoleCard: (player: PlayerState) => void
  onEditEffects: (player: PlayerState) => void
}

interface SetupActionItem {
  playerId: string
  playerName: string
  roleId: string
  roleName: string
  roleIcon: IconName
  isDone: boolean
}

export function SetupActionsScreen({ game, state, onOpenSetupAction, onContinue }: Props) {
  const { t, language } = useI18n()

  const completedSetupPlayerIds = useMemo(
    () => new Set(game.history.filter((e) => e.type === 'setup_action').map((e) => e.data.playerId as string)),
    [game.history],
  )

  const setupItems = useMemo(() => {
    const items: SetupActionItem[] = []

    for (const player of state.players) {
      const role = getRole(player.roleId)
      if (!role?.SetupAction) {
        continue
      }
      if (completedSetupPlayerIds.has(player.id)) {
        continue
      }

      items.push({
        playerId: player.id,
        playerName: player.name,
        roleId: player.roleId,
        roleName: getRoleName(player.roleId, language),
        roleIcon: role.icon,
        isDone: false,
      })
    }

    return items
  }, [state.players, completedSetupPlayerIds, language])

  const allDone = setupItems.length === 0

  return (
    <div className='flex min-h-app flex-col bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker'>
      {/* Header */}
      <div className='bg-gradient-to-b from-mystic-gold/10 to-transparent px-4 py-4'>
        <div className='mx-auto max-w-lg'>
          <div className='text-center'>
            <div className='mb-2 flex justify-center'>
              <Icon name='sparkles' size='3xl' className='text-mystic-gold text-glow-gold' />
            </div>
            <h1 className='font-tarot text-2xl tracking-widest-xl text-parchment-100 uppercase'>
              {t.game.setupActions}
            </h1>
            <p className='text-sm text-parchment-400'>{t.game.setupActionsSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Setup Action List */}
      <div className='mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 pb-4'>
        <div className='space-y-2'>
          {setupItems.map((item) => (
            <button
              type='button'
              key={item.playerId}
              onClick={() => onOpenSetupAction(item.playerId, item.roleId)}
              className={cn(
                'w-full flex items-center gap-3 p-4 rounded-lg transition-colors text-left group',
                'bg-amber-900/10 hover:bg-amber-900/20 border border-amber-700/30 hover:border-amber-600/50',
              )}
            >
              <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-amber-700/50 bg-amber-900/30'>
                <Icon name={item.roleIcon} size='md' className='text-amber-400' />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='text-sm font-medium text-parchment-100'>{item.playerName}</div>
                <span className='text-xs text-amber-400'>{item.roleName}</span>
              </div>
              <div className='flex items-center gap-1 text-amber-400 group-hover:text-amber-300'>
                <Icon name='sparkles' size='md' />
              </div>
            </button>
          ))}

          {allDone && (
            <div className='py-8 text-center'>
              <Icon name='checkCircle' size='xl' className='mx-auto mb-2 text-emerald-500' />
              <p className='text-sm text-parchment-400'>{t.game.allSetupActionsComplete}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <ScreenFooter>
        <Button onClick={onContinue} disabled={!allDone} fullWidth size='lg' variant='dawn'>
          <Icon name='eye' size='md' className='mr-2' />
          {t.game.continueToRoleRevelation}
        </Button>
      </ScreenFooter>
    </div>
  )
}
