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

describe('Librarian', () => {
  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('wakes only on the first night', () => {
      const player = makePlayer({ id: 'p1', roleId: 'librarian' })
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
      const player = addEffectTo(makePlayer({ id: 'p1', roleId: 'librarian' }), 'dead')
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
  // PERCEPTION (Librarian uses "team" to find outsiders)
  // ================================================================

  describe('perception integration', () => {
    it('identifies outsider correctly via team perception', () => {
      const librarian = makePlayer({ id: 'p1', roleId: 'librarian' })
      const saint = makePlayer({ id: 'p2', roleId: 'saint' })
      const state = makeState({ players: [librarian, saint] })

      const perception = perceive(saint, librarian, 'team', state)
      expect(perception.team).toBe('outsider')
    })

    it('does not identify townsfolk as outsider', () => {
      const librarian = makePlayer({ id: 'p1', roleId: 'librarian' })
      const villager = makePlayer({ id: 'p2', roleId: 'villager' })
      const state = makeState({ players: [librarian, villager] })

      const perception = perceive(villager, librarian, 'team', state)
      expect(perception.team).toBe('townsfolk')
    })

    it('evil player appearing as outsider creates false positive', () => {
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

      const librarian = makePlayer({ id: 'p1', roleId: 'librarian' })
      const imp = addEffectTo(makePlayer({ id: 'p2', roleId: 'imp' }), 'appears_outsider')
      const state = makeState({ players: [librarian, imp] })

      const perception = perceive(imp, librarian, 'team', state)
      expect(perception.team).toBe('outsider') // false positive
    })

    it('outsider appearing as townsfolk creates false negative', () => {
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

      const librarian = makePlayer({ id: 'p1', roleId: 'librarian' })
      const saint = addEffectTo(makePlayer({ id: 'p2', roleId: 'saint' }), 'appears_townsfolk')
      const state = makeState({ players: [librarian, saint] })

      const perception = perceive(saint, librarian, 'team', state)
      expect(perception.team).toBe('townsfolk') // real outsider hidden
    })
  })
})
