import { useI18n } from '../../lib/i18n'
import { Button, Icon } from '../atoms'

interface Props {
  onReady: () => void
}

export function ReturnDeviceScreen({ onReady }: Props) {
  const { t } = useI18n()

  return (
    <div className='flex min-h-app flex-col items-center justify-center bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker px-6'>
      <div className='max-w-sm text-center'>
        <div className='mb-6'>
          <Icon name='smartphone' size='4xl' className='mx-auto text-mystic-gold/80' />
        </div>
        <h1 className='mb-3 font-tarot text-2xl tracking-widest-xl text-parchment-100 uppercase'>
          {t.game.returnDeviceToNarrator}
        </h1>
        <p className='mb-10 text-sm text-parchment-500'>{t.game.returnDeviceDescription}</p>
        <Button onClick={onReady} size='lg' variant='gold' fullWidth>
          <Icon name='check' size='md' className='mr-2' />
          {t.game.returnDeviceReady}
        </Button>
      </div>
    </div>
  )
}
