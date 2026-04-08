import { beforeEach, describe, expect, it } from 'vitest'

import { addEffectTo, makeGame, makePlayer, makeState, resetPlayerCounter } from '../../lib/__tests__/helpers'
import { type TargetActionConfig, buildTargetActionResult, resolveTargetFilter } from './TargetActionNightAction'

beforeEach(() => resetPlayerCounter())

const monkConfig: TargetActionConfig = {
  roleId: 'monk',
  icon: 'church',
  team: 'townsfolk',
  target: {
    filter: 'alive-others',
    applyEffect: { type: 'safe', data: { source: 'monk' }, expiresAt: 'end_of_night' },
    skipWhenMalfunctioning: true,
  },
  historyKeys: {
    action: 'roles.monk.history.protectedPlayer',
  },
}

describe('resolveTargetFilter', () => {
  it('alive-others excludes self and dead players', () => {
    const monk = makePlayer({ id: 'p1', name: 'Alice', roleId: 'monk' })
    const bob = makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' })
    const dead = addEffectTo(makePlayer({ id: 'p3', name: 'Carol', roleId: 'villager' }), 'dead')
    const state = makeState({ players: [monk, bob, dead] })
    const game = makeGame(state)

    const result = resolveTargetFilter('alive-others', monk, state, game)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p2')
  })

  it('alive-all includes self but excludes dead', () => {
    const monk = makePlayer({ id: 'p1', name: 'Alice', roleId: 'monk' })
    const bob = makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' })
    const dead = addEffectTo(makePlayer({ id: 'p3', name: 'Carol', roleId: 'villager' }), 'dead')
    const state = makeState({ players: [monk, bob, dead] })
    const game = makeGame(state)

    const result = resolveTargetFilter('alive-all', monk, state, game)
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.id)).toEqual(['p1', 'p2'])
  })

  it('dead includes only dead players', () => {
    const monk = makePlayer({ id: 'p1', name: 'Alice', roleId: 'monk' })
    const bob = makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' })
    const dead = addEffectTo(makePlayer({ id: 'p3', name: 'Carol', roleId: 'villager' }), 'dead')
    const state = makeState({ players: [monk, bob, dead] })
    const game = makeGame(state)

    const result = resolveTargetFilter('dead', monk, state, game)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p3')
  })

  it('custom filter function is called correctly', () => {
    const monk = makePlayer({ id: 'p1', name: 'Alice', roleId: 'monk' })
    const bob = makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' })
    const carol = makePlayer({ id: 'p3', name: 'Carol', roleId: 'imp' })
    const state = makeState({ players: [monk, bob, carol] })
    const game = makeGame(state)

    const filter = (p: { roleId: string }) => p.roleId === 'imp'
    const result = resolveTargetFilter(filter, monk, state, game)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p3')
  })
})

describe('buildTargetActionResult', () => {
  describe('with Monk config', () => {
    it('applies effect to target with sourcePlayerId', () => {
      const monk = makePlayer({ id: 'p1', name: 'Alice', roleId: 'monk' })
      const result = buildTargetActionResult(monkConfig, monk, 'p2', false, false)

      expect(result.entries).toHaveLength(1)
      expect(result.entries[0].data).toMatchObject({
        roleId: 'monk',
        playerId: 'p1',
        targetId: 'p2',
      })

      expect(result.addEffects).toBeDefined()
      expect(result.addEffects?.['p2']).toEqual([
        { type: 'safe', data: { source: 'monk' }, expiresAt: 'end_of_night', sourcePlayerId: 'p1' },
      ])
    })

    it('skips effect application when malfunctioning', () => {
      const monk = makePlayer({ id: 'p1', name: 'Alice', roleId: 'monk' })
      const result = buildTargetActionResult(monkConfig, monk, 'p2', false, true)

      expect(result.addEffects).toBeUndefined()
      expect(result.entries[0].data).toMatchObject({ malfunctioned: true })
    })

    it('does not include removeEffects (autoReplaceEffect is false)', () => {
      const monk = makePlayer({ id: 'p1', name: 'Alice', roleId: 'monk' })
      const result = buildTargetActionResult(monkConfig, monk, 'p2', false, false)

      expect(result.removeEffects).toBeUndefined()
    })
  })

  describe('with Butler config', () => {
    const butlerConfig: TargetActionConfig = {
      roleId: 'butler',
      icon: 'conciergeBell',
      team: 'outsider',
      target: {
        filter: 'alive-others',
        applyEffect: { type: 'butler_master', expiresAt: 'never' },
        applyEffectTo: 'self',
        effectTargetDataKey: 'masterId',
        skipWhenMalfunctioning: true,
        autoReplaceEffect: true,
      },
      historyKeys: {
        action: 'roles.butler.history.choseMaster',
      },
    }

    it('applies effect to self with target data key', () => {
      const butler = makePlayer({ id: 'p1', name: 'Alice', roleId: 'butler' })
      const result = buildTargetActionResult(butlerConfig, butler, 'p2', false, false)

      expect(result.addEffects).toBeDefined()
      expect(result.addEffects?.['p1']).toEqual([
        expect.objectContaining({
          type: 'butler_master',
          data: { masterId: 'p2' },
          expiresAt: 'never',
        }),
      ])
      // No sourcePlayerId when applying to self
      expect(result.addEffects?.['p1'][0]).not.toHaveProperty('sourcePlayerId')
    })

    it('includes removeEffects for auto-replace', () => {
      const butler = makePlayer({ id: 'p1', name: 'Alice', roleId: 'butler' })
      const result = buildTargetActionResult(butlerConfig, butler, 'p2', false, false)

      expect(result.removeEffects).toBeDefined()
      expect(result.removeEffects?.['p1']).toContain('butler_master')
    })

    it('skips effect when malfunctioning but still includes removeEffects', () => {
      const butler = makePlayer({ id: 'p1', name: 'Alice', roleId: 'butler' })
      const result = buildTargetActionResult(butlerConfig, butler, 'p2', false, true)

      expect(result.addEffects).toBeUndefined()
      expect(result.entries[0].data).toMatchObject({ malfunctioned: true })
      // removeEffects should still be present (autoReplace always removes)
      expect(result.removeEffects).toBeDefined()
      expect(result.removeEffects?.['p1']).toContain('butler_master')
    })
  })

  describe('with Poisoner config (firstNightReveal)', () => {
    const poisonerConfig: TargetActionConfig = {
      roleId: 'poisoner',
      icon: 'flask',
      team: 'minion',
      firstNightReveal: 'evil',
      target: {
        filter: 'alive-others',
        applyEffect: {
          type: 'poisoned',
          data: { source: 'poisoner' },
          expiresAt: 'end_of_day',
        },
      },
      historyKeys: {
        action: 'roles.poisoner.history.poisonedPlayer',
        shownTeam: 'roles.poisoner.history.shownEvilTeam',
      },
    }

    it('includes team reveal history entry on first night', () => {
      const poisoner = makePlayer({ id: 'p1', name: 'Alice', roleId: 'poisoner' })
      const result = buildTargetActionResult(poisonerConfig, poisoner, 'p2', true, false)

      expect(result.entries).toHaveLength(2)
      expect(result.entries[0].data).toMatchObject({
        roleId: 'poisoner',
        playerId: 'p1',
        action: 'first_night_info',
      })
      expect(result.entries[1].data).toMatchObject({
        roleId: 'poisoner',
        targetId: 'p2',
      })
    })

    it('does NOT include team reveal entry on subsequent nights', () => {
      const poisoner = makePlayer({ id: 'p1', name: 'Alice', roleId: 'poisoner' })
      const result = buildTargetActionResult(poisonerConfig, poisoner, 'p2', false, false)

      expect(result.entries).toHaveLength(1)
      expect(result.entries[0].data).toMatchObject({
        roleId: 'poisoner',
        targetId: 'p2',
      })
    })

    it('applies poisoned effect with sourcePlayerId', () => {
      const poisoner = makePlayer({ id: 'p1', name: 'Alice', roleId: 'poisoner' })
      const result = buildTargetActionResult(poisonerConfig, poisoner, 'p2', false, false)

      expect(result.addEffects?.['p2']).toEqual([
        expect.objectContaining({
          type: 'poisoned',
          data: { source: 'poisoner' },
          expiresAt: 'end_of_day',
          sourcePlayerId: 'p1',
        }),
      ])
    })
  })

  describe('with intent emission', () => {
    const impConfig: TargetActionConfig = {
      roleId: 'imp',
      icon: 'flameKindling',
      team: 'demon',
      target: {
        filter: 'alive-others',
        emitIntent: { type: 'kill', cause: 'demon' },
        skipWhenMalfunctioning: true,
      },
      historyKeys: {
        action: 'roles.imp.history.killedPlayer',
      },
    }

    it('emits kill intent', () => {
      const imp = makePlayer({ id: 'p1', name: 'Alice', roleId: 'imp' })
      const result = buildTargetActionResult(impConfig, imp, 'p2', false, false)

      expect(result.intent).toEqual({
        type: 'kill',
        sourceId: 'p1',
        targetId: 'p2',
        cause: 'demon',
      })
    })

    it('skips intent when malfunctioning', () => {
      const imp = makePlayer({ id: 'p1', name: 'Alice', roleId: 'imp' })
      const result = buildTargetActionResult(impConfig, imp, 'p2', false, true)

      expect(result.intent).toBeUndefined()
    })
  })
})
