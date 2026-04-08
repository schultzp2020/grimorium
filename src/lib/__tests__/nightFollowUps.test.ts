import { afterEach, assert, beforeEach, describe, expect, it } from 'vitest'

import { getEffect, registerEffect, unregisterEffect } from '../effects/registry'
import type { EffectDefinition, EffectId } from '../effects/types'
import { getNightRolesStatus } from '../game'
import type { Translations } from '../i18n/types'
import { getAvailableNightFollowUps } from '../pipeline'
import { addEffectTo, makeGame, makeGameWithHistory, makePlayer, makeState, resetPlayerCounter } from './helpers'

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

const mockT = {
  game: {
    yourRoleHasChanged: 'Your role has changed!',
  },
} as unknown as Translations

// ============================================================================
// getAvailableNightFollowUps
// ============================================================================

describe('getAvailableNightFollowUps', () => {
  it('returns empty array when no players have nightFollowUp effects', () => {
    const players = [makePlayer({ id: 'p1', roleId: 'villager' }), makePlayer({ id: 'p2', roleId: 'imp' })]
    const state = makeState({ players })
    const game = makeGame(state)

    const result = getAvailableNightFollowUps(state, game, mockT)
    expect(result).toEqual([])
  })

  it('returns follow-ups for players with pending_role_reveal effect', () => {
    const player = addEffectTo(makePlayer({ id: 'sw', name: 'Scarlet', roleId: 'imp' }), 'pending_role_reveal')
    const state = makeState({ players: [player] })
    const game = makeGame(state)

    const result = getAvailableNightFollowUps(state, game, mockT)

    expect(result).toHaveLength(1)
    expect(result[0].playerId).toBe('sw')
    expect(result[0].playerName).toBe('Scarlet')
    expect(result[0].icon).toBe('sparkles')
    expect(result[0].label).toBe('Your role has changed!')
    expect(result[0].ActionComponent).toBeDefined()
  })

  it('does not return follow-ups when the effect is not present', () => {
    const player = makePlayer({
      id: 'sw',
      name: 'Scarlet',
      roleId: 'imp',
    })
    const state = makeState({ players: [player] })
    const game = makeGame(state)

    const result = getAvailableNightFollowUps(state, game, mockT)
    expect(result).toEqual([])
  })

  it('returns multiple follow-ups if multiple players have the effect', () => {
    const p1 = addEffectTo(makePlayer({ id: 'p1', name: 'Alice', roleId: 'imp' }), 'pending_role_reveal')
    const p2 = addEffectTo(makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' }), 'pending_role_reveal')
    const state = makeState({ players: [p1, p2] })
    const game = makeGame(state)

    const result = getAvailableNightFollowUps(state, game, mockT)

    expect(result).toHaveLength(2)
    expect(result[0].playerId).toBe('p1')
    expect(result[1].playerId).toBe('p2')
  })

  it('works with custom test effects that have nightFollowUps', () => {
    const MockComponent = () => null

    registerTestEffect({
      id: 'test_follow_up' as EffectId,
      icon: 'user',
      nightFollowUps: [
        {
          id: 'test_action',
          icon: 'star',
          getLabel: () => 'Test Follow-Up',
          condition: () => true,
          ActionComponent: MockComponent,
        },
      ],
    })

    const player = addEffectTo(makePlayer({ id: 'p1', name: 'Alice', roleId: 'villager' }), 'test_follow_up')
    const state = makeState({ players: [player] })
    const game = makeGame(state)

    const result = getAvailableNightFollowUps(state, game, mockT)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('test_action_p1')
    expect(result[0].label).toBe('Test Follow-Up')
    expect(result[0].ActionComponent).toBe(MockComponent)
  })

  it('respects the condition function — only returns when condition is true', () => {
    registerTestEffect({
      id: 'conditional_follow_up' as EffectId,
      icon: 'user',
      nightFollowUps: [
        {
          id: 'conditional_action',
          icon: 'star',
          getLabel: () => 'Conditional',
          // Only applies if the player is alive (no dead effect)
          condition: (player) => !player.effects.some((e) => e.type === 'dead'),
          ActionComponent: () => null,
        },
      ],
    })

    // Player alive → follow-up returned
    const alivePlayer = addEffectTo(makePlayer({ id: 'p1', roleId: 'villager' }), 'conditional_follow_up')
    const aliveState = makeState({ players: [alivePlayer] })
    const aliveGame = makeGame(aliveState)

    expect(getAvailableNightFollowUps(aliveState, aliveGame, mockT)).toHaveLength(1)

    // Player dead → follow-up NOT returned
    const deadPlayer = addEffectTo(
      addEffectTo(makePlayer({ id: 'p2', roleId: 'villager' }), 'conditional_follow_up'),
      'dead',
    )
    const deadState = makeState({ players: [deadPlayer] })
    const deadGame = makeGame(deadState)

    expect(getAvailableNightFollowUps(deadState, deadGame, mockT)).toHaveLength(0)
  })
})

// ============================================================================
// Integration: getNightRolesStatus no longer includes role change reveals
// ============================================================================

describe('getNightRolesStatus', () => {
  it('does not include role change reveals (those are handled by nightFollowUps)', () => {
    const players = [makePlayer({ id: 'p1', roleId: 'washerwoman' }), makePlayer({ id: 'p2', roleId: 'imp' })]

    // Create a game with a night_started event, a night action done,
    // and a role_changed event (but no role_change_revealed)
    const game = makeGameWithHistory(
      [
        {
          type: 'game_created',
          stateOverrides: { phase: 'night', round: 2 },
        },
        { type: 'night_started' },
        {
          type: 'night_action',
          data: { roleId: 'washerwoman', playerId: 'p1' },
        },
        {
          type: 'role_changed',
          data: {
            playerId: 'p2',
            fromRole: 'scarlet_woman',
            toRole: 'imp',
          },
        },
      ],
      makeState({
        phase: 'night',
        round: 2,
        players,
      }),
    )

    const result = getNightRolesStatus(game)

    // Should only contain the washerwoman action (done),
    // and potentially the imp if it should wake.
    // NO role_change_reveal items should be present.
    const hasRoleChangeReveal = result.some(
      (r) => (r as unknown as Record<string, unknown>).actionType === 'role_change_reveal',
    )
    expect(hasRoleChangeReveal).toBeFalsy()

    // The washerwoman should be "done"
    const washerwoman = result.find((r) => r.roleId === 'washerwoman')
    assert(washerwoman)
    expect(washerwoman.status).toBe('done')
  })
})

// ============================================================================
// Integration: Scarlet Woman handler adds pending_role_reveal effect
// ============================================================================

describe('Demon Successor → pending_role_reveal integration', () => {
  it('Demon Successor handler adds pending_role_reveal when Demon dies', async () => {
    // Use the real DemonSuccessor effect
    const { default: successorDef } = await import('../effects/definition/demon-successor')
    assert(successorDef.handlers)
    const [handler] = successorDef.handlers

    const demon = makePlayer({ id: 'demon', roleId: 'imp' })
    let sw = makePlayer({ id: 'sw', roleId: 'scarlet_woman' })
    sw = addEffectTo(sw, 'demon_successor')
    const others = Array.from({ length: 4 }, (_, i) => makePlayer({ id: `p${i}`, roleId: 'villager' }))
    const state = makeState({
      phase: 'night',
      round: 2,
      players: [demon, sw, ...others],
    })
    const game = makeGame(state)

    const intent = {
      type: 'kill' as const,
      sourceId: 'demon',
      targetId: 'demon',
      cause: 'demon',
    }

    const result = handler.handle(intent, sw, state, game)

    expect(result.action).toBe('allow')
    assert(result.action === 'allow')
    // Adds pending_role_reveal
    expect(result.stateChanges?.addEffects).toEqual({
      sw: [{ type: 'pending_role_reveal', expiresAt: 'never' }],
    })

    // Removes demon_successor
    expect(result.stateChanges?.removeEffects).toEqual({
      sw: ['demon_successor'],
    })

    // The pending_role_reveal effect should produce a follow-up
    // Simulate: apply the changes, then check for follow-ups
    const swWithEffect = addEffectTo({ ...sw, roleId: 'imp', effects: [] }, 'pending_role_reveal')
    const newState = makeState({
      phase: 'night',
      round: 2,
      players: [addEffectTo(demon, 'dead'), swWithEffect, ...others],
    })

    const followUps = getAvailableNightFollowUps(newState, game, mockT)
    expect(followUps).toHaveLength(1)
    expect(followUps[0].playerId).toBe('sw')
    expect(followUps[0].label).toBe('Your role has changed!')
  })
})
