import { Icon, Badge } from '../atoms'
import type { IconName } from '../atoms/icon'
import { cn } from '../../lib/utils'
import type { TeamId } from '../../lib/teams'

type SelectablePlayerItemProps = {
  playerName: string
  roleName: string
  roleIcon: IconName
  isSelected: boolean
  isDisabled?: boolean
  highlightTeam?: TeamId
  teamLabel?: string
  onClick: () => void
}

export function SelectablePlayerItem({
  playerName,
  roleName,
  roleIcon,
  isSelected,
  isDisabled,
  highlightTeam,
  teamLabel,
  onClick,
}: SelectablePlayerItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'w-full p-3 rounded-lg border flex items-center justify-between transition-all',
        'active:scale-[0.98] active:brightness-90',
        isSelected
          ? 'bg-blue-900/40 border-blue-500/50'
          : isDisabled
            ? 'bg-white/5 border-white/10 opacity-50'
            : 'bg-white/5 border-white/10 hover:bg-white/10',
      )}
    >
      <div className='flex items-center gap-3'>
        <Icon name={roleIcon} size='md' className={isSelected ? 'text-blue-300' : 'text-parchment-400'} />
        <div className='text-left'>
          <div className='font-medium text-parchment-100'>{playerName}</div>
          <div className='flex items-center gap-1 text-xs text-parchment-500'>
            {roleName}
            {highlightTeam && teamLabel && (
              <Badge variant={highlightTeam} className='px-1 py-0 text-[10px]'>
                {teamLabel}
              </Badge>
            )}
          </div>
        </div>
      </div>
      {isSelected && <Icon name='check' size='md' className='text-blue-300' />}
    </button>
  )
}
