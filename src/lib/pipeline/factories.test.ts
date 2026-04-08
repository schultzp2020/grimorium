import type { FC } from 'react'
import { assert, beforeEach, describe, expect, it } from 'vitest'

import { makeGame, makePlayer, makeState, resetPlayerCounter } from '../__tests__/helpers'
import { createProtectionHandler, createRedirectHandler } from './factories'
import type { KillIntent, PipelineInputProps } from './types'

beforeEach(() => resetPlayerCounter())

describe('createProtectionHandler', () => {
  const handler = createProtectionHandler({
    intentType: 'kill',
    priority: 10,
    reason: 'protected',
    historyKey: 'roles.imp.history.failedToKill',
  })

  describe('structure', () => {
    it('returns an IntentHandler with the configured intentType', () => {
      expect(handler.intentType).toBe('kill')
    })

    it('returns an IntentHandler with the configured priority', () => {
      expect(handler.priority).toBe(10)
    })
  })

  describe('default appliesTo', () => {
    it('applies when intent.targetId matches effectPlayer.id', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      expect(handler.appliesTo(intent, player, state)).toBeTruthy()
    })

    it('does not apply when intent.targetId does not match effectPlayer.id', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p3',
        cause: 'demon',
      }

      expect(handler.appliesTo(intent, player, state)).toBeFalsy()
    })
  })

  describe('handle', () => {
    it('returns action prevent with the configured reason', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const game = makeGame(state)
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      const result = handler.handle(intent, player, state, game)
      expect(result.action).toBe('prevent')
      assert(result.action === 'prevent')
      expect(result.reason).toBe('protected')
    })

    it('generates a history entry with the configured historyKey', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const game = makeGame(state)
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      const result = handler.handle(intent, player, state, game)
      assert(result.action === 'prevent')
      expect(result.stateChanges?.entries).toHaveLength(1)
      expect(result.stateChanges?.entries[0].message).toEqual([
        {
          type: 'i18n',
          key: 'roles.imp.history.failedToKill',
          params: {
            player: 'p2',
            target: 'p1',
          },
        },
      ])
    })

    it('includes sourceId and targetId in history data', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const game = makeGame(state)
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      const result = handler.handle(intent, player, state, game)
      assert(result.action === 'prevent')
      expect(result.stateChanges?.entries[0].data).toEqual({
        action: 'kill_failed',
        sourceId: 'p2',
        targetId: 'p1',
        reason: 'protected',
      })
    })
  })

  describe('custom appliesTo', () => {
    it('uses the custom appliesTo when provided', () => {
      const customHandler = createProtectionHandler({
        intentType: 'kill',
        priority: 10,
        reason: 'custom_reason',
        historyKey: 'test.key',
        appliesTo: (_intent, _player, state) => state.round > 1,
      })

      const player = makePlayer({ id: 'p1' })
      const stateRound1 = makeState({ players: [player], round: 1 })
      const stateRound2 = makeState({ players: [player], round: 2 })
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      expect(customHandler.appliesTo(intent, player, stateRound1)).toBeFalsy()
      expect(customHandler.appliesTo(intent, player, stateRound2)).toBeTruthy()
    })
  })

  describe('historyDataReason', () => {
    it('uses historyDataReason in data when provided', () => {
      const customHandler = createProtectionHandler({
        intentType: 'kill',
        priority: 10,
        reason: 'protected',
        historyDataReason: 'safe',
        historyKey: 'test.key',
      })

      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const game = makeGame(state)
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      const result = customHandler.handle(intent, player, state, game)
      assert(result.action === 'prevent')
      expect(result.reason).toBe('protected')
      expect(result.stateChanges?.entries[0].data).toMatchObject({ reason: 'safe' })
    })
  })

  // NOTE: intentType is restricted to 'kill' because both factories
  // hardcode KillIntent field access (sourceId, targetId). NominateIntent
  // and ExecuteIntent have different field names and would produce
  // broken history entries.
})

describe('createRedirectHandler', () => {
  const MockRedirectUI: FC<PipelineInputProps> = () => null

  const handler = createRedirectHandler({
    intentType: 'kill',
    priority: 5,
    UIComponent: MockRedirectUI,
    historyKey: 'roles.imp.history.deflectRedirected',
  })

  describe('structure', () => {
    it('returns an IntentHandler with the configured intentType', () => {
      expect(handler.intentType).toBe('kill')
    })

    it('returns an IntentHandler with the configured priority', () => {
      expect(handler.priority).toBe(5)
    })
  })

  describe('default appliesTo', () => {
    it('applies when intent.targetId matches effectPlayer.id', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      expect(handler.appliesTo(intent, player, state)).toBeTruthy()
    })

    it('does not apply when intent.targetId does not match effectPlayer.id', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p3',
        cause: 'demon',
      }

      expect(handler.appliesTo(intent, player, state)).toBeFalsy()
    })
  })

  describe('handle', () => {
    it('returns action request_ui', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const game = makeGame(state)
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      const result = handler.handle(intent, player, state, game)
      expect(result.action).toBe('request_ui')
    })

    it('provides the configured UIComponent', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const game = makeGame(state)
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      const result = handler.handle(intent, player, state, game)
      assert(result.action === 'request_ui')
      expect(result.UIComponent).toBe(MockRedirectUI)
    })

    it('provides a resume function', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const game = makeGame(state)
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      const result = handler.handle(intent, player, state, game)
      assert(result.action === 'request_ui')
      expect(typeof result.resume).toBe('function')
    })
  })

  describe('resume (redirect)', () => {
    it('returns action redirect with new target', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const game = makeGame(state)
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      const result = handler.handle(intent, player, state, game)
      assert(result.action === 'request_ui')
      const resumed = result.resume('p3')
      expect(resumed.action).toBe('redirect')
      assert(resumed.action === 'redirect')
      expect((resumed.newIntent as KillIntent).targetId).toBe('p3')
    })

    it('preserves the rest of the original intent in the redirect', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const game = makeGame(state)
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      const result = handler.handle(intent, player, state, game)
      assert(result.action === 'request_ui')
      const resumed = result.resume('p3')
      assert(resumed.action === 'redirect')
      const newKill = resumed.newIntent as KillIntent
      expect(newKill.sourceId).toBe('p2')
      expect(newKill.cause).toBe('demon')
      expect(newKill.type).toBe('kill')
    })

    it('generates a redirect history entry', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const game = makeGame(state)
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      const result = handler.handle(intent, player, state, game)
      assert(result.action === 'request_ui')
      const resumed = result.resume('p3')
      assert(resumed.action === 'redirect')
      expect(resumed.stateChanges?.entries).toHaveLength(1)
      expect(resumed.stateChanges?.entries[0].data).toEqual({
        action: 'kill_redirected',
        sourceId: 'p2',
        originalTargetId: 'p1',
        redirectTargetId: 'p3',
      })
    })

    it('uses the configured historyKey in the message', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const game = makeGame(state)
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      const result = handler.handle(intent, player, state, game)
      assert(result.action === 'request_ui')
      const resumed = result.resume('p3')
      assert(resumed.action === 'redirect')
      expect(resumed.stateChanges?.entries[0].message).toEqual([
        {
          type: 'i18n',
          key: 'roles.imp.history.deflectRedirected',
          params: {
            player: 'p2',
            target: 'p1',
            redirect: 'p3',
          },
        },
      ])
    })
  })

  describe('resume (same target)', () => {
    it('returns action allow when narrator selects the original target', () => {
      const player = makePlayer({ id: 'p1' })
      const state = makeState({ players: [player] })
      const game = makeGame(state)
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      const result = handler.handle(intent, player, state, game)
      assert(result.action === 'request_ui')
      const resumed = result.resume('p1') // same as original target
      expect(resumed.action).toBe('allow')
    })
  })

  describe('custom appliesTo', () => {
    it('uses the custom appliesTo when provided', () => {
      const customHandler = createRedirectHandler({
        intentType: 'kill',
        priority: 5,
        UIComponent: MockRedirectUI,
        historyKey: 'test.key',
        appliesTo: (_intent, _player, state) => state.round > 1,
      })

      const player = makePlayer({ id: 'p1' })
      const stateRound1 = makeState({ players: [player], round: 1 })
      const stateRound2 = makeState({ players: [player], round: 2 })
      const intent: KillIntent = {
        type: 'kill',
        sourceId: 'p2',
        targetId: 'p1',
        cause: 'demon',
      }

      expect(customHandler.appliesTo(intent, player, stateRound1)).toBeFalsy()
      expect(customHandler.appliesTo(intent, player, stateRound2)).toBeTruthy()
    })
  })
})
