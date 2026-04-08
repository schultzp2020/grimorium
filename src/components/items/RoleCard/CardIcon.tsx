import { type TeamDefinition, type TeamId, getTeam } from '../../../lib/teams'
import { cn } from '../../../lib/utils'
import { Icon } from '../../atoms'
import type { IconName } from '../../atoms/icon'

function ArcaneSeal({ team }: { team: TeamDefinition }) {
  // Build tick marks — more marks = more ornate
  const outerTicks = team.id === 'demon' ? 12 : 8
  const innerTicks = team.id === 'outsider' ? 6 : 4

  return (
    <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
      {/* Outer seal ring */}
      <div
        className={cn(
          'card-seal-outer absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full border',
          team.colors.cardSealRing,
        )}
      >
        {/* Tick marks around the ring */}
        {Array.from({ length: outerTicks }).map((_, i) => (
          <div
            key={i}
            className='absolute top-0 left-1/2 h-full -translate-x-1/2'
            style={{
              transform: `rotate(${(360 / outerTicks) * i}deg)`,
            }}
          >
            <div
              className={cn(
                'w-px h-2 mx-auto',
                team.id === 'demon'
                  ? 'bg-red-500/20'
                  : team.id === 'minion'
                    ? 'bg-orange-400/15'
                    : team.id === 'outsider'
                      ? 'bg-mystic-silver/15'
                      : 'bg-mystic-gold/15',
              )}
            />
          </div>
        ))}
      </div>

      {/* Inner seal ring */}
      <div
        className={cn(
          'card-seal-inner absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full border',
          team.colors.cardSealRing,
        )}
      >
        {Array.from({ length: innerTicks }).map((_, i) => (
          <div
            key={i}
            className='absolute top-0 left-1/2 h-full -translate-x-1/2'
            style={{
              transform: `rotate(${(360 / innerTicks) * i}deg)`,
            }}
          >
            <div
              className={cn(
                'w-px h-1.5 mx-auto',
                team.id === 'demon'
                  ? 'bg-red-500/15'
                  : team.id === 'minion'
                    ? 'bg-orange-400/10'
                    : team.id === 'outsider'
                      ? 'bg-mystic-silver/10'
                      : 'bg-mystic-gold/10',
              )}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

interface CardIconProps {
  icon: IconName
  teamId: TeamId
}

/**
 * Arcane seal + centered icon, themed by team.
 * Used by both RoleCard and OracleCard.
 */
export function CardIcon({ icon, teamId }: CardIconProps) {
  const team = getTeam(teamId)
  return (
    <div className='relative mb-3 flex justify-center py-2 sm:mb-6'>
      {/* Rotating arcane seal rings */}
      <ArcaneSeal team={team} />

      {/* Icon circle */}
      <div
        className={cn(
          'relative z-10 w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center',
          team.colors.cardIconBg,
        )}
      >
        <span
          className={team.colors.cardWinAccent}
          style={{
            filter: `drop-shadow(${team.colors.cardIconGlow})`,
          }}
        >
          <Icon name={icon} size='2xl' className='sm:h-20 sm:w-20' />
        </span>
      </div>
    </div>
  )
}
