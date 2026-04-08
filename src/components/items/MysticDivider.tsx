import { cn } from '../../lib/utils'
import { Icon } from '../atoms'
import type { IconName } from '../atoms/icon'

interface MysticDividerProps {
  icon?: IconName
  iconClassName?: string
  className?: string
}

export function MysticDivider({
  icon = 'sparkles',
  iconClassName = 'text-mystic-gold/40',
  className,
}: MysticDividerProps) {
  return (
    <div className={cn('flex items-center gap-4 my-4', className)}>
      <div className='h-px flex-1 bg-gradient-to-r from-transparent via-mystic-gold/30 to-transparent' />
      <Icon name={icon} size='sm' className={iconClassName} />
      <div className='h-px flex-1 bg-gradient-to-r from-transparent via-mystic-gold/30 to-transparent' />
    </div>
  )
}
