import { Icon } from '../atoms'
import type { IconName } from '../atoms/icon'

type RoleRevealBadgeProps = {
  icon: IconName
  roleName: string
  label?: string
}

export function RoleRevealBadge({ icon, roleName, label }: RoleRevealBadgeProps) {
  return (
    <div className='mb-6 text-center'>
      {label && <p className='mb-3 text-sm text-parchment-400'>{label}</p>}
      <div className='inline-flex items-center gap-3 rounded-xl border border-mystic-gold/30 bg-mystic-gold/10 px-6 py-4'>
        <Icon name={icon} size='xl' className='text-mystic-gold' />
        <span className='font-tarot text-2xl tracking-wider text-mystic-gold uppercase'>{roleName}</span>
      </div>
    </div>
  )
}
