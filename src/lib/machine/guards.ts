import { checkEndOfDayWinConditions, checkWinCondition } from '../game'
import { getRole } from '../roles/registry'
import { type Phase, getCurrentState } from '../types'
import type { GameMachineContext } from './types'

function getPhase(ctx: GameMachineContext): Phase {
  return getCurrentState(ctx.game).phase
}

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

export function hasEndOfDayWinner(ctx: GameMachineContext): boolean {
  const state = getCurrentState(ctx.game)
  const winner = checkEndOfDayWinConditions(state, ctx.game)
  return winner !== null
}

export function isNightPhase(ctx: GameMachineContext): boolean {
  return getPhase(ctx) === 'night'
}

export function isDayPhase(ctx: GameMachineContext): boolean {
  return getPhase(ctx) === 'day'
}
