import { useMemo } from 'react'

import { getRoleDescription, getRoleName, useI18n } from '../../lib/i18n'
import { getRole } from '../../lib/roles/registry'
import type { RoleId } from '../../lib/roles/types'
import { SCRIPTS } from '../../lib/scripts'
import { type TeamId, getTeam } from '../../lib/teams'
import { cn } from '../../lib/utils'
import { BackButton, Icon } from '../atoms'
import { MysticDivider } from '../items'
import { RoleCard } from '../items/RoleCard'
import { CardLink, TeamBackground } from '../items/TeamBackground'

interface Props {
  selectedRoleId: RoleId | null
  onBack: () => void
  onSelectRole: (roleId: RoleId) => void
  onDeselectRole: () => void
}

const TEAM_ORDER: TeamId[] = ['townsfolk', 'outsider', 'minion', 'demon']

export function RolesLibrary({ selectedRoleId, onBack, onSelectRole, onDeselectRole }: Props) {
  const { t, language } = useI18n()

  // Get all roles from the Trouble Brewing script (currently the only one)
  const scriptRoles = SCRIPTS['trouble-brewing'].roles

  // Group roles by team
  const rolesByTeam = TEAM_ORDER.map((teamId) => {
    const team = getTeam(teamId)
    const roles = scriptRoles
      .map((roleId) => getRole(roleId))
      .filter((role): role is NonNullable<ReturnType<typeof getRole>> => role?.team === teamId)
    return { teamId, team, roles }
  }).filter((group) => group.roles.length > 0)

  // Flat ordered list of all role IDs for arrow navigation
  const allRoleIds = useMemo(() => rolesByTeam.flatMap((group) => group.roles.map((r) => r.id)), [rolesByTeam])

  // If a role is selected, show its full RoleCard with prev/next navigation
  if (selectedRoleId) {
    const selectedRole = getRole(selectedRoleId)
    const selectedTeamId = selectedRole?.team ?? 'townsfolk'
    const selectedTeam = getTeam(selectedTeamId)

    const currentIndex = allRoleIds.indexOf(selectedRoleId)
    const goToPrev = () => {
      const prevIndex = (currentIndex - 1 + allRoleIds.length) % allRoleIds.length
      onSelectRole(allRoleIds[prevIndex])
    }
    const goToNext = () => {
      const nextIndex = (currentIndex + 1) % allRoleIds.length
      onSelectRole(allRoleIds[nextIndex])
    }

    return (
      <TeamBackground teamId={selectedTeamId}>
        {/* Navigation arrows */}
        <button
          type='button'
          onClick={goToPrev}
          className={cn(
            'absolute left-1 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            selectedTeam.isEvil
              ? 'text-red-400/50 hover:text-red-300 hover:bg-red-900/20'
              : 'text-parchment-400/50 hover:text-parchment-200 hover:bg-white/10',
          )}
        >
          <Icon name='chevronLeft' size='xl' />
        </button>
        <button
          type='button'
          onClick={goToNext}
          className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            selectedTeam.isEvil
              ? 'text-red-400/50 hover:text-red-300 hover:bg-red-900/20'
              : 'text-parchment-400/50 hover:text-parchment-200 hover:bg-white/10',
          )}
        >
          <Icon name='chevronRight' size='xl' />
        </button>

        <RoleCard roleId={selectedRoleId} />
        <CardLink onClick={onDeselectRole} isEvil={selectedTeam.isEvil}>
          {t.common.back}
        </CardLink>
      </TeamBackground>
    )
  }

  return (
    <div className='flex min-h-app flex-col bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker'>
      {/* Header */}
      <div className='px-4 pt-6 pb-4'>
        <div className='mb-4 flex items-center gap-3'>
          <BackButton onClick={onBack} />
          <div>
            <h1 className='font-tarot text-xl tracking-wider text-parchment-100 uppercase'>
              {t.mainMenu.rolesLibrary}
            </h1>
            <p className='text-sm text-parchment-400'>{t.mainMenu.browseAllRoles}</p>
          </div>
        </div>
        <MysticDivider />
      </div>

      {/* Role List */}
      <div className='flex-1 overflow-y-auto px-4 pb-6'>
        <div className='mx-auto w-full max-w-lg space-y-6'>
          {rolesByTeam.map(({ teamId, team, roles }) => {
            const teamTranslation = t.teams[teamId as keyof typeof t.teams]
            const { isEvil } = team

            return (
              <div key={teamId}>
                {/* Team Header */}
                <div className='mb-3 flex items-center gap-2'>
                  <Icon name={team.icon} size='sm' className={isEvil ? 'text-red-400' : 'text-mystic-gold'} />
                  <span
                    className={cn(
                      'text-sm font-semibold tracking-wider uppercase',
                      isEvil ? 'text-red-400' : 'text-mystic-gold',
                    )}
                  >
                    {teamTranslation.name}
                  </span>
                  <span className='text-xs text-parchment-500'>({roles.length})</span>
                </div>

                {/* Role Items */}
                <div className='space-y-1'>
                  {roles.map((role) => {
                    const roleName = getRoleName(role.id, language)
                    const roleDescription = getRoleDescription(role.id, language)

                    return (
                      <button
                        type='button'
                        key={role.id}
                        onClick={() => onSelectRole(role.id)}
                        className={cn(
                          'w-full py-3 px-4 text-left rounded-lg transition-colors group',
                          isEvil
                            ? 'hover:bg-red-950/30 border border-transparent hover:border-red-900/30'
                            : 'hover:bg-white/5 border border-transparent hover:border-white/10',
                        )}
                      >
                        <div className='flex items-start gap-3'>
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                              isEvil
                                ? 'bg-red-900/30 border border-red-600/30'
                                : 'bg-mystic-gold/10 border border-mystic-gold/20',
                            )}
                          >
                            <Icon name={role.icon} size='md' className={isEvil ? 'text-red-400' : 'text-mystic-gold'} />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div
                              className={cn(
                                'font-tarot text-sm uppercase tracking-wider',
                                isEvil
                                  ? 'text-red-300 group-hover:text-red-200'
                                  : 'text-parchment-100 group-hover:text-parchment-50',
                              )}
                            >
                              {roleName}
                            </div>
                            <p className='mt-0.5 line-clamp-2 text-xs text-parchment-500'>{roleDescription}</p>
                          </div>
                          <Icon
                            name='arrowRight'
                            size='sm'
                            className='text-parchment-600 mt-1 shrink-0 transition-colors group-hover:text-parchment-400'
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
