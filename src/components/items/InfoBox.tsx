import { Icon } from '../atoms'
import type { IconName } from '../atoms/icon'

type InfoBoxProps = {
  icon: IconName
  title: string
  description?: string
}

export function InfoBox({ icon, title, description }: InfoBoxProps) {
  return (
    <div className='rounded-lg border border-blue-500/30 bg-blue-900/30 p-6 text-center'>
      <Icon name={icon} size='xl' className='mx-auto mb-3 text-blue-300' />
      <h2 className='mb-2 font-tarot text-lg text-parchment-100'>{title}</h2>
      {description && <p className='text-sm text-parchment-400'>{description}</p>}
    </div>
  )
}
