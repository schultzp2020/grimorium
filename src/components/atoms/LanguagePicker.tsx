import * as Popover from '@radix-ui/react-popover'

import { LANGUAGES, useI18n } from '../../lib/i18n'
import { Icon } from './icon'

interface Props {
  variant?: 'button' | 'floating'
  className?: string
}

export function LanguagePicker({ variant = 'button', className = '' }: Props) {
  const { language, setLanguage } = useI18n()
  const current = LANGUAGES.find((l) => l.code === language)

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        {variant === 'floating' ? (
          <button
            type='button'
            className={`flex h-12 w-12 items-center justify-center rounded-full border border-mystic-gold/30 bg-grimoire-dark/90 text-sm font-medium text-mystic-gold shadow-lg transition-all hover:border-mystic-gold/50 hover:bg-grimoire-dark active:scale-95 ${className}`}
            title={current?.nativeName}
          >
            <Icon name='globe' size='md' />
          </button>
        ) : (
          <button
            type='button'
            className={`flex min-h-11 items-center gap-2 rounded-full border border-mystic-gold/30 px-3 py-2 text-sm text-mystic-gold/70 transition-all hover:border-mystic-gold/50 hover:text-mystic-gold active:scale-95 ${className}`}
          >
            <Icon name='globe' size='sm' />
            {current?.nativeName ?? language.toUpperCase()}
          </button>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side='bottom'
          align='end'
          sideOffset={8}
          collisionPadding={16}
          className='z-[100] min-w-[200px] origin-top-right overflow-hidden rounded-xl border border-mystic-gold/30 bg-grimoire-dark shadow-xl data-[state=closed]:animate-popover-out data-[state=open]:animate-popover-in'
        >
          <div className='py-1'>
            {LANGUAGES.map((lang) => {
              const isActive = lang.code === language
              return (
                <Popover.Close key={lang.code} asChild>
                  <button
                    type='button'
                    onClick={() => setLanguage(lang.code)}
                    className={`flex min-h-12 w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                      isActive ? 'bg-mystic-gold/15 text-mystic-gold' : 'text-parchment-300 active:bg-white/10'
                    }`}
                  >
                    <span className='flex-1 text-[15px] font-medium'>{lang.nativeName}</span>
                    {isActive && <Icon name='check' size='sm' className='shrink-0 text-mystic-gold' />}
                  </button>
                </Popover.Close>
              )
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
