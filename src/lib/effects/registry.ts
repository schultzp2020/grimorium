import type { TeamId } from '../teams'
import type { EffectInstance } from '../types'
import type { EffectDefinition, EffectId, EffectType } from './types'

const EFFECTS = new Map<EffectId, EffectDefinition>()

export function registerEffect(effect: EffectDefinition): void {
  EFFECTS.set(effect.id, effect)
}

/** Remove an effect definition from the registry (used for test cleanup). */
export function unregisterEffect(effectId: EffectId): void {
  EFFECTS.delete(effectId)
}

export function getEffect(effectId: string): EffectDefinition | undefined {
  return EFFECTS.get(effectId as EffectId)
}

export function getAllEffects(): EffectDefinition[] {
  return [...EFFECTS.values()]
}

/**
 * Check if a player's ability is malfunctioning due to effects
 * like Poisoned or Drunk. Uses the `poisonsAbility` flag on effect definitions.
 */
export function isMalfunctioning(player: { effects: { type: string }[] }): boolean {
  return player.effects.some((e) => {
    const def = EFFECTS.get(e.type as EffectId)
    return def?.poisonsAbility === true
  })
}

/**
 * Resolves the semantic type of an effect instance for badge styling.
 * Same effect can have different types (e.g. safe from Soldier vs Monk).
 */
export function getEffectType(instance: EffectInstance, def?: EffectDefinition | null): EffectType {
  if (!def) {
    return 'marker'
  }
  if (def.getType) {
    return def.getType(instance)
  }
  return def.defaultType ?? 'marker'
}

/**
 * Resolve canRegisterAs for a specific effect instance.
 * Instance data takes precedence over the definition value. This allows
 * a single generic effect (e.g., `misregister`) to be configured differently
 * for different roles (Recluse vs Spy).
 */
export function resolveCanRegisterAs(
  instance: EffectInstance,
  def?: EffectDefinition | null,
): { teams?: TeamId[]; alignments?: ('good' | 'evil')[] } | undefined {
  // Instance data takes precedence
  const instanceData = instance.data?.canRegisterAs as
    | { teams?: TeamId[]; alignments?: ('good' | 'evil')[] }
    | undefined
  if (instanceData) {
    return instanceData
  }
  // Fall back to definition
  return def?.canRegisterAs
}

/** Badge variant for each effect type (for Badge component). */
export const EFFECT_TYPE_BADGE_VARIANT: Record<EffectType, `effect_${EffectType}`> = {
  buff: 'effect_buff',
  nerf: 'effect_nerf',
  marker: 'effect_marker',
  passive: 'effect_passive',
  perception: 'effect_perception',
  pending: 'effect_pending',
}
