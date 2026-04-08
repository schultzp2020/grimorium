import { checkEndOfDayWinConditions, checkWinCondition } from '../game'
import { getRole } from '../roles/registry'
import { getCurrentState } from '../types'
import type { GameMachineContext } from './types'

export function hasSetupActions(ctx: GameMachineContext): boolean {
  const state = getCurrentState(ctx.game)
  const completedSetupPlayerIds = new Set(
    ctx.game.history.filter((e) => e.type === 'setup_action').map((e) => e.data.playerId as string),
  )

  return state.players.some((p) => {
    if (completedSetupPlayerIds.has(p.id)) {
      return false
    }
    const role = getRole(p.roleId)
    return role?.SetupAction !== undefined
  })
}

export function isGameOver(ctx: GameMachineContext): boolean {
  const state = getCurrentState(ctx.game)
  if (state.phase === 'ended') {
    return true
  }
  if (state.phase === 'setup') {
    return false
  }
  const winner = checkWinCondition(state, ctx.game)
  return winner !== null
}

export function isGameOverAfterExecution(ctx: GameMachineContext): boolean {
  return isGameOver(ctx)
}

export function hasEndOfDayWinner(ctx: GameMachineContext): boolean {
  const state = getCurrentState(ctx.game)
  const winner = checkEndOfDayWinConditions(state, ctx.game)
  return winner !== null
}

export function hasPendingDeathReveals(ctx: GameMachineContext): boolean {
  return ctx.deathRevealQueue.length > 0
}

export function hasPipelineNeedsInput(ctx: GameMachineContext): boolean {
  return ctx.pipelineUI !== null
}

export function hasDeathsAfterNomination(ctx: GameMachineContext, preNominationAliveIds: Set<string>): boolean {
  const state = getCurrentState(ctx.game)
  const postAliveIds = new Set(state.players.filter((p) => !p.effects.some((e) => e.type === 'dead')).map((p) => p.id))
  for (const id of preNominationAliveIds) {
    if (!postAliveIds.has(id)) {
      return true
    }
  }
  return false
}

export function hasDeathsAfterDayAction(ctx: GameMachineContext, preActionAliveIds: Set<string>): boolean {
  return hasDeathsAfterNomination(ctx, preActionAliveIds)
}
