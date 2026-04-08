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
import { canRegisterAsTeam, perceive } from '../../../../pipeline/perception'

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

describe('Investigator', () => {
  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('wakes only on the first night', () => {
      const player = makePlayer({ id: 'p1', roleId: 'investigator' })
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
      const round2 = makeGameWithHistory(
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
      expect(definition.shouldWake(round1, player)).toBeTruthy()
      assert(definition.shouldWake)
      expect(definition.shouldWake(round2, player)).toBeFalsy()
    })

    it('does not wake when dead', () => {
      const player = addEffectTo(makePlayer({ id: 'p1', roleId: 'investigator' }), 'dead')
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
      assert(definition.shouldWake)
      expect(definition.shouldWake(game, player)).toBeFalsy()
    })
  })

  // ================================================================
  // PERCEPTION (Investigator uses "team" to find minions)
  // ================================================================

  describe('perception integration', () => {
    it('identifies minion correctly via team perception', () => {
      const investigator = makePlayer({
        id: 'p1',
        roleId: 'investigator',
      })

      // Imp is demon, not minion
      const imp = makePlayer({ id: 'p2', roleId: 'imp' })
      const stateWithImp = makeState({ players: [investigator, imp] })
      const perception = perceive(imp, investigator, 'team', stateWithImp)
      expect(perception.team).toBe('demon') // imp is demon, not minion
    })

    it('good player appearing as minion creates false positive', () => {
      registerTestEffect({
        id: 'appears_minion' as EffectId,
        icon: 'user',
        perceptionModifiers: [
          {
            context: 'team',
            modify: (p) => ({ ...p, team: 'minion' }),
          },
        ],
      })

      const investigator = makePlayer({
        id: 'p1',
        roleId: 'investigator',
      })
      const villager = addEffectTo(makePlayer({ id: 'p2', roleId: 'villager' }), 'appears_minion')
      const state = makeState({ players: [investigator, villager] })

      const perception = perceive(villager, investigator, 'team', state)
      expect(perception.team).toBe('minion') // false positive
    })

    it('Recluse with misregister can register as minion', () => {
      const investigator = makePlayer({
        id: 'p1',
        roleId: 'investigator',
      })
      const recluse = addEffectTo(makePlayer({ id: 'p2', roleId: 'recluse' }), 'misregister', {
        canRegisterAs: {
          teams: ['minion', 'demon'],
          alignments: ['evil'],
        },
      })
      const state = makeState({ players: [investigator, recluse] })

      // perceive returns outsider (actual team) without perceiveAs config
      const perception = perceive(recluse, investigator, 'team', state)
      expect(perception.team).toBe('outsider')

      // But canRegisterAsTeam returns true (declared by instance data)
      expect(canRegisterAsTeam(recluse, 'minion')).toBeTruthy()
      expect(canRegisterAsTeam(recluse, 'demon')).toBeTruthy()
    })

    it('Recluse with perceiveAs configured shows as minion via perceive', () => {
      const investigator = makePlayer({
        id: 'p1',
        roleId: 'investigator',
      })
      const recluse = addEffectTo(makePlayer({ id: 'p2', roleId: 'recluse' }), 'misregister', {
        canRegisterAs: {
          teams: ['minion', 'demon'],
          alignments: ['evil'],
        },
        perceiveAs: { team: 'minion', alignment: 'evil' },
      })
      const state = makeState({ players: [investigator, recluse] })

      const perception = perceive(recluse, investigator, 'team', state)
      expect(perception.team).toBe('minion')
    })

    it('role shown is affected by role perception modifiers', () => {
      registerTestEffect({
        id: 'appears_as_imp' as EffectId,
        icon: 'user',
        perceptionModifiers: [
          {
            context: 'role',
            modify: (p) => ({ ...p, roleId: 'imp' }),
          },
        ],
      })

      const investigator = makePlayer({
        id: 'p1',
        roleId: 'investigator',
      })
      const villager = addEffectTo(makePlayer({ id: 'p2', roleId: 'villager' }), 'appears_as_imp')
      const state = makeState({ players: [investigator, villager] })

      const rolePerception = perceive(villager, investigator, 'role', state)
      expect(rolePerception.roleId).toBe('imp') // shown wrong role
    })
  })
})
