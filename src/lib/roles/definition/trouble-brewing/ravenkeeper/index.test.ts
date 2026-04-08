import { afterEach, assert, beforeEach, describe, expect, it } from 'vitest'

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
const originalEffects = new Map<EffectId, EffectDefinition | undefined>()

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

describe('Ravenkeeper', () => {
  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('does not wake on the first night', () => {
      const player = makePlayer({ id: 'p1', roleId: 'ravenkeeper' })
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
      assert(definition.shouldWake)
      expect(definition.shouldWake(game, player)).toBeFalsy()
    })

    it('does not wake if not killed this night', () => {
      const player = makePlayer({ id: 'p1', roleId: 'ravenkeeper' })
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { round: 2 },
          },
        ],
        makeState({ round: 2, players: [player] }),
      )
      assert(definition.shouldWake)
      expect(definition.shouldWake(game, player)).toBeFalsy()
    })

    it('wakes when killed this night (after round 1)', () => {
      const player = makePlayer({ id: 'p1', roleId: 'ravenkeeper' })
      const deadPlayer = addEffectTo(player, 'dead')
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { round: 2 },
          },
          {
            type: 'night_action',
            data: {
              action: 'kill',
              targetId: 'p1',
              roleId: 'imp',
              playerId: 'p2',
            },
            stateOverrides: { players: [deadPlayer] },
          },
        ],
        makeState({ round: 2, players: [player] }),
      )
      assert(definition.shouldWake)
      expect(definition.shouldWake(game, player)).toBeTruthy()
    })

    it('does not wake if a different player was killed', () => {
      const player = makePlayer({ id: 'p1', roleId: 'ravenkeeper' })
      const other = makePlayer({ id: 'p3', roleId: 'villager' })
      const deadOther = addEffectTo(other, 'dead')
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { round: 2 },
          },
          {
            type: 'night_action',
            data: {
              action: 'kill',
              targetId: 'p3',
              roleId: 'imp',
              playerId: 'p2',
            },
            stateOverrides: { players: [player, deadOther] },
          },
        ],
        makeState({ round: 2, players: [player, other] }),
      )
      assert(definition.shouldWake)
      expect(definition.shouldWake(game, player)).toBeFalsy()
    })

    it('does not wake when kill was prevented (e.g., Monk protection)', () => {
      const player = makePlayer({ id: 'p1', roleId: 'ravenkeeper' })
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { round: 2 },
          },
          {
            // Imp attempted to kill, but the kill was prevented — player stays alive
            type: 'night_action',
            data: {
              action: 'kill',
              targetId: 'p1',
              roleId: 'imp',
              playerId: 'p2',
            },
            // No state change: player does NOT gain dead effect
          },
        ],
        makeState({ round: 2, players: [player] }),
      )
      assert(definition.shouldWake)
      expect(definition.shouldWake(game, player)).toBeFalsy()
    })

    it('does not wake if already dead at the start of the night', () => {
      const player = makePlayer({ id: 'p1', roleId: 'ravenkeeper' })
      const deadPlayer = addEffectTo(player, 'dead')
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 3 },
            stateOverrides: { round: 3 },
          },
        ],
        makeState({ round: 3, players: [deadPlayer] }),
      )
      assert(definition.shouldWake)
      expect(definition.shouldWake(game, deadPlayer)).toBeFalsy()
    })
  })

  // ================================================================
  // PERCEPTION (Ravenkeeper sees selected player's perceived role)
  // ================================================================

  describe('perception of selected player', () => {
    it('sees actual role when no deception is active', () => {
      const rk = makePlayer({ id: 'p1', roleId: 'ravenkeeper' })
      const target = makePlayer({ id: 'p2', roleId: 'imp' })
      const state = makeState({ players: [rk, target] })

      const perception = perceive(target, rk, 'role', state)
      expect(perception.roleId).toBe('imp')
      expect(perception.team).toBe('demon')
    })

    it('sees deceived role when target has role perception modifier', () => {
      registerTestEffect({
        id: 'appears_as_chef' as EffectId,
        icon: 'user',
        perceptionModifiers: [
          {
            context: 'role',
            modify: (p) => ({ ...p, roleId: 'chef', team: 'townsfolk' }),
          },
        ],
      })

      const rk = makePlayer({ id: 'p1', roleId: 'ravenkeeper' })
      const target = addEffectTo(makePlayer({ id: 'p2', roleId: 'imp' }), 'appears_as_chef')
      const state = makeState({ players: [rk, target] })

      const perception = perceive(target, rk, 'role', state)
      expect(perception.roleId).toBe('chef') // deceived
      expect(perception.team).toBe('townsfolk') // deceived
    })

    it('good player with demon-like role modifier appears as demon', () => {
      registerTestEffect({
        id: 'appears_as_imp' as EffectId,
        icon: 'user',
        perceptionModifiers: [
          {
            context: 'role',
            modify: (p) => ({ ...p, roleId: 'imp', team: 'demon' }),
          },
        ],
      })

      const rk = makePlayer({ id: 'p1', roleId: 'ravenkeeper' })
      const recluse = addEffectTo(makePlayer({ id: 'p2', roleId: 'villager' }), 'appears_as_imp')
      const state = makeState({ players: [rk, recluse] })

      const perception = perceive(recluse, rk, 'role', state)
      expect(perception.roleId).toBe('imp')
      expect(perception.team).toBe('demon')
    })
  })
})
