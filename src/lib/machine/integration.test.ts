import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createActor } from 'xstate'

import { addEffectTo, makeGame, makePlayer, makeState, resetPlayerCounter } from '../__tests__/helpers'
import { getCurrentState } from '../types'
import { gameMachine } from './gameMachine'

vi.mock('../storage', () => ({
  saveGame: vi.fn(),
}))

function createTestActor(game: ReturnType<typeof makeGame>) {
  const actor = createActor(gameMachine, { input: { game } })
  actor.start()
  return actor
}

describe('integration: full game flows', () => {
  beforeEach(() => {
    resetPlayerCounter()
    vi.clearAllMocks()
  })

  describe('setup -> revelation -> night -> day -> game_over', () => {
    it('completes a full game lifecycle through state transitions', () => {
      const state = makeState({
        phase: 'setup',
        players: [
          makePlayer({ id: 'p1', name: 'Alice', roleId: 'villager' }),
          makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' }),
          makePlayer({ id: 'p3', name: 'Charlie', roleId: 'imp' }),
        ],
      })
      const game = makeGame(state)
      const actor = createTestActor(game)

      // 1. Should start at revelation (no setup actions)
      expect(actor.getSnapshot().matches({ revelation: 'list' })).toBe(true)

      // 2. Reveal each player's role
      actor.send({ type: 'REVEAL_ROLE', playerId: 'p1' })
      expect(actor.getSnapshot().matches({ revelation: 'showing_role' })).toBe(true)

      actor.send({ type: 'ROLE_REVEAL_DISMISS' })
      expect(actor.getSnapshot().matches({ revelation: 'list' })).toBe(true)

      // 3. Start first night
      actor.send({ type: 'START_FIRST_NIGHT' })
      expect(actor.getSnapshot().matches({ playing: { night: 'dashboard' } })).toBe(true)

      // Verify the game transitioned to night
      const nightState = getCurrentState(actor.getSnapshot().context.game)
      expect(nightState.phase).toBe('night')
      expect(nightState.round).toBe(1)

      actor.stop()
    })
  })

  describe('state restoration', () => {
    it('restores to night dashboard for a game in night phase', () => {
      const state = makeState({
        phase: 'night',
        round: 2,
        players: [
          makePlayer({ roleId: 'villager' }),
          makePlayer({ roleId: 'villager' }),
          makePlayer({ roleId: 'imp' }),
        ],
      })
      const game = makeGame(state)
      const actor = createTestActor(game)

      expect(actor.getSnapshot().matches({ playing: { night: 'dashboard' } })).toBe(true)

      actor.stop()
    })

    it('restores to day main for a game in day phase', () => {
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [
          makePlayer({ roleId: 'villager' }),
          makePlayer({ roleId: 'villager' }),
          makePlayer({ roleId: 'imp' }),
        ],
      })
      const game = makeGame(state)
      const actor = createTestActor(game)

      expect(actor.getSnapshot().matches({ playing: { day: 'main' } })).toBe(true)

      actor.stop()
    })

    it('restores to game_over for a finished game', () => {
      const state = makeState({
        phase: 'ended',
        players: [makePlayer({ roleId: 'villager' }), addEffectTo(makePlayer({ roleId: 'imp' }), 'dead')],
      })
      const game = makeGame(state)
      const actor = createTestActor(game)

      expect(actor.getSnapshot().matches('game_over')).toBe(true)

      actor.stop()
    })
  })

  describe('day nomination -> voting -> back to day', () => {
    it('flows through nomination and voting', () => {
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [
          makePlayer({ id: 'p1', name: 'Alice', roleId: 'villager' }),
          makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' }),
          makePlayer({ id: 'p3', name: 'Charlie', roleId: 'imp' }),
        ],
      })
      const game = makeGame(state)
      const actor = createTestActor(game)

      // Open nomination
      actor.send({ type: 'OPEN_NOMINATION' })
      expect(actor.getSnapshot().matches({ playing: { day: 'nomination' } })).toBe(true)

      // Nominate — should go to voting (no Virgin effect)
      actor.send({
        type: 'NOMINATE',
        nominatorId: 'p1',
        nomineeId: 'p3',
      })
      expect(actor.getSnapshot().matches({ playing: { day: 'voting' } })).toBe(true)
      expect(actor.getSnapshot().context.votingNomineeId).toBe('p3')

      // Complete vote — back to day main
      actor.send({ type: 'VOTE_COMPLETE', voteCount: 2 })
      expect(actor.getSnapshot().matches({ playing: { day: 'main' } })).toBe(true)

      actor.stop()
    })
  })

  describe('grimoire overlay during any phase', () => {
    it('opens and closes grimoire without changing game state', () => {
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [
          makePlayer({ roleId: 'villager' }),
          makePlayer({ roleId: 'villager' }),
          makePlayer({ roleId: 'imp' }),
        ],
      })
      const game = makeGame(state)
      const actor = createTestActor(game)

      // Open grimoire
      actor.send({ type: 'OPEN_GRIMOIRE', intent: { view: 'list' } })
      expect(actor.getSnapshot().context.grimoireOpen).toBe(true)
      // Machine state should NOT change
      expect(actor.getSnapshot().matches({ playing: { day: 'main' } })).toBe(true)

      // Close grimoire
      actor.send({ type: 'CLOSE_GRIMOIRE' })
      expect(actor.getSnapshot().context.grimoireOpen).toBe(false)

      actor.stop()
    })
  })

  describe('night action with no intent returns to dashboard', () => {
    it('returns to dashboard after completing night action', () => {
      const state = makeState({
        phase: 'setup',
        players: [
          makePlayer({ id: 'p1', roleId: 'monk' }),
          makePlayer({ id: 'p2', roleId: 'villager' }),
          makePlayer({ id: 'p3', roleId: 'villager' }),
          makePlayer({ id: 'p4', roleId: 'villager' }),
          makePlayer({ id: 'p5', roleId: 'imp' }),
        ],
      })
      const game = makeGame(state)
      const actor = createTestActor(game)

      // Navigate to night
      actor.send({ type: 'START_FIRST_NIGHT' })
      expect(actor.getSnapshot().matches({ playing: { night: 'dashboard' } })).toBe(true)

      // Open a night action
      actor.send({ type: 'OPEN_NIGHT_ACTION', playerId: 'p1', roleId: 'monk' })
      expect(actor.getSnapshot().matches({ playing: { night: 'action' } })).toBe(true)

      // Complete with no intent
      actor.send({
        type: 'NIGHT_ACTION_COMPLETE',
        result: {
          entries: [
            {
              type: 'night_action' as const,
              message: [{ type: 'text' as const, content: 'Monk protected' }],
              data: { playerId: 'p1' },
            },
          ],
        },
      })
      expect(actor.getSnapshot().matches({ playing: { night: 'dashboard' } })).toBe(true)

      actor.stop()
    })
  })

  describe('end of day flow', () => {
    it('transitions to night dashboard when no execution', () => {
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [
          makePlayer({ id: 'p1', roleId: 'villager' }),
          makePlayer({ id: 'p2', roleId: 'villager' }),
          makePlayer({ id: 'p3', roleId: 'villager' }),
          makePlayer({ id: 'p4', roleId: 'imp' }),
        ],
      })
      const game = makeGame(state)
      const actor = createTestActor(game)

      // End day with no one on the block
      actor.send({ type: 'END_DAY' })

      // Should be in night dashboard (no deaths to reveal)
      expect(actor.getSnapshot().matches({ playing: { night: 'dashboard' } })).toBe(true)

      actor.stop()
    })
  })

  describe('cancel vote returns to day main', () => {
    it('cancels vote and returns to day', () => {
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [
          makePlayer({ id: 'p1', roleId: 'villager' }),
          makePlayer({ id: 'p2', roleId: 'villager' }),
          makePlayer({ id: 'p3', roleId: 'imp' }),
        ],
      })
      const game = makeGame(state)
      const actor = createTestActor(game)

      actor.send({ type: 'OPEN_NOMINATION' })
      actor.send({ type: 'NOMINATE', nominatorId: 'p1', nomineeId: 'p3' })
      expect(actor.getSnapshot().matches({ playing: { day: 'voting' } })).toBe(true)

      actor.send({ type: 'CANCEL_VOTE' })
      expect(actor.getSnapshot().matches({ playing: { day: 'main' } })).toBe(true)

      actor.stop()
    })
  })
})
