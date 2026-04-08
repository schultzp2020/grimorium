import { assert, beforeEach, describe, expect, it } from 'vitest'

import definition from '.'
import { addEffectTo, makeGame, makePlayer, makeState, resetPlayerCounter } from '../../../__tests__/helpers'

beforeEach(() => resetPlayerCounter())

describe('PendingRoleReveal effect', () => {
  it('has a nightFollowUps definition', () => {
    assert(definition.nightFollowUps)
    expect(definition.nightFollowUps).toHaveLength(1)
  })

  describe('nightFollowUp condition', () => {
    it('returns true when the effect is present (always pending)', () => {
      assert(definition.nightFollowUps)
      const [followUp] = definition.nightFollowUps
      const player = addEffectTo(makePlayer({ roleId: 'imp' }), 'pending_role_reveal')
      const state = makeState({ players: [player] })
      const game = makeGame(state)

      expect(followUp.condition(player, state, game)).toBeTruthy()
    })
  })

  describe('nightFollowUp metadata', () => {
    it('has the correct id', () => {
      assert(definition.nightFollowUps)
      expect(definition.nightFollowUps[0].id).toBe('role_change_reveal')
    })

    it('has a sparkles icon', () => {
      assert(definition.nightFollowUps)
      expect(definition.nightFollowUps[0].icon).toBe('sparkles')
    })

    it('has an ActionComponent', () => {
      assert(definition.nightFollowUps)
      expect(definition.nightFollowUps[0].ActionComponent).toBeDefined()
      expect(typeof definition.nightFollowUps[0].ActionComponent).toBe('function')
    })
  })
})
