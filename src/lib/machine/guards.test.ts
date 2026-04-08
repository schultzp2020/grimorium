import { beforeEach, describe, expect, it } from 'vitest'

import { addEffectTo, makeGame, makePlayer, makeState, resetPlayerCounter } from '../__tests__/helpers'
import { hasEndOfDayWinner, hasSetupActions, isGameOver } from './guards'
import { createInitialContext } from './types'

describe('guards', () => {
  beforeEach(() => {
    resetPlayerCounter()
  })

  describe('hasSetupActions', () => {
    it('returns false when no players have setup actions', () => {
      const state = makeState({
        players: [makePlayer({ roleId: 'villager' }), makePlayer({ roleId: 'imp' })],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      expect(hasSetupActions(ctx)).toBeFalsy()
    })

    it('returns true when a player has a setup action', () => {
      const state = makeState({
        players: [makePlayer({ roleId: 'drunk' }), makePlayer({ roleId: 'imp' })],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      expect(hasSetupActions(ctx)).toBeTruthy()
    })

    it('returns false when setup actions are already completed', () => {
      const state = makeState({
        players: [makePlayer({ id: 'p1', roleId: 'drunk' }), makePlayer({ roleId: 'imp' })],
      })
      const game = makeGame(state)
      game.history.push({
        id: 'setup1',
        timestamp: Date.now(),
        type: 'setup_action',
        message: [],
        data: { playerId: 'p1' },
        stateAfter: state,
      })
      const ctx = createInitialContext(game)
      expect(hasSetupActions(ctx)).toBeFalsy()
    })
  })

  describe('isGameOver', () => {
    it('returns false when the game has not ended', () => {
      const state = makeState({
        players: [
          makePlayer({ roleId: 'villager' }),
          makePlayer({ roleId: 'villager' }),
          makePlayer({ roleId: 'imp' }),
        ],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      expect(isGameOver(ctx)).toBeFalsy()
    })

    it('returns true when game phase is ended', () => {
      const state = makeState({
        phase: 'ended',
        players: [makePlayer({ roleId: 'villager' }), makePlayer({ roleId: 'imp' })],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      expect(isGameOver(ctx)).toBeTruthy()
    })

    it('returns true when all demons are dead', () => {
      const state = makeState({
        phase: 'day',
        players: [
          makePlayer({ roleId: 'villager' }),
          makePlayer({ roleId: 'villager' }),
          addEffectTo(makePlayer({ roleId: 'imp' }), 'dead'),
        ],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      expect(isGameOver(ctx)).toBeTruthy()
    })

    it('returns true when only 2 players remain alive and one is a demon', () => {
      const state = makeState({
        phase: 'day',
        players: [
          makePlayer({ roleId: 'villager' }),
          makePlayer({ roleId: 'imp' }),
          addEffectTo(makePlayer({ roleId: 'villager' }), 'dead'),
        ],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      expect(isGameOver(ctx)).toBeTruthy()
    })

    it('returns false during setup phase even with dead demons', () => {
      const state = makeState({
        phase: 'setup',
        round: 0,
        players: [makePlayer({ roleId: 'villager' }), addEffectTo(makePlayer({ roleId: 'imp' }), 'dead')],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      expect(isGameOver(ctx)).toBeFalsy()
    })
  })

  describe('hasEndOfDayWinner', () => {
    it('returns false when no end-of-day win condition is met', () => {
      const state = makeState({
        phase: 'day',
        players: [
          makePlayer({ roleId: 'villager' }),
          makePlayer({ roleId: 'villager' }),
          makePlayer({ roleId: 'imp' }),
        ],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      expect(hasEndOfDayWinner(ctx)).toBeFalsy()
    })
  })
})
