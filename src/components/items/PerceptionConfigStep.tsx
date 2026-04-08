import { useState } from 'react'

import { getEffect, resolveCanRegisterAs } from '../../lib/effects/registry'
import { getEffectName as getRegistryEffectName, getRoleName as getRegistryRoleName, useI18n } from '../../lib/i18n'
import type { Perception, PerceptionContext } from '../../lib/pipeline/types'
import { getAllRoles, getRole } from '../../lib/roles/registry'
import type { TeamId } from '../../lib/teams'
import type { GameState, PlayerState } from '../../lib/types'
import { cn } from '../../lib/utils'
import { Icon } from '../atoms'
import type { IconName } from '../atoms/icon'
import { RolePickerGrid } from '../inputs/RolePickerGrid'
import { NarratorSetupLayout } from '../layouts'

interface Props {
  /** Players whose perception is ambiguous for this context. */
  ambiguousPlayers: PlayerState[]
  /** What aspect of perception is being configured. */
  context: PerceptionContext
  /** Current game state (for display purposes). */
  state: GameState
  /** Role icon for the layout header. */
  roleIcon: IconName
  /** Role name for the layout header. */
  roleName: string
  /** Player name (the role's owner) for the layout header. */
  playerName: string
  /** Called when the narrator confirms the overrides. */
  onComplete: (overrides: Record<string, Partial<Perception>>) => void
}

/**
 * Narrator-only screen for configuring how ambiguous players register
 * for a specific role's information ability.
 *
 * For each ambiguous player, shows their actual role and lets the narrator
 * toggle whether they should misregister (e.g., appear evil instead of good,
 * or appear as a different team).
 * The overrides are ephemeral — they only affect the current night action
 * calculation, no game events are emitted.
 */
export function PerceptionConfigStep({
  ambiguousPlayers,
  context,
  state,
  roleIcon,
  roleName,
  playerName,
  onComplete,
}: Props) {
  const { t, language } = useI18n()

  // Track per-player override decisions: null = keep default, object = override
  const [overrides, setOverrides] = useState<Record<string, Partial<Perception> | null>>(() => {
    const initial: Record<string, Partial<Perception> | null> = {}
    for (const p of ambiguousPlayers) {
      initial[p.id] = null // default: no override
    }
    return initial
  })

  const handleToggleAlignment = (playerId: string, evil: boolean) => {
    setOverrides((prev) => ({
      ...prev,
      [playerId]: evil ? { alignment: 'evil' } : null,
    }))
  }

  const handleToggleTeam = (playerId: string, team: TeamId | null) => {
    setOverrides((prev) => ({
      ...prev,
      [playerId]: team ? { team } : null,
    }))
  }

  const handleToggleRole = (playerId: string, roleId: string | null) => {
    setOverrides((prev) => ({
      ...prev,
      [playerId]: roleId ? { roleId } : null,
    }))
  }

  const handleConfirm = () => {
    // Build the final overrides map (only include non-null entries)
    const result: Record<string, Partial<Perception>> = {}
    for (const [playerId, override] of Object.entries(overrides)) {
      if (override) {
        result[playerId] = override
      }
    }
    onComplete(result)
  }

  const getRoleName = (roleId: string) => getRegistryRoleName(roleId, language)

  const getTeamName = (teamId: TeamId) => t.teams[teamId].name

  return (
    <NarratorSetupLayout
      icon={roleIcon}
      roleName={roleName}
      playerName={playerName}
      onShowToPlayer={handleConfirm}
      showToPlayerLabel={t.common.confirm}
    >
      <div className='mb-4 text-center'>
        <h3 className='text-lg font-semibold text-amber-200'>{t.game.perceptionConfigTitle}</h3>
        <p className='mt-1 text-sm text-stone-400'>{t.game.perceptionConfigDescription}</p>
      </div>

      <div className='space-y-3'>
        {ambiguousPlayers.map((player) => {
          const role = getRole(player.roleId)
          const isOverriddenEvil = overrides[player.id]?.alignment === 'evil'
          const overriddenTeam = overrides[player.id]?.team
          const overriddenRole = overrides[player.id]?.roleId

          // Find the effect that grants misregistration for display
          const misregisterEffect = player.effects.find((e) => {
            const def = getEffect(e.type)
            const canReg = resolveCanRegisterAs(e, def)
            if (!canReg) {
              return false
            }
            if (context === 'alignment' && canReg.alignments?.length) {
              return true
            }
            if (context === 'team' && canReg.teams?.length) {
              return true
            }
            if (context === 'role' && (canReg.teams?.length || canReg.alignments?.length)) {
              return true
            }
            return false
          })
          const effectDef = misregisterEffect ? getEffect(misregisterEffect.type) : null
          const effectName = effectDef ? getRegistryEffectName(effectDef.id, language) : ''

          const actualTeam = role?.team ?? 'townsfolk'

          const canRegTeams = misregisterEffect ? (resolveCanRegisterAs(misregisterEffect, effectDef)?.teams ?? []) : []

          // For role context: get all roles filtered by what the effect allows
          const allowedTeams = misregisterEffect
            ? (resolveCanRegisterAs(misregisterEffect, effectDef)?.teams ?? [])
            : []
          const allowedAlignments = misregisterEffect
            ? (resolveCanRegisterAs(misregisterEffect, effectDef)?.alignments ?? [])
            : []

          const validRolesForOverride = getAllRoles().filter((r) => {
            if (allowedTeams.includes(r.team)) {
              return true
            }
            if (allowedAlignments.includes('evil') && (r.team === 'minion' || r.team === 'demon')) {
              return true
            }
            if (allowedAlignments.includes('good') && (r.team === 'townsfolk' || r.team === 'outsider')) {
              return true
            }
            return false
          })

          return (
            <div key={player.id} className='rounded-xl border border-white/10 bg-white/5 p-4'>
              {/* Player info */}
              <div className='mb-3 flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500/20'>
                  <Icon name={role?.icon ?? 'user'} size='md' className='text-indigo-300' />
                </div>
                <div>
                  <div className='font-medium text-parchment-100'>{player.name}</div>
                  <div className='text-xs text-parchment-500'>
                    {t.game.actualRole.replace('{role}', getRoleName(player.roleId))} — {effectName}
                  </div>
                </div>
              </div>

              {/* Alignment toggle for "alignment" context */}
              {context === 'alignment' && (
                <div className='flex gap-2'>
                  <button
                    type='button'
                    onClick={() => handleToggleAlignment(player.id, false)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
                      !isOverriddenEvil
                        ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-parchment-500 hover:bg-white/10',
                    )}
                  >
                    <Icon name='shield' size='sm' className='mr-1.5 inline' />
                    {t.game.registerAsGood}
                  </button>
                  <button
                    type='button'
                    onClick={() => handleToggleAlignment(player.id, true)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
                      isOverriddenEvil
                        ? 'bg-red-900/40 border-red-500/50 text-red-300'
                        : 'bg-white/5 border-white/10 text-parchment-500 hover:bg-white/10',
                    )}
                  >
                    <Icon name='skull' size='sm' className='mr-1.5 inline' />
                    {t.game.registerAsEvil}
                  </button>
                </div>
              )}

              {/* Team toggle for "team" context — actual team + misregister teams */}
              {context === 'team' && (
                <div className='flex flex-wrap gap-2'>
                  <button
                    type='button'
                    onClick={() => handleToggleTeam(player.id, null)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border min-w-0',
                      !overriddenTeam
                        ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-parchment-500 hover:bg-white/10',
                    )}
                  >
                    {t.game.keepOriginalTeam.replace('{team}', getTeamName(actualTeam))}
                  </button>
                  {canRegTeams.map((team) => (
                    <button
                      type='button'
                      key={team}
                      onClick={() => handleToggleTeam(player.id, team)}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border min-w-0',
                        overriddenTeam === team
                          ? 'bg-red-900/40 border-red-500/50 text-red-300'
                          : 'bg-white/5 border-white/10 text-parchment-500 hover:bg-white/10',
                      )}
                    >
                      {getTeamName(team)}
                    </button>
                  ))}
                </div>
              )}

              {/* For "role" context, show a role picker grid */}
              {context === 'role' && (
                <div className='mt-3'>
                  <div className='mb-3 flex gap-2'>
                    <button
                      type='button'
                      onClick={() => handleToggleRole(player.id, null)}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border',
                        !overriddenRole
                          ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-parchment-500 hover:bg-white/10',
                      )}
                    >
                      {t.game.keepOriginalRole.replace('{role}', getRoleName(player.roleId))}
                    </button>
                  </div>
                  {overriddenRole !== undefined && (
                    <p className='mb-2 text-center text-xs font-semibold tracking-wider text-parchment-400 uppercase'>
                      {t.game.chooseFalseRole}
                    </p>
                  )}
                  <RolePickerGrid
                    roles={validRolesForOverride}
                    state={state}
                    selected={overriddenRole ? [overriddenRole] : []}
                    onSelect={(roleId) => handleToggleRole(player.id, roleId === overriddenRole ? null : roleId)}
                    selectionCount={1}
                    colorMode='team'
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </NarratorSetupLayout>
  )
}
