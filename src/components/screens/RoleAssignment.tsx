import { useState, useMemo } from 'react'
import { getRole } from '../../lib/roles'
import { getTeam } from '../../lib/teams'
import { useI18n, interpolate, getRoleName } from '../../lib/i18n'
import { resolveRoleAssignments } from '../../lib/roleAssignment'
import { Button, Icon, Badge, BackButton } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { cn } from '../../lib/utils'

type Props = {
  players: string[]
  selectedRoles: string[]
  onStart: (assignments: { name: string; roleId: string }[]) => void
  onBack: () => void
}

export function RoleAssignment({ players, selectedRoles, onStart, onBack }: Props) {
  const { t, language } = useI18n()
  const [showCustomize, setShowCustomize] = useState(false)
  const [assignments, setAssignments] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {}
    players.forEach((name) => {
      initial[name] = null
    })
    return initial
  })
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)

  const rolePool = useMemo(() => {
    const pool: Record<string, number> = {}
    for (const roleId of selectedRoles) {
      pool[roleId] = (pool[roleId] ?? 0) + 1
    }
    return pool
  }, [selectedRoles])

  const assignedCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const roleId of Object.values(assignments)) {
      if (roleId) {
        counts[roleId] = (counts[roleId] ?? 0) + 1
      }
    }
    return counts
  }, [assignments])

  const getAvailableRoles = (playerName: string) => {
    const currentAssignment = assignments[playerName]
    const available: string[] = []

    for (const [roleId, total] of Object.entries(rolePool)) {
      const assigned = assignedCounts[roleId] ?? 0
      const isCurrentlyAssigned = currentAssignment === roleId

      if (assigned < total || isCurrentlyAssigned) {
        available.push(roleId)
      }
    }

    return available
  }

  const handleAssignment = (playerName: string, roleId: string | null) => {
    setAssignments({ ...assignments, [playerName]: roleId })
  }

  const handleRandomizeAll = () => {
    const reset: Record<string, string | null> = {}
    players.forEach((name) => {
      reset[name] = null
    })
    setAssignments(reset)
    setExpandedPlayer(null)
  }

  const handleStart = () => {
    const finalAssignments = resolveRoleAssignments({
      players,
      selectedRoles,
      manualAssignments: assignments,
    })
    onStart(finalAssignments)
  }

  const manuallyAssignedCount = Object.values(assignments).filter((r) => r !== null).length
  const willBeRandomlyAssigned = players.length - manuallyAssignedCount

  // Get unique roles for summary display
  const uniqueRoles = useMemo(() => {
    const seen = new Set<string>()
    return selectedRoles.filter((roleId) => {
      if (seen.has(roleId)) return false
      seen.add(roleId)
      return true
    })
  }, [selectedRoles])

  // Roles remaining in the random pool
  const rolesInRandomPool = useMemo(() => {
    const pool = { ...rolePool }
    for (const [roleId, count] of Object.entries(assignedCounts)) {
      pool[roleId] = (pool[roleId] ?? 0) - count
      if (pool[roleId] <= 0) delete pool[roleId]
    }
    const result: string[] = []
    for (const [roleId, count] of Object.entries(pool)) {
      for (let i = 0; i < count; i++) {
        result.push(roleId)
      }
    }
    return result
  }, [rolePool, assignedCounts])

  const impManuallyAssigned = Object.values(assignments).includes('imp')
  const impInRandomPool = rolesInRandomPool.includes('imp')
  const impWillBeAssigned = impManuallyAssigned || (willBeRandomlyAssigned > 0 && impInRandomPool)

  return (
    <div className='flex min-h-app flex-col bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker'>
      {/* Header */}
      <div className='sticky top-0 z-10 border-b border-mystic-gold/20 bg-grimoire-dark/95 px-4 py-3 backdrop-blur-xs'>
        <div className='mx-auto flex max-w-lg items-center gap-3'>
          <BackButton onClick={onBack} />
          <div>
            <h1 className='font-tarot text-lg tracking-wider text-parchment-100 uppercase'>{t.newGame.step3Title}</h1>
            <p className='text-xs text-parchment-500'>{t.newGame.step3Subtitle}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      {!impWillBeAssigned && selectedRoles.includes('imp') && (
        <div className='border-b border-red-500/30 bg-mystic-crimson/20 px-4 py-3'>
          <div className='mx-auto flex max-w-lg items-start gap-2'>
            <Icon name='alertTriangle' size='sm' className='mt-0.5 flex-shrink-0 text-red-400' />
            <p className='text-xs text-red-200'>{t.newGame.impNotAssignedWarning}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className='mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 py-4'>
        {/* Summary */}
        <div className='mb-4 rounded-xl border border-white/10 bg-white/5 p-4'>
          <div className='mb-3 flex items-center gap-2'>
            <Icon name='dices' size='md' className='text-mystic-gold' />
            <span className='text-sm font-medium text-parchment-100'>{t.newGame.rolesRandomlyAssigned}</span>
          </div>

          {/* Players list */}
          <div className='mb-2 flex items-start gap-2'>
            <Icon name='users' size='sm' className='mt-0.5 flex-shrink-0 text-parchment-500' />
            <span className='line-clamp-2 text-xs text-parchment-400'>{players.join(', ')}</span>
          </div>

          {/* Roles chips */}
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {uniqueRoles.map((roleId) => {
              const role = getRole(roleId)
              if (!role) return null
              const count = rolePool[roleId] ?? 1
              return (
                <Badge key={roleId} variant={role.team} className='inline-flex items-center gap-1'>
                  <Icon name={role.icon} size='xs' />
                  {getRoleName(roleId, language)}
                  {count > 1 && <span className='opacity-60'>x{count}</span>}
                </Badge>
              )
            })}
          </div>
        </div>

        {/* Customize toggle */}
        <button
          onClick={() => {
            setShowCustomize(!showCustomize)
            if (showCustomize) setExpandedPlayer(null)
          }}
          className='mb-4 flex w-full items-center justify-center gap-2 py-2.5 text-sm text-mystic-gold/80 transition-colors hover:text-mystic-gold'
        >
          <Icon name={showCustomize ? 'chevronUp' : 'chevronDown'} size='sm' />
          {t.newGame.customizeAssignments}
        </button>

        {/* Customization section */}
        {showCustomize && (
          <div>
            <div className='mb-3 flex items-center justify-between'>
              <p className='text-xs text-parchment-500'>{t.newGame.tapToAssign}</p>
              {manuallyAssignedCount > 0 && (
                <button
                  onClick={handleRandomizeAll}
                  className='flex items-center gap-1 text-xs text-mystic-gold/70 transition-colors hover:text-mystic-gold'
                >
                  <Icon name='shuffle' size='xs' />
                  {t.newGame.resetToRandom}
                </button>
              )}
            </div>

            {/* Player list */}
            <div className='mb-4 space-y-2'>
              {players.map((playerName) => {
                const isExpanded = expandedPlayer === playerName
                const currentRole = assignments[playerName]
                const role = currentRole ? getRole(currentRole) : null
                const team = role ? getTeam(role.team) : null

                return (
                  <div
                    key={playerName}
                    className={cn(
                      'rounded-xl border transition-all',
                      isExpanded
                        ? 'border-mystic-gold/30 bg-white/[0.08]'
                        : currentRole && team
                          ? cn(team.colors.cardBorder, 'bg-white/5')
                          : 'border-white/10 bg-white/5',
                    )}
                  >
                    {/* Player row */}
                    <button
                      type='button'
                      onClick={() => setExpandedPlayer(isExpanded ? null : playerName)}
                      className='flex w-full items-center justify-between p-3 text-left'
                    >
                      <span className='text-sm font-medium text-parchment-100'>{playerName}</span>
                      {role ? (
                        <Badge variant={role.team} className='inline-flex items-center gap-1'>
                          <Icon name={role.icon} size='xs' />
                          {getRoleName(role.id, language)}
                        </Badge>
                      ) : (
                        <span className='flex items-center gap-1 text-xs text-parchment-500'>
                          <Icon name='dices' size='xs' />
                          {t.common.random}
                        </span>
                      )}
                    </button>

                    {/* Expanded role picker */}
                    {isExpanded && (
                      <div className='px-3 pt-0 pb-3'>
                        <div className='border-t border-white/10 pt-3'>
                          <div className='flex flex-wrap gap-2'>
                            {/* Random option */}
                            <button
                              type='button'
                              onClick={() => {
                                handleAssignment(playerName, null)
                                setExpandedPlayer(null)
                              }}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border min-h-[36px]',
                                !currentRole
                                  ? 'bg-mystic-gold/20 border-mystic-gold/40 text-mystic-gold'
                                  : 'bg-white/5 border-white/20 text-parchment-400 hover:bg-white/10',
                              )}
                            >
                              <Icon name='dices' size='xs' />
                              {t.common.random}
                            </button>

                            {/* Available roles */}
                            {getAvailableRoles(playerName).map((roleId) => {
                              const r = getRole(roleId)
                              if (!r) return null
                              const rTeam = getTeam(r.team)
                              const isAssigned = currentRole === roleId

                              return (
                                <button
                                  key={roleId}
                                  type='button'
                                  onClick={() => {
                                    handleAssignment(playerName, roleId)
                                    setExpandedPlayer(null)
                                  }}
                                  className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border min-h-[36px]',
                                    isAssigned
                                      ? cn(rTeam.colors.badge, rTeam.colors.badgeText, 'ring-1 ring-white/30')
                                      : cn('bg-white/5 border-white/20 hover:bg-white/10', rTeam.colors.text),
                                  )}
                                >
                                  <Icon name={r.icon} size='xs' />
                                  {getRoleName(roleId, language)}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Random Pool */}
            {rolesInRandomPool.length > 0 && willBeRandomlyAssigned > 0 && (
              <div className='mb-4'>
                <div className='mb-2 flex items-center gap-2 text-parchment-400'>
                  <Icon name='dices' size='sm' />
                  <span className='text-xs tracking-wider uppercase'>{t.newGame.randomPool}</span>
                  <span className='text-xs text-parchment-500'>
                    (
                    {interpolate(t.newGame.rolesForPlayers, {
                      roles: rolesInRandomPool.length,
                      players: willBeRandomlyAssigned,
                    })}
                    )
                  </span>
                </div>
                <div className='flex flex-wrap gap-1.5'>
                  {rolesInRandomPool.map((roleId, i) => {
                    const r = getRole(roleId)
                    return (
                      <Badge key={`${roleId}-${i}`} variant={r?.team} className='inline-flex items-center gap-1'>
                        {r && <Icon name={r.icon} size='xs' />}
                        {getRoleName(roleId, language)}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <ScreenFooter>
        <Button onClick={handleStart} fullWidth size='lg' variant='gold'>
          <Icon name='play' size='md' className='mr-2' />
          {t.common.startGame}
        </Button>
      </ScreenFooter>
    </div>
  )
}
