import { getRoleName, interpolate, useI18n } from '../../lib/i18n'
import { getRole } from '../../lib/roles/registry'
import type { NightStepAudience } from '../../lib/roles/types'
import { getTeam } from '../../lib/teams'
import type { PlayerState } from '../../lib/types'
import { cn } from '../../lib/utils'
import { Icon } from '../atoms'
import { MysticDivider } from '../items/MysticDivider'

interface Props {
  player: PlayerState
  title?: string
  description?: string
  children: React.ReactNode
  /**
   * Who this screen is for. Affects background gradient and shows a contextual banner.
   * - `narrator` — blue/indigo background, "This is your decision" banner
   * - `player_choice` — amber/warm background, "Wake player and ask them" banner
   * - `player_reveal` — no banner (PlayerFacingScreen handles the interstitial)
   * If omitted, no banner is shown and the default role-themed background is used.
   */
  audience?: NightStepAudience
}

export function NightActionLayout({ player, title, description, children, audience }: Props) {
  const { t, language } = useI18n()
  const role = getRole(player.roleId)
  const team = role ? getTeam(role.team) : null

  const isEvil = team?.isEvil ?? false

  // Determine background gradient based on audience
  const getBackgroundClass = () => {
    if (audience === 'player_choice') {
      return 'from-amber-950 via-orange-950/50 to-grimoire-darker'
    }
    if (audience === 'narrator') {
      return isEvil
        ? 'from-red-950 via-grimoire-blood to-grimoire-darker'
        : 'from-indigo-950 via-grimoire-purple to-grimoire-darker'
    }
    // Default (no audience or player_reveal): role-themed
    return isEvil
      ? 'from-red-950 via-grimoire-blood to-grimoire-darker'
      : 'from-indigo-950 via-grimoire-purple to-grimoire-darker'
  }

  // Determine header icon colors based on audience
  const getIconColors = () => {
    if (audience === 'player_choice') {
      return {
        circleBg: 'bg-amber-900/30 border-amber-600/40',
        icon: 'text-amber-400',
      }
    }
    return {
      circleBg: isEvil ? 'bg-red-900/30 border-red-600/40' : 'bg-indigo-500/10 border-indigo-400/30',
      icon: isEvil ? 'text-red-400 text-glow-crimson' : 'text-indigo-400',
    }
  }

  const iconColors = getIconColors()

  return (
    <div className={cn('min-h-app flex flex-col bg-gradient-to-b', getBackgroundClass())}>
      {/* Audience Banner */}
      {audience === 'narrator' && (
        <div className='mx-4 mt-4 mb-0 w-full max-w-lg self-center'>
          <div className='flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-900/30 px-3 py-2'>
            <Icon name='eye' size='sm' className='flex-shrink-0 text-blue-400' />
            <span className='text-xs text-blue-300'>{t.game.storytellerDecision}</span>
          </div>
        </div>
      )}
      {audience === 'player_choice' && (
        <div className='mx-4 mt-4 mb-0 w-full max-w-lg self-center'>
          <div className='flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-900/40 px-3 py-2'>
            <Icon name='userRound' size='sm' className='flex-shrink-0 text-amber-400' />
            <span className='text-xs font-medium text-amber-300'>
              {interpolate(t.game.wakePlayerPrompt, {
                player: player.name,
              })}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className='px-4 py-6 text-center'>
        <div className='mb-4 flex justify-center'>
          <div className={cn('w-20 h-20 rounded-full flex items-center justify-center border', iconColors.circleBg)}>
            <Icon name={role?.icon ?? 'moon'} size='3xl' className={iconColors.icon} />
          </div>
        </div>

        <h1 className='mb-1 font-tarot text-xl tracking-wider text-parchment-100 uppercase'>{player.name}</h1>
        {role && (
          <p
            className={cn(
              'text-sm',
              audience === 'player_choice' ? 'text-amber-400/70' : isEvil ? 'text-red-400/70' : 'text-indigo-400/70',
            )}
          >
            {getRoleName(role.id, language)}
          </p>
        )}

        {(title ?? description) && (
          <div className='mx-auto mt-6 max-w-sm'>
            <MysticDivider
              icon={audience === 'player_choice' ? 'userRound' : isEvil ? 'skull' : 'moon'}
              iconClassName={
                audience === 'player_choice' ? 'text-amber-500/40' : isEvil ? 'text-red-500/40' : 'text-indigo-400/40'
              }
              className='mb-4'
            />
            {title && <p className='mb-1 font-medium text-parchment-100'>{title}</p>}
            {description && <p className='text-sm text-parchment-400'>{description}</p>}
          </div>
        )}
      </div>

      {/* Content */}
      <div className='mx-auto w-full max-w-lg flex-1 px-4 pb-6'>{children}</div>
    </div>
  )
}
