import { beforeEach, describe, expect, it } from 'vitest'

import definition from '.'
import {
  addEffectTo,
  makeGameWithHistory,
  makePlayer,
  makeState,
  resetPlayerCounter,
} from '../../../../__tests__/helpers'
import { canRegisterAsAlignment, canRegisterAsTeam, getAmbiguousPlayers } from '../../../../pipeline/perception'

beforeEach(() => {
  resetPlayerCounter()
})

describe('Spy', () => {
  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('wakes on the first night', () => {
      const player = makePlayer({ id: 'p1', roleId: 'spy' })
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

      expect(definition.shouldWake!(game, player)).toBeTruthy()
    })

    it('wakes on subsequent nights', () => {
      const player = makePlayer({ id: 'p1', roleId: 'spy' })
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 3 },
            stateOverrides: { round: 3 },
          },
        ],
        makeState({ round: 3, players: [player] }),
      )

      expect(definition.shouldWake!(game, player)).toBeTruthy()
    })

    it('does not wake when dead', () => {
      const player = addEffectTo(makePlayer({ id: 'p1', roleId: 'spy' }), 'dead')
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
  // PERCEPTION — Spy's misregistration via misregister effect
  // ================================================================

  describe('perception integration (misregister)', () => {
    const spyData = {
      canRegisterAs: {
        teams: ['townsfolk', 'outsider'],
        alignments: ['good'],
      },
    }

    it('is detected by getAmbiguousPlayers for alignment context', () => {
      const spy = addEffectTo(makePlayer({ id: 's1', roleId: 'spy' }), 'misregister', spyData)
      const villager = makePlayer({ id: 'v1', roleId: 'villager' })

      const ambiguous = getAmbiguousPlayers([spy, villager], 'alignment')
      expect(ambiguous).toHaveLength(1)
      expect(ambiguous[0].id).toBe('s1')
    })

    it('is detected by getAmbiguousPlayers for team context', () => {
      const spy = addEffectTo(makePlayer({ id: 's1', roleId: 'spy' }), 'misregister', spyData)
      const villager = makePlayer({ id: 'v1', roleId: 'villager' })

      const ambiguous = getAmbiguousPlayers([spy, villager], 'team')
      expect(ambiguous).toHaveLength(1)
      expect(ambiguous[0].id).toBe('s1')
    })

    it('is detected by getAmbiguousPlayers for role context', () => {
      const spy = addEffectTo(makePlayer({ id: 's1', roleId: 'spy' }), 'misregister', spyData)

      const ambiguous = getAmbiguousPlayers([spy], 'role')
      expect(ambiguous).toHaveLength(1)
    })

    it('canRegisterAsTeam returns true for townsfolk and outsider', () => {
      const spy = addEffectTo(makePlayer({ id: 's1', roleId: 'spy' }), 'misregister', spyData)

      expect(canRegisterAsTeam(spy, 'townsfolk')).toBeTruthy()
      expect(canRegisterAsTeam(spy, 'outsider')).toBeTruthy()
      expect(canRegisterAsTeam(spy, 'minion')).toBeFalsy()
      expect(canRegisterAsTeam(spy, 'demon')).toBeFalsy()
    })

    it('canRegisterAsAlignment returns true for good', () => {
      const spy = addEffectTo(makePlayer({ id: 's1', roleId: 'spy' }), 'misregister', spyData)

      expect(canRegisterAsAlignment(spy, 'good')).toBeTruthy()
      expect(canRegisterAsAlignment(spy, 'evil')).toBeFalsy()
    })
  })

  // ================================================================
  // INITIAL EFFECTS
  // ================================================================

  describe('initialEffects', () => {
    it('has misregister as initial effect with canRegisterAs data', () => {
      expect(definition.initialEffects).toBeDefined()
      expect(definition.initialEffects![0].type).toBe('misregister')
      expect(definition.initialEffects![0].data).toEqual({
        canRegisterAs: {
          teams: ['townsfolk', 'outsider'],
          alignments: ['good'],
        },
      })
    })
  })
})
