import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import definition from '.'
import {
  addEffectTo,
  makeGameWithHistory,
  makePlayer,
  makeState,
  resetPlayerCounter,
} from '../../../../__tests__/helpers'
import { getEffect, registerEffect, unregisterEffect } from '../../../../effects/registry'
import type { EffectDefinition, EffectId } from '../../../../effects/types'
import { perceive } from '../../../../pipeline/perception'

// Track registered test effects so we can restore originals after each test
const originalEffects: Map<EffectId, EffectDefinition | undefined> = new Map()

function registerTestEffect(def: EffectDefinition) {
  if (!originalEffects.has(def.id)) {
    originalEffects.set(def.id, getEffect(def.id))
  }
  registerEffect(def)
}

function clearTestEffects() {
  for (const [id, original] of originalEffects) {
    if (original) {
      registerEffect(original)
    } else {
      unregisterEffect(id)
    }
  }
  originalEffects.clear()
}

beforeEach(() => {
  resetPlayerCounter()
})

afterEach(() => {
  clearTestEffects()
})

describe('Undertaker', () => {
  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('does not wake on the first night', () => {
      const player = makePlayer({ id: 'p1', roleId: 'undertaker' })
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 1 },
            stateOverrides: { round: 1 },
          },
        ],
        makeState({ round: 1, players: [player] }),
      )
      expect(definition.shouldWake!(game, player)).toBeFalsy()
    })

    it('does not wake when dead', () => {
      const player = addEffectTo(makePlayer({ id: 'p1', roleId: 'undertaker' }), 'dead')
      const game = makeGameWithHistory(
        [
          {
            type: 'day_started',
            data: { round: 2 },
            stateOverrides: { round: 2, phase: 'day' },
          },
          { type: 'execution', data: { playerId: 'p2' } },
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { phase: 'night' },
          },
        ],
        makeState({ round: 2, players: [player] }),
      )
      expect(definition.shouldWake!(game, player)).toBeFalsy()
    })

    it('does not wake if no execution happened', () => {
      const player = makePlayer({ id: 'p1', roleId: 'undertaker' })
      const game = makeGameWithHistory(
        [
          {
            type: 'day_started',
            data: { round: 2 },
            stateOverrides: { round: 2, phase: 'day' },
          },
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { phase: 'night' },
          },
        ],
        makeState({ round: 2, players: [player] }),
      )
      expect(definition.shouldWake!(game, player)).toBeFalsy()
    })

    it('wakes when alive, after first night, and execution occurred', () => {
      const player = makePlayer({ id: 'p1', roleId: 'undertaker' })
      const game = makeGameWithHistory(
        [
          {
            type: 'day_started',
            data: { round: 2 },
            stateOverrides: { round: 2, phase: 'day' },
          },
          { type: 'execution', data: { playerId: 'p2' } },
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { phase: 'night' },
          },
        ],
        makeState({ round: 2, players: [player] }),
      )
      expect(definition.shouldWake!(game, player)).toBeTruthy()
    })
  })

  // ================================================================
  // PERCEPTION (Undertaker sees the executed player's perceived role)
  // ================================================================

  describe('perception of executed player', () => {
    it('sees the actual role when no deception is active', () => {
      const undertaker = makePlayer({ id: 'p1', roleId: 'undertaker' })
      const executed = makePlayer({ id: 'p2', roleId: 'imp' })
      const state = makeState({ players: [undertaker, executed] })

      const perception = perceive(executed, undertaker, 'role', state)
      expect(perception.roleId).toBe('imp')
      expect(perception.team).toBe('demon')
    })

    it('sees deceived role when target has role perception modifier', () => {
      registerTestEffect({
        id: 'appears_as_villager' as EffectId,
        icon: 'user',
        perceptionModifiers: [
          {
            context: 'role',
            modify: (p) => ({ ...p, roleId: 'villager', team: 'townsfolk' }),
          },
        ],
      })

      const undertaker = makePlayer({ id: 'p1', roleId: 'undertaker' })
      const executed = addEffectTo(makePlayer({ id: 'p2', roleId: 'imp' }), 'appears_as_villager')
      const state = makeState({ players: [undertaker, executed] })

      const perception = perceive(executed, undertaker, 'role', state)
      expect(perception.roleId).toBe('villager') // deceived
      expect(perception.team).toBe('townsfolk') // deceived
    })
  })
})
