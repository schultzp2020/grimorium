import type { RoleDefinition, RoleId } from './types'

const ROLES = new Map<RoleId, RoleDefinition>()
let initialized = false

export function registerRole(role: RoleDefinition): void {
  ROLES.set(role.id, role)
  initialized = true
}

function ensureInitialized(): void {
  if (!initialized) {
    throw new Error('Role registry not initialized. Ensure lib/roles/index.ts is imported before calling getRole().')
  }
}

export function getRole(roleId: string): RoleDefinition | undefined {
  ensureInitialized()
  return ROLES.get(roleId as RoleId)
}

export function getAllRoles(): RoleDefinition[] {
  ensureInitialized()
  return [...ROLES.values()]
}

// Get all roles sorted by night order (roles that wake at night)
export function getNightOrderRoles(): RoleDefinition[] {
  return getAllRoles()
    .filter((role) => role.nightOrder !== null)
    .sort((a, b) => (a.nightOrder ?? 0) - (b.nightOrder ?? 0))
}

/**
 * Get the raw ROLES record for direct access.
 * Prefer `getRole()` or `getAllRoles()` when possible.
 */
export function getRolesRecord(): Record<RoleId, RoleDefinition> {
  return Object.fromEntries(ROLES) as Record<RoleId, RoleDefinition>
}
