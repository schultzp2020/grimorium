import { cn } from '../../lib/utils'
import { Icon } from './icon'

interface BackButtonProps {
  onClick: () => void
  label?: string
}

export function BackButton({ onClick, label }: BackButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'p-3 -ml-3 text-parchment-400 hover:text-parchment-100 transition-colors min-w-11 min-h-11 flex items-center justify-center',
        label && 'flex items-center gap-1',
      )}
    >
      <Icon name='arrowLeft' size='md' />
      {label && <span className='text-xs'>{label}</span>}
    </button>
  )
}
