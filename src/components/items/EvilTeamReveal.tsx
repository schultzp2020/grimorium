import { useMemo } from 'react'

import { getRoleName, useI18n } from '../../lib/i18n'
import { getRole } from '../../lib/roles/registry'
import type { GameState, PlayerState } from '../../lib/types'
import { Icon } from '../atoms'

// ============================================================================
// TYPES
// ============================================================================

interface EvilTeamRevealProps {
  /** Current game state */
  state: GameState
  /** The player viewing this screen (excluded from the list) */
  viewer: PlayerState
  /** "demon" shows minions + demon info; "minion" shows other minions + demons */
  viewerType: 'demon' | 'minion'
}

interface TeamMember {
  player: PlayerState
  showRole: boolean
  teamLabel: string
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Shared component for first-night evil team revelation.
 *
 * - When viewerType is "demon": Shows minion players (name only, no role).
 * - When viewerType is "minion": Shows other minions (name only) and demons
 *   (name + role name, since minions learn the Demon's identity).
 */
export function EvilTeamReveal({ state, viewer, viewerType }: EvilTeamRevealProps) {
  const { t, language } = useI18n()

  const teamMembers: TeamMember[] = useMemo(() => {
    const members: TeamMember[] = []

    for (const p of state.players) {
      if (p.id === viewer.id) {
        continue
      }
      const role = getRole(p.roleId)
      if (!role) {
        continue
      }

      if (role.team === 'minion') {
        members.push({
          player: p,
          showRole: false, // Never show minion roles
          teamLabel: t.teams.minion.name,
        })
      } else if (role.team === 'demon') {
        members.push({
          player: p,
          showRole: viewerType === 'minion', // Minions learn the Demon role
          teamLabel: t.teams.demon.name,
        })
      }
    }

    // Sort: demons first (when viewer is minion), then minions
    members.sort((a, b) => {
      const aRole = getRole(a.player.roleId)
      const bRole = getRole(b.player.roleId)
      if (aRole?.team === 'demon' && bRole?.team !== 'demon') {
        return -1
      }
      if (aRole?.team !== 'demon' && bRole?.team === 'demon') {
        return 1
      }
      return 0
    })

    return members
  }, [state.players, viewer.id, viewerType, t])

  if (teamMembers.length === 0) {
    return <div className='p-4 text-center text-parchment-500'>{t.game.noEvilTeammates}</div>
  }

  return (
    <div className='space-y-3'>
      {teamMembers.map((member) => {
        const role = getRole(member.player.roleId)
        const isDemon = role?.team === 'demon'

        return (
          <div
            key={member.player.id}
            className={`flex items-center gap-3 rounded-lg p-4 ${
              isDemon ? 'border border-red-700/40 bg-red-900/30' : 'border border-orange-700/30 bg-orange-900/20'
            }`}
          >
            {/* Generic team icon */}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isDemon ? 'border border-red-600/30 bg-red-800/40' : 'border border-orange-600/20 bg-orange-800/30'
              }`}
            >
              <Icon
                name={isDemon ? 'flameKindling' : 'swords'}
                size='md'
                className={isDemon ? 'text-red-300' : 'text-orange-300'}
              />
            </div>

            {/* Player info */}
            <div>
              <div className='font-medium text-parchment-100'>{member.player.name}</div>
              <div className={`text-xs ${isDemon ? 'text-red-400/70' : 'text-orange-400/70'}`}>
                {member.showRole && role ? getRoleName(role.id, language) : member.teamLabel}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
