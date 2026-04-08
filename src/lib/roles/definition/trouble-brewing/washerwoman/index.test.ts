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

describe('Washerwoman', () => {
  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('wakes only on the first night', () => {
      const player = makePlayer({ id: 'p1', roleId: 'washerwoman' })
      const round1 = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 1 },
            stateOverrides: { round: 1 },
          },
        ],
        makeState({ round: 1, players: [player] }),
      )
      const round2 = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { round: 2 },
          },
        ],
        makeState({ round: 2, players: [player] }),
      )

      expect(definition.shouldWake!(round1, player)).toBeTruthy()
      expect(definition.shouldWake!(round2, player)).toBeFalsy()
    })

    it('does not wake when dead', () => {
      const player = addEffectTo(makePlayer({ id: 'p1', roleId: 'washerwoman' }), 'dead')
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
  })

  // ================================================================
  // PERCEPTION (Washerwoman uses "team" to find townsfolk, "role" to show)
  // ================================================================

  describe('perception integration', () => {
    it('identifies townsfolk correctly via team perception', () => {
      const washerwoman = makePlayer({ id: 'p1', roleId: 'washerwoman' })
      const villager = makePlayer({ id: 'p2', roleId: 'villager' })
      const state = makeState({ players: [washerwoman, villager] })

      const perception = perceive(villager, washerwoman, 'team', state)
      expect(perception.team).toBe('townsfolk')
    })

    it('does not identify outsider as townsfolk', () => {
      const washerwoman = makePlayer({ id: 'p1', roleId: 'washerwoman' })
      const saint = makePlayer({ id: 'p2', roleId: 'saint' })
      const state = makeState({ players: [washerwoman, saint] })

      const perception = perceive(saint, washerwoman, 'team', state)
      expect(perception.team).toBe('outsider')
    })

    it('deceiving player appearing as townsfolk creates false positive', () => {
      registerTestEffect({
        id: 'appears_townsfolk' as EffectId,
        icon: 'user',
        perceptionModifiers: [
          {
            context: 'team',
            modify: (p) => ({ ...p, team: 'townsfolk' }),
          },
        ],
      })

      const washerwoman = makePlayer({ id: 'p1', roleId: 'washerwoman' })
      const imp = addEffectTo(makePlayer({ id: 'p2', roleId: 'imp' }), 'appears_townsfolk')
      const state = makeState({ players: [washerwoman, imp] })

      const perception = perceive(imp, washerwoman, 'team', state)
      expect(perception.team).toBe('townsfolk') // false positive
    })

    it('townsfolk appearing as another team creates false negative', () => {
      registerTestEffect({
        id: 'appears_outsider' as EffectId,
        icon: 'user',
        perceptionModifiers: [
          {
            context: 'team',
            modify: (p) => ({ ...p, team: 'outsider' }),
          },
        ],
      })

      const washerwoman = makePlayer({ id: 'p1', roleId: 'washerwoman' })
      const villager = addEffectTo(makePlayer({ id: 'p2', roleId: 'villager' }), 'appears_outsider')
      const state = makeState({ players: [washerwoman, villager] })

      const perception = perceive(villager, washerwoman, 'team', state)
      expect(perception.team).toBe('outsider') // false negative
    })

    it('role shown is affected by role perception modifiers', () => {
      registerTestEffect({
        id: 'appears_as_monk' as EffectId,
        icon: 'user',
        perceptionModifiers: [
          {
            context: 'role',
            modify: (p) => ({ ...p, roleId: 'monk' }),
          },
        ],
      })

      const washerwoman = makePlayer({ id: 'p1', roleId: 'washerwoman' })
      const chef = addEffectTo(makePlayer({ id: 'p2', roleId: 'chef' }), 'appears_as_monk')
      const state = makeState({ players: [washerwoman, chef] })

      const rolePerception = perceive(chef, washerwoman, 'role', state)
      expect(rolePerception.roleId).toBe('monk') // shown wrong role
    })
  })
})
