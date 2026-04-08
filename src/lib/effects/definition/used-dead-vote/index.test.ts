import { assert, beforeEach, describe, expect, it } from 'vitest'

import definition from '.'
import { makePlayer, makeState, resetPlayerCounter } from '../../../__tests__/helpers'

beforeEach(() => resetPlayerCounter())

describe('UsedDeadVote effect', () => {
  describe('canVote', () => {
    it('always returns false (no more votes allowed)', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      assert(definition.canVote)
      expect(definition.canVote(player, state)).toBeFalsy()
    })
  })

  describe('behavior flags', () => {
    it('prevents voting', () => {
      expect(definition.preventsVoting).toBeTruthy()
    })
  })
})
