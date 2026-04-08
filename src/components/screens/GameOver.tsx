import { getRoleName, useI18n } from '../../lib/i18n'
import { getRole } from '../../lib/roles/registry'
import { type GameState, hasEffect } from '../../lib/types'
import { cn } from '../../lib/utils'
import { Badge, Button, Icon } from '../atoms'
import { MysticDivider } from '../items'

interface Props {
  state: GameState
  onMainMenu: () => void
  onShowHistory: () => void
}

export function GameOver({ state, onMainMenu, onShowHistory }: Props) {
  const { t, language } = useI18n()
  const { winner } = state
  const isGoodWin = winner === 'townsfolk'

  return (
    <div
      className={cn(
        'min-h-app flex flex-col bg-gradient-to-b',
        isGoodWin
          ? 'from-indigo-950 via-blue-950 to-grimoire-dark'
          : 'from-red-950 via-grimoire-blood to-grimoire-darker',
      )}
    >
      {/* Victory Banner */}
      <div className='flex flex-1 items-center justify-center px-4 py-8'>
        <div className='text-center'>
          {/* Icon */}
          <div className='mb-6'>
            <div
              className={cn(
                'w-28 h-28 mx-auto rounded-full flex items-center justify-center border-2',
                isGoodWin ? 'bg-mystic-gold/10 border-mystic-gold/40' : 'bg-red-900/30 border-red-600/40',
              )}
            >
              {isGoodWin ? (
                <Icon name='trophy' size='4xl' className='text-mystic-gold text-glow-gold' />
              ) : (
                <Icon name='skull' size='4xl' className='text-red-500 text-glow-crimson' />
              )}
            </div>
          </div>

          {/* Title */}
          <h1
            className={cn(
              'font-tarot text-4xl font-bold tracking-widest-xl uppercase mb-3',
              isGoodWin ? 'text-parchment-100' : 'text-red-400 text-glow-crimson',
            )}
          >
            {isGoodWin ? t.game.goodWins : t.game.evilWins}
          </h1>
          <p className='mb-8 text-sm text-parchment-400'>
            {isGoodWin ? t.game.townVanquishedDemon : t.game.demonConqueredTown}
          </p>

          {/* Divider */}
          <MysticDivider
            icon={isGoodWin ? 'sparkles' : 'skull'}
            iconClassName={isGoodWin ? 'text-mystic-gold/40' : 'text-red-500/40'}
            className='mb-6'
          />

          {/* Final Roles */}
          <div className='mx-auto max-w-sm'>
            <h2 className='mb-4 font-tarot text-sm tracking-wider text-parchment-400 uppercase'>{t.game.finalRoles}</h2>
            <div className='space-y-2'>
              {state.players.map((player) => {
                const role = getRole(player.roleId)
                const isDead = hasEffect(player, 'dead')

                return (
                  <div
                    key={player.id}
                    className={cn('flex items-center justify-between py-2 px-3 rounded-lg', isDead ? 'opacity-50' : '')}
                  >
                    <span className='flex items-center gap-2'>
                      {isDead && <Icon name='skull' size='sm' className='text-parchment-500' />}
                      <span className={cn('text-sm', isDead ? 'text-parchment-500' : 'text-parchment-200')}>
                        {player.name}
                      </span>
                    </span>
                    {role && (
                      <Badge variant={role.team} className='inline-flex items-center gap-1'>
                        <Icon name={role.icon} size='xs' /> {getRoleName(role.id, language)}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='mx-auto w-full max-w-lg space-y-3 px-4 pb-8'>
        <Button
          onClick={onShowHistory}
          fullWidth
          size='lg'
          variant='secondary'
          className='font-tarot tracking-wider uppercase'
        >
          <Icon name='history' size='md' className='mr-2' />
          {t.common.history}
        </Button>
        <Button onClick={onMainMenu} fullWidth size='lg' variant={isGoodWin ? 'gold' : 'evil'}>
          {t.game.backToMainMenu}
        </Button>
      </div>
    </div>
  )
}
