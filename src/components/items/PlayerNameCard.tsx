import { Icon } from '../atoms'

interface PlayerNameCardProps {
  name: string
}

export function PlayerNameCard({ name }: PlayerNameCardProps) {
  return (
    <div className='rounded-lg border border-white/10 bg-white/5 p-4'>
      <div className='flex items-center gap-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/20'>
          <Icon name='user' size='md' className='text-blue-300' />
        </div>
        <span className='text-lg font-medium text-parchment-100'>{name}</span>
      </div>
    </div>
  )
}
