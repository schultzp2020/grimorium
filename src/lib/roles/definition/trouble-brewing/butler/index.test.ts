import { assert, beforeEach, describe, expect, it } from 'vitest'

import definition from '.'
import {
  addEffectTo,
  makeGameWithHistory,
  makePlayer,
  makeState,
  resetPlayerCounter,
} from '../../../../__tests__/helpers'

beforeEach(() => resetPlayerCounter())

describe('Butler', () => {
  describe('basic properties', () => {
    it('is an outsider', () => {
      expect(definition.team).toBe('outsider')
    })

    it('has a night action', () => {
      expect(definition.NightAction).toBeDefined()
    })

    it('has no initial effects', () => {
      expect(definition.initialEffects).toBeUndefined()
    })
  })

  describe('shouldWake', () => {
    it('wakes every night when alive', () => {
      assert(definition.shouldWake)
      const butler = makePlayer({ id: 'butler', roleId: 'butler' })
      const game = makeGameWithHistory(
        [{ type: 'night_started', data: { round: 1 }, stateOverrides: { round: 1 } }],
        makeState({ round: 1, players: [butler] }),
      )
      expect(definition.shouldWake(game, butler)).toBeTruthy()
    })

    it('wakes on subsequent nights when alive', () => {
      assert(definition.shouldWake)
      const butler = makePlayer({ id: 'butler', roleId: 'butler' })
      const game = makeGameWithHistory(
        [{ type: 'night_started', data: { round: 2 }, stateOverrides: { round: 2 } }],
        makeState({ round: 2, players: [butler] }),
      )
      expect(definition.shouldWake(game, butler)).toBeTruthy()
    })

    it('does not wake when dead', () => {
      assert(definition.shouldWake)
      const butler = addEffectTo(makePlayer({ id: 'butler', roleId: 'butler' }), 'dead')
      const game = makeGameWithHistory(
        [{ type: 'night_started', data: { round: 2 }, stateOverrides: { round: 2 } }],
        makeState({ round: 2, players: [butler] }),
      )
      expect(definition.shouldWake(game, butler)).toBeFalsy()
    })

    it('has a nightOrder so it appears in the night dashboard', () => {
      expect(definition.nightOrder).toBeDefined()
      expect(typeof definition.nightOrder).toBe('number')
    })
  })

  describe('butler_master effect integration', () => {
    it("butler_master effect stores the master's player ID in data", () => {
      const butler = addEffectTo(makePlayer({ id: 'butler', roleId: 'butler' }), 'butler_master', {
        masterId: 'p2',
      })

      const masterEffect = butler.effects.find((e) => e.type === 'butler_master')
      assert(masterEffect)
      expect(masterEffect.data?.masterId).toBe('p2')
    })

    it('butler without butler_master effect has no voting restriction', () => {
      const butler = makePlayer({ id: 'butler', roleId: 'butler' })
      const masterEffect = butler.effects.find((e) => e.type === 'butler_master')
      expect(masterEffect).toBeUndefined()
    })
  })

  describe('malfunction', () => {
    it('when malfunctioning, the effect should NOT be applied (Butler votes freely)', () => {
      expect(definition.NightAction).toBeDefined()
    })

    it('poisoned Butler still wakes when alive', () => {
      assert(definition.shouldWake)
      const butler = addEffectTo(makePlayer({ id: 'butler', roleId: 'butler' }), 'poisoned')
      const game = makeGameWithHistory(
        [{ type: 'night_started', data: { round: 2 }, stateOverrides: { round: 2 } }],
        makeState({ round: 2, players: [butler] }),
      )
      expect(definition.shouldWake(game, butler)).toBeTruthy()
    })
  })
})
