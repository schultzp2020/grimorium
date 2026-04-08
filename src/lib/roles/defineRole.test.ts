import { assert, beforeEach, describe, expect, it } from 'vitest'

import { addEffectTo, makeGame, makePlayer, makeState, resetPlayerCounter } from '../__tests__/helpers'
import { defineRole } from './defineRole'

beforeEach(() => resetPlayerCounter())

describe('defineRole', () => {
  describe('passive category', () => {
    it('produces a RoleDefinition with nightOrder null and NightAction null', () => {
      const role = defineRole({
        id: 'villager',
        category: 'passive',
        team: 'townsfolk',
        icon: 'user',
      })

      expect(role.id).toBe('villager')
      expect(role.team).toBe('townsfolk')
      expect(role.icon).toBe('user')
      expect(role.nightOrder).toBeNull()
      expect(role.NightAction).toBeNull()
      expect(role.RoleReveal).toBeDefined()
    })

    it('passes through initialEffects', () => {
      const role = defineRole({
        id: 'soldier',
        category: 'passive',
        team: 'townsfolk',
        icon: 'shield',
        initialEffects: [{ type: 'safe', data: { source: 'soldier' }, expiresAt: 'never' }],
      })

      expect(role.initialEffects).toEqual([{ type: 'safe', data: { source: 'soldier' }, expiresAt: 'never' }])
    })

    it('passes through winConditions', () => {
      const winCheck = {
        trigger: 'end_of_day' as const,
        check: () => null,
      }

      const role = defineRole({
        id: 'mayor',
        category: 'passive',
        team: 'townsfolk',
        icon: 'landmark',
        winConditions: [winCheck],
      })

      expect(role.winConditions).toEqual([winCheck])
    })

    it('passes through distributionModifier', () => {
      const role = defineRole({
        id: 'baron',
        category: 'passive',
        team: 'minion',
        icon: 'hatTop',
        distributionModifier: { outsider: 2, townsfolk: -2 },
      })

      expect(role.distributionModifier).toEqual({ outsider: 2, townsfolk: -2 })
    })

    it('generates a NightAction for firstNightReveal and assigns nightOrder', () => {
      const role = defineRole({
        id: 'baron',
        category: 'passive',
        team: 'minion',
        icon: 'hatTop',
        firstNightReveal: 'evil',
      })

      expect(role.nightOrder).not.toBeNull()
      expect(role.NightAction).not.toBeNull()

      assert(role.shouldWake)
      const player = makePlayer({ roleId: 'baron' })
      const gameRound1 = makeGame(makeState({ round: 1, players: [player] }))
      const gameRound2 = makeGame(makeState({ round: 2, players: [player] }))

      expect(role.shouldWake(gameRound1, player)).toBeTruthy()
      expect(role.shouldWake(gameRound2, player)).toBeFalsy()
    })
  })

  describe('target-action category', () => {
    it('produces a RoleDefinition with a NightAction component', () => {
      const role = defineRole({
        id: 'monk',
        category: 'target-action',
        team: 'townsfolk',
        icon: 'church',
        nightOrder: 20,
        wakeCondition: 'not-first-night',
        target: {
          filter: 'alive-others',
          applyEffect: { type: 'safe', data: { source: 'monk' }, expiresAt: 'end_of_night' },
          skipWhenMalfunctioning: true,
        },
        historyKeys: {
          action: 'roles.monk.history.protectedPlayer',
        },
      })

      expect(role.id).toBe('monk')
      expect(role.nightOrder).toBe(20)
      expect(role.NightAction).not.toBeNull()
      expect(role.RoleReveal).toBeDefined()
    })

    it('resolves wakeCondition "not-first-night"', () => {
      const role = defineRole({
        id: 'monk',
        category: 'target-action',
        team: 'townsfolk',
        icon: 'church',
        nightOrder: 20,
        wakeCondition: 'not-first-night',
        target: {
          filter: 'alive-others',
          applyEffect: { type: 'safe', expiresAt: 'end_of_night' },
          skipWhenMalfunctioning: true,
        },
        historyKeys: { action: 'roles.monk.history.protectedPlayer' },
      })

      assert(role.shouldWake)
      const player = makePlayer({ roleId: 'monk' })

      const round1 = makeGame(makeState({ round: 1, players: [player] }))
      expect(role.shouldWake(round1, player)).toBeFalsy()

      const round2 = makeGame(makeState({ round: 2, players: [player] }))
      expect(role.shouldWake(round2, player)).toBeTruthy()
    })

    it('resolves wakeCondition "always" (dead players do not wake)', () => {
      const role = defineRole({
        id: 'poisoner',
        category: 'target-action',
        team: 'minion',
        icon: 'flask',
        nightOrder: 5,
        wakeCondition: 'always',
        target: {
          filter: 'alive-others',
          applyEffect: { type: 'poisoned', expiresAt: 'end_of_day' },
        },
        historyKeys: { action: 'roles.poisoner.history.poisonedPlayer' },
      })

      assert(role.shouldWake)
      const alive = makePlayer({ roleId: 'poisoner' })
      const dead = addEffectTo(makePlayer({ roleId: 'poisoner' }), 'dead')
      const game = makeGame(makeState({ round: 2, players: [alive] }))

      expect(role.shouldWake(game, alive)).toBeTruthy()
      expect(role.shouldWake(game, dead)).toBeFalsy()
    })

    it('resolves wakeCondition "first-night-only"', () => {
      const role = defineRole({
        id: 'washerwoman',
        category: 'target-action',
        team: 'townsfolk',
        icon: 'shirt',
        nightOrder: 10,
        wakeCondition: 'first-night-only',
        target: {
          filter: 'alive-others',
          applyEffect: { type: 'safe', expiresAt: 'end_of_night' },
        },
        historyKeys: { action: 'test' },
      })

      assert(role.shouldWake)
      const player = makePlayer({ roleId: 'washerwoman' })

      const round1 = makeGame(makeState({ round: 1, players: [player] }))
      expect(role.shouldWake(round1, player)).toBeTruthy()

      const round2 = makeGame(makeState({ round: 2, players: [player] }))
      expect(role.shouldWake(round2, player)).toBeFalsy()
    })

    it('generates nightSteps with conditional team reveal step', () => {
      const role = defineRole({
        id: 'poisoner',
        category: 'target-action',
        team: 'minion',
        icon: 'flask',
        nightOrder: 5,
        wakeCondition: 'always',
        firstNightReveal: 'evil',
        target: {
          filter: 'alive-others',
          applyEffect: { type: 'poisoned', expiresAt: 'end_of_day' },
        },
        historyKeys: {
          action: 'roles.poisoner.history.poisonedPlayer',
          shownTeam: 'roles.poisoner.history.shownEvilTeam',
        },
      })

      assert(role.nightSteps)
      expect(role.nightSteps).toHaveLength(2)
      const [firstStep] = role.nightSteps
      expect(firstStep.id).toBe('show_team')
      assert(firstStep.condition)
      const p = makePlayer({ roleId: 'poisoner' })
      const g = makeGame(makeState({ round: 1, players: [p] }))
      expect(firstStep.condition(g, p, makeState({ round: 1 }))).toBeTruthy()
      expect(firstStep.condition(g, p, makeState({ round: 2 }))).toBeFalsy()
    })
  })

  describe('info-narrator-setup category', () => {
    it('produces a RoleDefinition wrapping InfoRoleNightAction', () => {
      const role = defineRole({
        id: 'washerwoman',
        category: 'info-narrator-setup',
        team: 'townsfolk',
        icon: 'shirt',
        nightOrder: 10,
        wakeCondition: 'first-night-only',
        info: {
          roleId: 'washerwoman',
          icon: 'shirt',
          targetTeam: 'townsfolk',
          historyKeys: {
            discovered: 'roles.washerwoman.history.discoveredTownsfolk',
            noTarget: 'roles.washerwoman.history.noTownsfolk',
          },
          getLabels: (roleT) => ({
            infoTitle: roleT.washerwomanInfo,
            noTargetTitle: roleT.noTownsfolkInGame,
            noTargetMessage: roleT.noTownsfolkMessage,
            noTargetConfirm: roleT.confirmNoTownsfolk,
            showNoTargetLink: roleT.showNoTownsfolk,
            mustIncludeTarget: roleT.mustIncludeTownsfolk,
          }),
        },
      })

      expect(role.id).toBe('washerwoman')
      expect(role.nightOrder).toBe(10)
      expect(role.NightAction).not.toBeNull()
    })
  })

  describe('custom category', () => {
    it('passes through NightAction and nightSteps directly', () => {
      const MockNightAction = () => null
      const steps = [{ id: 'step1', icon: 'user' as const, getLabel: () => 'Step 1' }]

      const role = defineRole({
        id: 'imp',
        category: 'custom',
        team: 'demon',
        icon: 'flameKindling',
        nightOrder: 30,
        wakeCondition: 'always',
        NightAction: MockNightAction,
        nightSteps: steps,
      })

      expect(role.NightAction).toBe(MockNightAction)
      expect(role.nightSteps).toBe(steps)
      expect(role.nightOrder).toBe(30)
    })

    it('passes through SetupAction for Drunk', () => {
      const MockSetupAction = () => null

      const role = defineRole({
        id: 'drunk',
        category: 'custom',
        team: 'outsider',
        icon: 'beer',
        nightOrder: null,
        NightAction: null,
        SetupAction: MockSetupAction,
      })

      expect(role.SetupAction).toBe(MockSetupAction)
      expect(role.NightAction).toBeNull()
      expect(role.nightOrder).toBeNull()
    })

    it('resolves wakeCondition for custom roles', () => {
      const role = defineRole({
        id: 'spy',
        category: 'custom',
        team: 'minion',
        icon: 'hatGlasses',
        nightOrder: 36,
        wakeCondition: 'always',
        NightAction: () => null,
      })

      assert(role.shouldWake)
      const alive = makePlayer({ roleId: 'spy' })
      const dead = addEffectTo(makePlayer({ roleId: 'spy' }), 'dead')
      const game = makeGame(makeState({ round: 2, players: [alive] }))

      expect(role.shouldWake(game, alive)).toBeTruthy()
      expect(role.shouldWake(game, dead)).toBeFalsy()
    })

    it('allows custom wakeCondition function', () => {
      const role = defineRole({
        id: 'ravenkeeper',
        category: 'custom',
        team: 'townsfolk',
        icon: 'birdHouse',
        nightOrder: 25,
        wakeCondition: (_game, player) => player.effects.some((e) => e.type === 'dead'),
        NightAction: () => null,
      })

      assert(role.shouldWake)
      const dead = addEffectTo(makePlayer({ roleId: 'ravenkeeper' }), 'dead')
      const game = makeGame(makeState({ round: 2, players: [dead] }))

      expect(role.shouldWake(game, dead)).toBeTruthy()
    })
  })
})
