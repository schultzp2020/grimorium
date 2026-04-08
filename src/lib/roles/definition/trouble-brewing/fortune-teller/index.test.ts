import { afterEach, assert, beforeEach, describe, expect, it } from 'vitest'

import definition from '.'
import {
  addEffectTo,
  makeGameWithHistory,
  makePlayer,
  makeState,
  resetPlayerCounter,
} from '../../../../__tests__/helpers'
import { getEffect, registerEffect, unregisterEffect } from '../../../../effects/registry'
import type { EffectDefinition, EffectId } from '../../../../effects/types'
import { applyPerceptionOverrides, getAmbiguousPlayers, perceive } from '../../../../pipeline/perception'

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

describe('FortuneTeller', () => {
  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('wakes every night when alive', () => {
      const player = makePlayer({ id: 'p1', roleId: 'fortune_teller' })
      const round1 = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 1 },
            stateOverrides: { round: 1 },
          },
        ],
        makeState({ round: 1, players: [player] }),
      )
      const round4 = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 4 },
            stateOverrides: { round: 4 },
          },
        ],
        makeState({ round: 4, players: [player] }),
      )

      assert(definition.shouldWake)
      expect(definition.shouldWake(round1, player)).toBeTruthy()
      assert(definition.shouldWake)
      expect(definition.shouldWake(round4, player)).toBeTruthy()
    })

    it('does not wake when dead', () => {
      const player = addEffectTo(makePlayer({ id: 'p1', roleId: 'fortune_teller' }), 'dead')
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { round: 2 },
          },
        ],
        makeState({ round: 2, players: [player] }),
      )
      assert(definition.shouldWake)
      expect(definition.shouldWake(game, player)).toBeFalsy()
    })
  })

  // ================================================================
  // PERCEPTION (demon detection uses "role" context)
  // ================================================================

  describe('demon detection via perception', () => {
    it('detects actual demon through role perception', () => {
      const ft = makePlayer({ id: 'p1', roleId: 'fortune_teller' })
      const imp = makePlayer({ id: 'p2', roleId: 'imp' })
      const state = makeState({ players: [ft, imp] })

      const perception = perceive(imp, ft, 'team', state)
      expect(perception.team).toBe('demon')
    })

    it('does not detect townsfolk as demon', () => {
      const ft = makePlayer({ id: 'p1', roleId: 'fortune_teller' })
      const villager = makePlayer({ id: 'p2', roleId: 'villager' })
      const state = makeState({ players: [ft, villager] })

      const perception = perceive(villager, ft, 'team', state)
      expect(perception.team).toBe('townsfolk')
    })

    it('deceiving player registering as demon triggers false positive', () => {
      registerTestEffect({
        id: 'appears_demon' as EffectId,
        icon: 'user',
        perceptionModifiers: [
          {
            context: 'team',
            modify: (p) => ({ ...p, team: 'demon' }),
          },
        ],
      })

      const ft = makePlayer({ id: 'p1', roleId: 'fortune_teller' })
      const recluse = addEffectTo(makePlayer({ id: 'p2', roleId: 'villager' }), 'appears_demon')
      const state = makeState({ players: [ft, recluse] })

      const perception = perceive(recluse, ft, 'team', state)
      expect(perception.team).toBe('demon') // false positive
    })

    it('demon appearing as townsfolk avoids detection', () => {
      registerTestEffect({
        id: 'appears_townsfolk' as EffectId,
        icon: 'user',
        perceptionModifiers: [
          {
            context: 'team',
            modify: (p) => ({ ...p, team: 'townsfolk' }),
          },
        ],
      })

      const ft = makePlayer({ id: 'p1', roleId: 'fortune_teller' })
      const spy = addEffectTo(makePlayer({ id: 'p2', roleId: 'imp' }), 'appears_townsfolk')
      const state = makeState({ players: [ft, spy] })

      const perception = perceive(spy, ft, 'team', state)
      expect(perception.team).toBe('townsfolk') // false negative
    })
  })

  // ================================================================
  // SETUP ACTION — Red Herring is assigned before role revelation
  // ================================================================

  describe('SetupAction', () => {
    it('has a SetupAction for Red Herring assignment', () => {
      expect(definition.SetupAction).toBeDefined()
    })
  })

  // ================================================================
  // NIGHT STEPS — 3 steps: Select players, Configure Malfunction (cond.), Show Result
  // ================================================================

  describe('nightSteps structure', () => {
    it('has 3 step definitions in correct order', () => {
      assert(definition.nightSteps)
      const steps = definition.nightSteps
      expect(steps.map((s) => s.id)).toEqual(['select_players', 'configure_malfunction', 'show_result'])
    })

    it('select_players and show_result have no condition (always appear)', () => {
      assert(definition.nightSteps)
      const selectPlayers = definition.nightSteps.find((s) => s.id === 'select_players')
      assert(selectPlayers)
      const showResult = definition.nightSteps.find((s) => s.id === 'show_result')
      assert(showResult)
      expect(selectPlayers.condition).toBeUndefined()
      expect(showResult.condition).toBeUndefined()
    })

    it('does not include a red_herring_setup night step', () => {
      assert(definition.nightSteps)
      const redHerringStep = definition.nightSteps.find((s) => s.id === 'red_herring_setup')
      expect(redHerringStep).toBeUndefined()
    })
  })

  // ================================================================
  // RED HERRING (via perception — see RedHerring.test.ts for full tests)
  // ================================================================

  describe('red herring via perception', () => {
    it('red herring registers as demon to the Fortune Teller via perception', () => {
      const ft = makePlayer({ id: 'p1', roleId: 'fortune_teller' })
      const herring = addEffectTo(makePlayer({ id: 'p2', roleId: 'villager' }), 'red_herring', {
        fortuneTellerId: 'p1',
      })
      const state = makeState({ players: [ft, herring] })

      const perception = perceive(herring, ft, 'team', state)
      expect(perception.team).toBe('demon')
    })
  })

  // ================================================================
  // PERCEPTION CONFIGURATION — ambiguous players trigger PerceptionConfigStep
  // ================================================================

  describe('perception configuration for ambiguous players', () => {
    it('detects ambiguous players among selected targets via getAmbiguousPlayers', () => {
      registerTestEffect({
        id: 'can_register_demon' as EffectId,
        icon: 'user',
        canRegisterAs: {
          teams: ['minion', 'demon'],
          alignments: ['evil'],
        },
        perceptionModifiers: [
          {
            context: ['alignment', 'team', 'role'],
            modify: (p, _target, _observer, _state, effectData) => {
              const overrides = effectData?.perceiveAs as Partial<typeof p> | undefined
              if (!overrides) {
                return p
              }
              return { ...p, ...overrides }
            },
          },
        ],
      })

      const recluse = addEffectTo(makePlayer({ id: 'p1', roleId: 'villager' }), 'can_register_demon')
      const villager = makePlayer({ id: 'p2', roleId: 'villager' })

      const ambiguous = getAmbiguousPlayers([recluse, villager], 'team')
      expect(ambiguous).toHaveLength(1)
      expect(ambiguous[0].id).toBe('p1')
    })

    it('returns no ambiguous players when none have canRegisterAs effects', () => {
      const villager1 = makePlayer({ id: 'p1', roleId: 'villager' })
      const villager2 = makePlayer({ id: 'p2', roleId: 'villager' })

      const ambiguous = getAmbiguousPlayers([villager1, villager2], 'team')
      expect(ambiguous).toHaveLength(0)
    })

    it('applyPerceptionOverrides makes ambiguous player register as demon for perceive()', () => {
      registerTestEffect({
        id: 'can_register_demon' as EffectId,
        icon: 'user',
        canRegisterAs: {
          teams: ['minion', 'demon'],
          alignments: ['evil'],
        },
        perceptionModifiers: [
          {
            context: ['alignment', 'team', 'role'],
            modify: (p, _target, _observer, _state, effectData) => {
              const overrides = effectData?.perceiveAs as Partial<typeof p> | undefined
              if (!overrides) {
                return p
              }
              return { ...p, ...overrides }
            },
          },
        ],
      })

      const ft = makePlayer({ id: 'p1', roleId: 'fortune_teller' })
      const recluse = addEffectTo(makePlayer({ id: 'p2', roleId: 'villager' }), 'can_register_demon')
      const state = makeState({ players: [ft, recluse] })

      // Without overrides, recluse registers as their default (townsfolk)
      const defaultPerception = perceive(recluse, ft, 'team', state)
      expect(defaultPerception.team).toBe('townsfolk')

      // With overrides, recluse registers as demon
      const overrides = { [recluse.id]: { team: 'demon' as const } }
      const effectiveState = applyPerceptionOverrides(state, overrides)
      const effectiveRecluse = effectiveState.players.find((p) => p.id === recluse.id)
      assert(effectiveRecluse)
      const effectiveFt = effectiveState.players.find((p) => p.id === ft.id)
      assert(effectiveFt)
      const overriddenPerception = perceive(effectiveRecluse, effectiveFt, 'team', effectiveState)
      expect(overriddenPerception.team).toBe('demon')
    })

    it('only scopes ambiguity check to selected players, not all players', () => {
      registerTestEffect({
        id: 'can_register_demon' as EffectId,
        icon: 'user',
        canRegisterAs: {
          teams: ['minion', 'demon'],
          alignments: ['evil'],
        },
        perceptionModifiers: [
          {
            context: ['alignment', 'team', 'role'],
            modify: (p, _target, _observer, _state, effectData) => {
              const overrides = effectData?.perceiveAs as Partial<typeof p> | undefined
              if (!overrides) {
                return p
              }
              return { ...p, ...overrides }
            },
          },
        ],
      })

      const recluse = addEffectTo(makePlayer({ id: 'p1', roleId: 'villager' }), 'can_register_demon')
      const villager1 = makePlayer({ id: 'p2', roleId: 'villager' })
      const villager2 = makePlayer({ id: 'p3', roleId: 'villager' })

      // When recluse is NOT one of the selected players, no ambiguity
      const noAmbiguity = getAmbiguousPlayers([villager1, villager2], 'team')
      expect(noAmbiguity).toHaveLength(0)

      // When recluse IS one of the selected players, ambiguity detected
      const withAmbiguity = getAmbiguousPlayers([recluse, villager1], 'team')
      expect(withAmbiguity).toHaveLength(1)
    })
  })
})
