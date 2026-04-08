import demon from './definition/demon'
import minion from './definition/minion'
import outsider from './definition/outsider'
import townsfolk from './definition/townsfolk'
import type { TeamDefinition, TeamId } from './types'

export type { TeamDefinition, TeamId } from './types'

const TEAMS: Record<TeamId, TeamDefinition> = {
  townsfolk,
  outsider,
  minion,
  demon,
}

export function getTeam(teamId: TeamId): TeamDefinition {
  return TEAMS[teamId]
}

export function getAllTeams(): TeamDefinition[] {
  return Object.values(TEAMS)
}

export function isGoodTeam(teamId: TeamId): boolean {
  return teamId === 'townsfolk' || teamId === 'outsider'
}

export function isEvilTeam(teamId: TeamId): boolean {
  return teamId === 'minion' || teamId === 'demon'
}
