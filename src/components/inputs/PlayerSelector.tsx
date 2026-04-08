import type { EffectId } from '../../lib/effects/types'
import { getRoleName as getRegistryRoleName, useI18n } from '../../lib/i18n'
import { getRole } from '../../lib/roles/registry'
import { type PlayerState, hasEffect } from '../../lib/types'
import { cn } from '../../lib/utils'
import { Icon } from '../atoms'
import type { IconName } from '../atoms/icon'

interface PlayerSelectorProps {
  /** Full list of players to display */
  players: PlayerState[]
  /** Currently selected player ID */
  selected: string | null
  /** Callback when a player is selected */
  onSelect: (playerId: string) => void
  /** Show each player's role name and icon (narrator view) */
  showRoles?: boolean
  /** Filter out players that have ANY of these effects */
  excludeEffects?: EffectId[]
  /** Only show players that have ALL of these effects */
  requireEffects?: EffectId[]
  /** Custom label to show below a player's name (e.g. "original target") */
  getLabel?: (player: PlayerState) => string | undefined
  /** Icon shown on the right when a player is selected (default: "check") */
  selectedIcon?: IconName
  /** Color variant for the selection highlight */
  variant?: 'red' | 'blue' | 'amber' | 'default'
}

const variantStyles = {
  red: {
    selected: 'bg-red-900/50 border-red-600/60',
    selectedText: 'text-red-400',
  },
  blue: {
    selected: 'bg-blue-900/50 border-blue-500/60',
    selectedText: 'text-blue-300',
  },
  amber: {
    selected: 'bg-amber-700/40 border-amber-500',
    selectedText: 'text-amber-400',
  },
  default: {
    selected: 'bg-purple-900/40 border-purple-500/50',
    selectedText: 'text-purple-300',
  },
}

export function PlayerSelector({
  players,
  selected,
  onSelect,
  showRoles = false,
  excludeEffects,
  requireEffects,
  getLabel,
  selectedIcon = 'check',
  variant = 'default',
}: PlayerSelectorProps) {
  const { language } = useI18n()
  const styles = variantStyles[variant]

  const getRoleName = (roleId: string) => getRegistryRoleName(roleId, language)

  const filteredPlayers = players.filter((p) => {
    if (excludeEffects?.some((e) => hasEffect(p, e))) {
      return false
    }
    if (requireEffects && !requireEffects.every((e) => hasEffect(p, e))) {
      return false
    }
    return true
  })

  return (
    <div className='space-y-2'>
      {filteredPlayers.map((player) => {
        const role = getRole(player.roleId)
        const isSelected = selected === player.id
        const label = getLabel?.(player)

        return (
          <button
            type='button'
            key={player.id}
            onClick={() => onSelect(player.id)}
            className={cn(
              'w-full p-4 rounded-lg text-left transition-all duration-200 flex items-center justify-between border',
              'active:scale-[0.98] active:brightness-90',
              isSelected ? styles.selected : 'bg-white/5 border-white/10 hover:bg-white/10',
            )}
          >
            <div className='flex items-center gap-3'>
              <Icon
                name={showRoles && role ? role.icon : 'user'}
                size='md'
                className={isSelected ? styles.selectedText : 'text-parchment-400'}
              />
              <div>
                <span className='font-medium text-parchment-100'>{player.name}</span>
                {(showRoles || label) && (
                  <div className='flex items-center gap-1'>
                    {showRoles && role && <span className='text-xs text-parchment-500'>{getRoleName(role.id)}</span>}
                    {label && (
                      <span className='text-xs text-parchment-500'>
                        {showRoles && role ? '· ' : ''}
                        {label}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {isSelected && <Icon name={selectedIcon} size='md' className={styles.selectedText} />}
          </button>
        )
      })}
    </div>
  )
}
