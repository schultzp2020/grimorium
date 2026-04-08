import { useEffect, useState } from 'react'

import { useI18n } from '../../lib/i18n'
import { getRole } from '../../lib/roles/registry'
import { getTeam } from '../../lib/teams'
import { cn } from '../../lib/utils'
import { Button, Icon } from '../atoms'
import { TeamBackground } from '../items'
import { RoleCard } from '../items/RoleCard'

export interface DeathRevealEntry {
  playerId: string
  playerName: string
  roleId: string
}

interface Props {
  deaths: DeathRevealEntry[]
  onContinue: () => void
}

export function DeathRevealScreen({ deaths, onContinue }: Props) {
  const { t } = useI18n()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const currentDeath = deaths[currentIndex]
  const isLastDeath = currentIndex === deaths.length - 1

  // Auto-flip after a short delay when showing a new death
  useEffect(() => {
    setIsFlipped(false)
    const timer = setTimeout(() => {
      setIsFlipped(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [currentIndex])

  const handleNext = () => {
    if (isLastDeath) {
      onContinue()
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- array bounds check
  if (!currentDeath) {
    return null
  }

  const role = getRole(currentDeath.roleId)
  const teamId = role?.team ?? 'townsfolk'
  const team = getTeam(teamId)

  return (
    <TeamBackground teamId={teamId}>
      {/* Header */}
      <div className='pointer-events-none absolute inset-x-0 top-0 z-10 bg-linear-to-b from-grimoire-dark/80 to-transparent p-6 text-center'>
        <div className='mb-2 flex justify-center'>
          <Icon name='skull' size='3xl' className='text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' />
        </div>
        <h1 className='font-tarot text-2xl tracking-widest-xl text-red-50 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'>
          {t.game.deathRevealTitle}
        </h1>
        <p className='mt-1 text-sm tracking-widest text-red-200/80 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'>
          {t.game.deathRevealSubtitle}
        </p>
      </div>

      {/* 3D Card + Player Name + Button — all in one centered column */}
      <div className='flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-4'>
        <div className='death-card-container'>
          <div className={cn('death-card-inner', isFlipped && 'is-flipped')}>
            {/* BACK FACE (Player Name + Skull) */}
            <div className='death-card-face'>
              <div
                className={cn(
                  'w-full aspect-[2.5/3.5] rounded-xl border-2 flex flex-col items-center justify-center p-8 bg-parchment-texture relative overflow-hidden',
                  team.colors.cardBg,
                  team.colors.cardBorder,
                )}
                style={{
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(0,0,0,0.6)',
                }}
              >
                <div className='absolute inset-0 bg-red-950/40 mix-blend-multiply' />
                <div className='absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/40' />

                <div className='relative z-10 flex flex-col items-center'>
                  <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-950/80 shadow-[0_0_30px_rgba(239,68,68,0.2)]'>
                    <Icon name='skull' size='3xl' className='text-red-400 opacity-80' />
                  </div>
                  <h2 className='mb-2 text-center font-tarot text-2xl tracking-widest text-parchment-100 drop-shadow-lg sm:text-3xl'>
                    {currentDeath.playerName}
                  </h2>
                </div>
              </div>
            </div>

            {/* FRONT FACE (Role Card + Death Overlay) */}
            <div className='death-card-face death-card-front'>
              <div className='relative'>
                <RoleCard roleId={currentDeath.roleId} />

                {/* Death Vignette Overlay */}
                <div
                  className='pointer-events-none absolute inset-0 rounded-xl bg-linear-to-b from-red-950/20 via-transparent to-red-950/80'
                  style={{ boxShadow: 'inset 0 0 60px rgba(153, 27, 27, 0.4)' }}
                />

                {/* "DEAD" Stamp */}
                <div className='pointer-events-none absolute inset-x-0 bottom-[15%] flex justify-center'>
                  <div className='-rotate-12 transform rounded-sm border-2 border-red-500/50 bg-red-950/90 px-6 py-2 shadow-[0_0_30px_rgba(239,68,68,0.5)] backdrop-blur-xs'>
                    <span className='font-tarot text-2xl tracking-widest-xl text-red-400 uppercase'>
                      {t.game.deathRevealDead}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Name (below the card, fades in after flip) */}
        <div
          className={cn(
            'flex flex-col items-center transition-all duration-700',
            isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          )}
        >
          <h2 className='text-center font-tarot text-2xl tracking-widest text-parchment-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-3xl'>
            {currentDeath.playerName}
          </h2>
        </div>

        {/* Floating Button (no footer background) */}
        <Button
          onClick={handleNext}
          size='lg'
          variant='danger'
          disabled={!isFlipped}
          className={cn(
            'transition-all duration-500 px-12',
            isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          )}
        >
          {isLastDeath ? t.game.deathRevealContinue : t.game.deathRevealNextDeath}
          <Icon name='arrowRight' size='md' className='ml-2' />
        </Button>
      </div>
    </TeamBackground>
  )
}
