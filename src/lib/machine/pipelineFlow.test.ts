import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createActor } from 'xstate'

import { makeGame, makePlayer, makeState, resetPlayerCounter } from '../__tests__/helpers'
import type { PipelineResult, StateChanges } from '../pipeline/types'
import { gameMachine } from './gameMachine'

// Mock storage to avoid localStorage in tests
vi.mock('../storage', () => ({
  saveGame: vi.fn<() => void>(),
}))

// Mock resolveIntent to control pipeline behavior
let mockResolveIntent: ((intent: unknown, state: unknown, game: unknown) => PipelineResult) | null = null

vi.mock('../pipeline', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal()
  return {
    ...actual,
    resolveIntent: (...args: unknown[]) => {
      if (mockResolveIntent) {
        return mockResolveIntent(args[0], args[1], args[2])
      }
      return (actual.resolveIntent as (...a: unknown[]) => PipelineResult)(...args)
    },
  }
})

function makeSetupGame() {
  return makeGame(
    makeState({
      phase: 'setup',
      round: 0,
      players: [
        makePlayer({ id: 'p1', roleId: 'villager' }),
        makePlayer({ id: 'p2', roleId: 'villager' }),
        makePlayer({ id: 'p3', roleId: 'villager' }),
        makePlayer({ id: 'p4', roleId: 'villager' }),
        makePlayer({ id: 'p5', roleId: 'imp' }),
      ],
    }),
  )
}

function startNightActor() {
  const game = makeSetupGame()
  const actor = createActor(gameMachine, { input: { game } })
  actor.start()
  actor.send({ type: 'START_FIRST_NIGHT' })
  return actor
}

describe('pipeline needs_input flow', () => {
  beforeEach(() => {
    resetPlayerCounter()
    vi.clearAllMocks()
    mockResolveIntent = null
  })

  it('transitions to pipeline_input when intent returns needs_input', () => {
    const MockComponent = () => null

    mockResolveIntent = () => ({
      type: 'needs_input' as const,
      UIComponent: MockComponent,
      intent: { type: 'kill' as const, sourceId: 'p5', targetId: 'p1', cause: 'demon' },
      resume: () => ({
        type: 'resolved' as const,
        stateChanges: { entries: [] } as StateChanges,
      }),
    })

    const actor = startNightActor()

    actor.send({
      type: 'OPEN_NIGHT_ACTION',
      playerId: 'p5',
      roleId: 'imp',
    })

    actor.send({
      type: 'NIGHT_ACTION_COMPLETE',
      result: {
        entries: [
          {
            type: 'night_action' as const,
            message: [{ type: 'text' as const, content: 'Imp kills' }],
            data: { playerId: 'p5' },
          },
        ],
        intent: { type: 'kill' as const, sourceId: 'p5', targetId: 'p1', cause: 'demon' },
      },
    })

    const snapshot = actor.getSnapshot()
    expect(snapshot.matches({ playing: { night: 'pipeline_input' } })).toBeTruthy()
    expect(snapshot.context.pipelineUI).not.toBeNull()
    expect(snapshot.context.pipelineUI?.Component).toBe(MockComponent)
    expect(snapshot.context._pipelineResume).not.toBeNull()
    actor.stop()
  })

  it('resolves pipeline and returns to dashboard on PIPELINE_INPUT_COMPLETE', () => {
    const MockComponent = () => null
    const resumeFn = vi.fn<(result: unknown) => PipelineResult>().mockReturnValue({
      type: 'resolved',
      stateChanges: {
        entries: [
          {
            type: 'night_action' as const,
            message: [{ type: 'text' as const, content: 'Kill resolved' }],
            data: {},
          },
        ],
        addEffects: {
          p1: [{ type: 'dead' }],
        },
      } satisfies StateChanges,
    })

    mockResolveIntent = () => ({
      type: 'needs_input' as const,
      UIComponent: MockComponent,
      intent: { type: 'kill' as const, sourceId: 'p5', targetId: 'p1', cause: 'demon' },
      resume: resumeFn,
    })

    const actor = startNightActor()

    actor.send({
      type: 'OPEN_NIGHT_ACTION',
      playerId: 'p5',
      roleId: 'imp',
    })

    actor.send({
      type: 'NIGHT_ACTION_COMPLETE',
      result: {
        entries: [
          {
            type: 'night_action' as const,
            message: [{ type: 'text' as const, content: 'Imp kills' }],
            data: { playerId: 'p5' },
          },
        ],
        intent: { type: 'kill' as const, sourceId: 'p5', targetId: 'p1', cause: 'demon' },
      },
    })

    // Should be in pipeline_input
    expect(actor.getSnapshot().matches({ playing: { night: 'pipeline_input' } })).toBeTruthy()

    // Complete pipeline input
    actor.send({
      type: 'PIPELINE_INPUT_COMPLETE',
      result: { selectedTarget: 'p2' },
    })

    // Resume should have been called with the result
    expect(resumeFn).toHaveBeenCalledWith({ selectedTarget: 'p2' })

    // Should return to dashboard since resolved and no game over
    expect(actor.getSnapshot().matches({ playing: { night: 'dashboard' } })).toBeTruthy()
    expect(actor.getSnapshot().context.pipelineUI).toBeNull()
    expect(actor.getSnapshot().context._pipelineResume).toBeNull()
    actor.stop()
  })

  it('stays in pipeline_input when resume returns needs_input again', () => {
    const MockComponent1 = () => null
    const MockComponent2 = () => null

    const secondResumeFn = vi.fn<(result: unknown) => PipelineResult>().mockReturnValue({
      type: 'resolved',
      stateChanges: { entries: [] } as StateChanges,
    })

    const firstResumeFn = vi.fn<(result: unknown) => PipelineResult>().mockReturnValue({
      type: 'needs_input',
      UIComponent: MockComponent2,
      intent: { type: 'kill' as const, sourceId: 'p5', targetId: 'p2', cause: 'demon' },
      resume: secondResumeFn,
    })

    mockResolveIntent = () => ({
      type: 'needs_input' as const,
      UIComponent: MockComponent1,
      intent: { type: 'kill' as const, sourceId: 'p5', targetId: 'p1', cause: 'demon' },
      resume: firstResumeFn,
    })

    const actor = startNightActor()

    actor.send({
      type: 'OPEN_NIGHT_ACTION',
      playerId: 'p5',
      roleId: 'imp',
    })

    actor.send({
      type: 'NIGHT_ACTION_COMPLETE',
      result: {
        entries: [
          {
            type: 'night_action' as const,
            message: [{ type: 'text' as const, content: 'Imp kills' }],
            data: { playerId: 'p5' },
          },
        ],
        intent: { type: 'kill' as const, sourceId: 'p5', targetId: 'p1', cause: 'demon' },
      },
    })

    // First pipeline_input with MockComponent1
    expect(actor.getSnapshot().matches({ playing: { night: 'pipeline_input' } })).toBeTruthy()
    expect(actor.getSnapshot().context.pipelineUI?.Component).toBe(MockComponent1)

    // Complete first input — resume returns needs_input with MockComponent2
    actor.send({
      type: 'PIPELINE_INPUT_COMPLETE',
      result: { choice: 'redirect' },
    })

    // Should stay in pipeline_input with new component
    expect(actor.getSnapshot().matches({ playing: { night: 'pipeline_input' } })).toBeTruthy()
    expect(actor.getSnapshot().context.pipelineUI?.Component).toBe(MockComponent2)
    expect(actor.getSnapshot().context._pipelineResume).toBe(secondResumeFn)
    expect(firstResumeFn).toHaveBeenCalledWith({ choice: 'redirect' })

    // Complete second input — resume returns resolved
    actor.send({
      type: 'PIPELINE_INPUT_COMPLETE',
      result: { finalChoice: 'accept' },
    })

    // Should return to dashboard
    expect(actor.getSnapshot().matches({ playing: { night: 'dashboard' } })).toBeTruthy()
    expect(actor.getSnapshot().context.pipelineUI).toBeNull()
    expect(secondResumeFn).toHaveBeenCalledWith({ finalChoice: 'accept' })
    actor.stop()
  })

  it('returns to dashboard when no intent is present', () => {
    mockResolveIntent = null // Use real pipeline (no intent = no pipeline)

    const actor = startNightActor()

    actor.send({
      type: 'OPEN_NIGHT_ACTION',
      playerId: 'p5',
      roleId: 'imp',
    })

    actor.send({
      type: 'NIGHT_ACTION_COMPLETE',
      result: {
        entries: [
          {
            type: 'night_action' as const,
            message: [{ type: 'text' as const, content: 'Imp does nothing' }],
            data: { playerId: 'p5' },
          },
        ],
        // No intent
      },
    })

    expect(actor.getSnapshot().matches({ playing: { night: 'dashboard' } })).toBeTruthy()
    expect(actor.getSnapshot().context.pipelineUI).toBeNull()
    actor.stop()
  })

  it('transitions to pipeline_input and then prevented returns to dashboard', () => {
    const MockComponent = () => null
    const resumeFn = vi.fn<(result: unknown) => PipelineResult>().mockReturnValue({
      type: 'prevented',
      stateChanges: {
        entries: [
          {
            type: 'night_action' as const,
            message: [{ type: 'text' as const, content: 'Kill prevented' }],
            data: {},
          },
        ],
      } satisfies StateChanges,
    })

    mockResolveIntent = () => ({
      type: 'needs_input' as const,
      UIComponent: MockComponent,
      intent: { type: 'kill' as const, sourceId: 'p5', targetId: 'p1', cause: 'demon' },
      resume: resumeFn,
    })

    const actor = startNightActor()

    actor.send({
      type: 'OPEN_NIGHT_ACTION',
      playerId: 'p5',
      roleId: 'imp',
    })

    actor.send({
      type: 'NIGHT_ACTION_COMPLETE',
      result: {
        entries: [
          {
            type: 'night_action' as const,
            message: [{ type: 'text' as const, content: 'Imp tries to kill' }],
            data: { playerId: 'p5' },
          },
        ],
        intent: { type: 'kill' as const, sourceId: 'p5', targetId: 'p1', cause: 'demon' },
      },
    })

    expect(actor.getSnapshot().matches({ playing: { night: 'pipeline_input' } })).toBeTruthy()

    actor.send({
      type: 'PIPELINE_INPUT_COMPLETE',
      result: { targetId: 'p2' },
    })

    // Prevented result should still return to dashboard
    expect(actor.getSnapshot().matches({ playing: { night: 'dashboard' } })).toBeTruthy()
    expect(actor.getSnapshot().context.pipelineUI).toBeNull()
    actor.stop()
  })
})
