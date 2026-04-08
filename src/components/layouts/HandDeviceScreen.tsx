import { interpolate, useI18n } from '../../lib/i18n'
import { Button, Icon } from '../atoms'

interface Props {
  playerName: string
  onReady: () => void
}

export function HandDeviceScreen({ playerName, onReady }: Props) {
  const { t } = useI18n()

  return (
    <div className='flex min-h-app flex-col items-center justify-center bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker px-6'>
      <div className='max-w-sm text-center'>
        <div className='mb-6'>
          <Icon name='smartphone' size='4xl' className='mx-auto text-indigo-400/80' />
        </div>
        <h1 className='mb-3 font-tarot text-2xl tracking-widest-xl text-parchment-100 uppercase'>
          {interpolate(t.game.handDeviceTo, { player: playerName })}
        </h1>
        <p className='mb-10 text-sm text-parchment-500'>{t.game.tapWhenReady}</p>
        <Button onClick={onReady} size='lg' variant='default' fullWidth>
          <Icon name='check' size='md' className='mr-2' />
          {t.game.tapWhenReady}
        </Button>
      </div>
    </div>
  )
}
