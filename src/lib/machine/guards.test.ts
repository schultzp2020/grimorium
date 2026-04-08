import { beforeEach, describe, expect, it } from 'vitest'

import { addEffectTo, makeGame, makePlayer, makeState, resetPlayerCounter } from '../__tests__/helpers'
import {
  hasDeathsAfterDayAction,
  hasDeathsAfterNomination,
  hasEndOfDayWinner,
  hasPendingDeathReveals,
  hasPipelineNeedsInput,
  hasSetupActions,
  isGameOver,
  isGameOverAfterExecution,
} from './guards'
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
      expect(hasSetupActions(ctx)).toBe(false)
    })

    it('returns true when a player has a setup action', () => {
      const state = makeState({
        players: [makePlayer({ roleId: 'drunk' }), makePlayer({ roleId: 'imp' })],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      expect(hasSetupActions(ctx)).toBe(true)
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
      expect(hasSetupActions(ctx)).toBe(false)
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
      expect(isGameOver(ctx)).toBe(false)
    })

    it('returns true when game phase is ended', () => {
      const state = makeState({
        phase: 'ended',
        players: [makePlayer({ roleId: 'villager' }), makePlayer({ roleId: 'imp' })],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      expect(isGameOver(ctx)).toBe(true)
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
      expect(isGameOver(ctx)).toBe(true)
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
      expect(isGameOver(ctx)).toBe(true)
    })

    it('returns false during setup phase even with dead demons', () => {
      const state = makeState({
        phase: 'setup',
        round: 0,
        players: [makePlayer({ roleId: 'villager' }), addEffectTo(makePlayer({ roleId: 'imp' }), 'dead')],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      expect(isGameOver(ctx)).toBe(false)
    })
  })

  describe('isGameOverAfterExecution', () => {
    it('delegates to isGameOver', () => {
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
      expect(isGameOverAfterExecution(ctx)).toBe(true)
    })
  })

  describe('hasPendingDeathReveals', () => {
    it('returns false when death reveal queue is empty', () => {
      const ctx = createInitialContext(makeGame())
      expect(hasPendingDeathReveals(ctx)).toBe(false)
    })

    it('returns true when death reveal queue has entries', () => {
      const ctx = createInitialContext(makeGame())
      ctx.deathRevealQueue = [{ playerId: 'p1', playerName: 'Alice', roleId: 'villager' }]
      expect(hasPendingDeathReveals(ctx)).toBe(true)
    })
  })

  describe('hasPipelineNeedsInput', () => {
    it('returns false when pipelineUI is null', () => {
      const ctx = createInitialContext(makeGame())
      expect(hasPipelineNeedsInput(ctx)).toBe(false)
    })

    it('returns true when pipelineUI is set', () => {
      const ctx = createInitialContext(makeGame())
      ctx.pipelineUI = {
        Component: () => null,
        intent: { type: 'kill', sourceId: 'a', targetId: 'b', cause: 'test' },
        onResult: () => {},
      }
      expect(hasPipelineNeedsInput(ctx)).toBe(true)
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
      expect(hasEndOfDayWinner(ctx)).toBe(false)
    })
  })

  describe('hasDeathsAfterNomination', () => {
    it('returns false when no players died', () => {
      const state = makeState({
        players: [makePlayer({ id: 'p1', roleId: 'villager' }), makePlayer({ id: 'p2', roleId: 'imp' })],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      const preAlive = new Set(['p1', 'p2'])
      expect(hasDeathsAfterNomination(ctx, preAlive)).toBe(false)
    })

    it('returns true when a player died after nomination', () => {
      const state = makeState({
        players: [
          makePlayer({ id: 'p1', roleId: 'villager' }),
          addEffectTo(makePlayer({ id: 'p2', roleId: 'imp' }), 'dead'),
        ],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      const preAlive = new Set(['p1', 'p2'])
      expect(hasDeathsAfterNomination(ctx, preAlive)).toBe(true)
    })
  })

  describe('hasDeathsAfterDayAction', () => {
    it('delegates to the same logic as hasDeathsAfterNomination', () => {
      const state = makeState({
        players: [
          makePlayer({ id: 'p1', roleId: 'villager' }),
          addEffectTo(makePlayer({ id: 'p2', roleId: 'imp' }), 'dead'),
        ],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      const preAlive = new Set(['p1', 'p2'])
      expect(hasDeathsAfterDayAction(ctx, preAlive)).toBe(true)
    })
  })
})
