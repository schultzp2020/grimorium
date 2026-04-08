import { beforeEach, describe, expect, it, vi } from 'vitest'

import { addEffectTo, makeGame, makePlayer, makeState, resetPlayerCounter } from '../__tests__/helpers'
import { getCurrentState } from '../types'
import {
  applyAddEffect,
  applyMarkRoleRevealed,
  applyNightActionDirect,
  applyRemoveEffect,
  applySkipNightAction,
  applyStartDay,
  applyStartNight,
  applyUpdateEffect,
  computeDeathRevealQueue,
} from './actions'
import { createInitialContext } from './types'

// Mock storage to avoid localStorage in tests
vi.mock('../storage', () => ({
  saveGame: vi.fn<() => void>(),
}))

describe('actions', () => {
  beforeEach(() => {
    resetPlayerCounter()
    vi.clearAllMocks()
  })

  describe('applyStartNight', () => {
    it('transitions game to night phase', () => {
      const state = makeState({
        phase: 'setup',
        round: 0,
        players: [makePlayer({ roleId: 'villager' }), makePlayer({ roleId: 'imp' })],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      const newGame = applyStartNight(ctx)
      const newState = getCurrentState(newGame)
      expect(newState.phase).toBe('night')
      expect(newState.round).toBe(1)
    })
  })

  describe('applyMarkRoleRevealed', () => {
    it('adds a role_revealed history entry', () => {
      const state = makeState({
        players: [makePlayer({ id: 'p1', roleId: 'villager' })],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      const newGame = applyMarkRoleRevealed(ctx, 'p1')
      const lastEntry = newGame.history.at(-1)
      expect(lastEntry?.type).toBe('role_revealed')
      expect(lastEntry?.data.playerId).toBe('p1')
    })
  })

  describe('applyNightActionDirect', () => {
    it('applies direct entries from NightActionResult', () => {
      const state = makeState({
        phase: 'night',
        round: 1,
        players: [makePlayer({ id: 'p1', roleId: 'monk' }), makePlayer({ id: 'p2', roleId: 'villager' })],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      const result = {
        entries: [
          {
            type: 'night_action' as const,
            message: [{ type: 'text' as const, content: 'Monk protects' }],
            data: { playerId: 'p1', action: 'protect', targetId: 'p2' },
          },
        ],
        addEffects: {
          p2: [{ type: 'safe', expiresAt: 'end_of_night' as const }],
        },
      }
      const newGame = applyNightActionDirect(ctx, result)
      const newState = getCurrentState(newGame)
      const p2 = newState.players.find((p) => p.id === 'p2')
      expect(p2?.effects.some((e) => e.type === 'safe')).toBeTruthy()
    })
  })

  describe('applySkipNightAction', () => {
    it('adds a night_skipped history entry', () => {
      const state = makeState({
        phase: 'night',
        round: 1,
        players: [makePlayer({ id: 'p1', roleId: 'villager' })],
      })
      const game = makeGame(state)
      const ctx = {
        ...createInitialContext(game),
        nightActionRoleId: 'villager',
        nightActionPlayerId: 'p1',
      }
      const newGame = applySkipNightAction(ctx)
      const hasSkipEntry = newGame.history.some((e) => e.type === 'night_skipped')
      expect(hasSkipEntry).toBeTruthy()
    })
  })

  describe('applyStartDay', () => {
    it('transitions game to day phase', () => {
      const state = makeState({
        phase: 'night',
        round: 1,
        players: [makePlayer({ roleId: 'villager' }), makePlayer({ roleId: 'imp' })],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      const newGame = applyStartDay(ctx)
      const newState = getCurrentState(newGame)
      expect(newState.phase).toBe('day')
    })
  })

  describe('applyAddEffect', () => {
    it('adds an effect to a player', () => {
      const state = makeState({
        players: [makePlayer({ id: 'p1', roleId: 'villager' })],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      const newGame = applyAddEffect(ctx, 'p1', 'safe')
      const newState = getCurrentState(newGame)
      const player = newState.players.find((p) => p.id === 'p1')
      expect(player?.effects.some((e) => e.type === 'safe')).toBeTruthy()
    })
  })

  describe('applyRemoveEffect', () => {
    it('removes an effect from a player', () => {
      const state = makeState({
        players: [addEffectTo(makePlayer({ id: 'p1', roleId: 'villager' }), 'safe')],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      const newGame = applyRemoveEffect(ctx, 'p1', 'safe')
      const newState = getCurrentState(newGame)
      const player = newState.players.find((p) => p.id === 'p1')
      expect(player?.effects.some((e) => e.type === 'safe')).toBeFalsy()
    })
  })

  describe('applyUpdateEffect', () => {
    it('updates effect data on a player', () => {
      const state = makeState({
        players: [addEffectTo(makePlayer({ id: 'p1', roleId: 'villager' }), 'red_herring', { targetId: 'old' })],
      })
      const game = makeGame(state)
      const ctx = createInitialContext(game)
      const newGame = applyUpdateEffect(ctx, 'p1', 'red_herring', { targetId: 'new' })
      const newState = getCurrentState(newGame)
      const player = newState.players.find((p) => p.id === 'p1')
      const effect = player?.effects.find((e) => e.type === 'red_herring')
      expect(effect?.data).toEqual({ targetId: 'new' })
    })
  })

  describe('computeDeathRevealQueue', () => {
    it('returns empty array when no deaths', () => {
      const preAlive = new Set(['p1', 'p2', 'p3'])
      const state = makeState({
        players: [
          makePlayer({ id: 'p1', roleId: 'villager' }),
          makePlayer({ id: 'p2', roleId: 'villager' }),
          makePlayer({ id: 'p3', roleId: 'imp' }),
        ],
      })
      const result = computeDeathRevealQueue(preAlive, state)
      expect(result).toEqual([])
    })

    it('returns entries for newly dead players', () => {
      const preAlive = new Set(['p1', 'p2', 'p3'])
      const state = makeState({
        players: [
          makePlayer({ id: 'p1', roleId: 'villager' }),
          addEffectTo(makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' }), 'dead'),
          makePlayer({ id: 'p3', roleId: 'imp' }),
        ],
      })
      const result = computeDeathRevealQueue(preAlive, state)
      expect(result).toHaveLength(1)
      expect(result[0].playerId).toBe('p2')
      expect(result[0].playerName).toBe('Bob')
      expect(result[0].roleId).toBe('villager')
    })

    it('does not include already-dead players', () => {
      const preAlive = new Set(['p1', 'p3'])
      const state = makeState({
        players: [
          makePlayer({ id: 'p1', roleId: 'villager' }),
          addEffectTo(makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' }), 'dead'),
          makePlayer({ id: 'p3', roleId: 'imp' }),
        ],
      })
      const result = computeDeathRevealQueue(preAlive, state)
      expect(result).toEqual([])
    })
  })
})
