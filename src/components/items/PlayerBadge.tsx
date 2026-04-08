import { getRole } from '../../lib/roles/registry'
import { type PlayerState, hasEffect } from '../../lib/types'
import { cn } from '../../lib/utils'
import { Badge, Icon } from '../atoms'

interface Props {
  player: PlayerState
  showRole?: boolean
  showDeadIndicator?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PlayerBadge({ player, showRole = false, showDeadIndicator = true, size = 'md', className }: Props) {
  const role = getRole(player.roleId)
  const isDead = hasEffect(player, 'dead')

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <Badge variant={isDead ? 'dead' : 'player'} className={cn(sizeClasses[size], className)}>
      {showDeadIndicator && isDead && <Icon name='skull' size='xs' />}
      <span>{player.name}</span>
      {showRole && role && (
        <span className='inline-flex items-center opacity-70'>
          (<Icon name={role.icon} size='xs' />)
        </span>
      )}
    </Badge>
  )
}
