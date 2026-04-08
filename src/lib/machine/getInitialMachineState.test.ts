import { beforeEach, describe, expect, it } from 'vitest'

import { addEffectTo, makeGame, makePlayer, makeState, resetPlayerCounter } from '../__tests__/helpers'
import { getInitialMachineState } from './getInitialMachineState'

describe('getInitialMachineState', () => {
  beforeEach(() => {
    resetPlayerCounter()
  })

  it('returns setup when game has pending setup actions', () => {
    const state = makeState({
      phase: 'setup',
      round: 0,
      players: [
        makePlayer({ roleId: 'drunk' }),
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'imp' }),
      ],
    })
    const game = makeGame(state)
    const result = getInitialMachineState(game)
    expect(result).toBe('setup')
  })

  it('returns revelation when game is in setup phase with no setup actions', () => {
    const state = makeState({
      phase: 'setup',
      round: 0,
      players: [
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'imp' }),
      ],
    })
    const game = makeGame(state)
    const result = getInitialMachineState(game)
    expect(result).toBe('revelation')
  })

  it('returns playing.night.dashboard when game is in night phase', () => {
    const state = makeState({
      phase: 'night',
      round: 1,
      players: [
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'imp' }),
      ],
    })
    const game = makeGame(state)
    const result = getInitialMachineState(game)
    expect(result).toBe('playing.night.dashboard')
  })

  it('returns playing.day.main when game is in day phase', () => {
    const state = makeState({
      phase: 'day',
      round: 1,
      players: [
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'imp' }),
      ],
    })
    const game = makeGame(state)
    const result = getInitialMachineState(game)
    expect(result).toBe('playing.day.main')
  })

  it('returns game_over when game phase is ended', () => {
    const state = makeState({
      phase: 'ended',
      players: [
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'villager' }),
        addEffectTo(makePlayer({ roleId: 'imp' }), 'dead'),
      ],
    })
    const game = makeGame(state)
    const result = getInitialMachineState(game)
    expect(result).toBe('game_over')
  })

  it('returns game_over when all demons are dead (regardless of phase field)', () => {
    const state = makeState({
      phase: 'day',
      players: [
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'villager' }),
        addEffectTo(makePlayer({ roleId: 'imp' }), 'dead'),
      ],
    })
    const game = makeGame(state)
    const result = getInitialMachineState(game)
    expect(result).toBe('game_over')
  })

  it('returns revelation when setup actions are all completed', () => {
    const state = makeState({
      phase: 'setup',
      round: 0,
      players: [
        makePlayer({ id: 'p1', roleId: 'drunk' }),
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'villager' }),
        makePlayer({ roleId: 'imp' }),
      ],
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
    const result = getInitialMachineState(game)
    expect(result).toBe('revelation')
  })
})
