import type { IconName } from '../../components/atoms/icon'
import type { RoleId } from '../roles/types'

export type ScriptId = 'trouble-brewing' | 'custom'

export interface ScriptDefinition {
  id: ScriptId
  icon: IconName
  /** Available roles for this script ('custom' includes all roles) */
  roles: RoleId[]
  /** Whether to enforce the standard team distribution rules */
  enforceDistribution: boolean
}

export interface RoleDistribution {
  townsfolk: number
  outsider: number
  minion: number
  demon: number
}

export type GeneratorPreset = 'simple' | 'interesting' | 'chaotic'

export interface GeneratedPool {
  roles: RoleId[]
  totalChaos: number
  distribution: RoleDistribution
}
