import type { DeathRevealEntry } from '../../components/screens/DeathRevealScreen'
import {
  addEffectToPlayer,
  applyNightAction,
  applySetupAction,
  executeAtEndOfDay,
  markRoleRevealed,
  nominate,
  processAutoSkips,
  removeEffectFromPlayer,
  resolveVote,
  skipNightAction,
  startDay,
  startNight,
  updateEffectData,
} from '../game'
import { applyPipelineChanges, resolveIntent } from '../pipeline'
import type { DayActionResult, NightFollowUpResult, PipelineResult, StateChanges } from '../pipeline/types'
import type { NightActionResult, SetupActionResult } from '../roles/types'
import { type Game, type GameState, getCurrentState, isAlive } from '../types'
import type { GameMachineContext } from './types'

export function applySetupActionToContext(ctx: GameMachineContext, result: SetupActionResult): Game {
  const playerId = ctx.setupActionPlayerId
  if (!playerId) {
    return ctx.game
  }
  return applySetupAction(ctx.game, playerId, result)
}

export function applyMarkRoleRevealed(ctx: GameMachineContext, playerId: string): Game {
  return markRoleRevealed(ctx.game, playerId)
}

export function applyStartNight(ctx: GameMachineContext): Game {
  const nightGame = startNight(ctx.game)
  return processAutoSkips(nightGame)
}

export function applyNightActionDirect(ctx: GameMachineContext, result: NightActionResult): Game {
  return applyNightAction(ctx.game, result)
}

export function applySkipNightAction(ctx: GameMachineContext): Game {
  const { nightActionRoleId, nightActionPlayerId } = ctx
  if (!nightActionRoleId || !nightActionPlayerId) {
    return ctx.game
  }
  const newGame = skipNightAction(ctx.game, nightActionRoleId, nightActionPlayerId)
  return processAutoSkips(newGame)
}

export function autoSkipNightAction(game: Game, roleId: string, playerId: string): Game {
  const newGame = skipNightAction(game, roleId, playerId)
  return processAutoSkips(newGame)
}

export function processAutoSkipsOnGame(game: Game): Game {
  return processAutoSkips(game)
}

export function resolveIntentFromResult(game: Game, result: NightActionResult): PipelineResult | null {
  if (!result.intent) {
    return null
  }
  const state = getCurrentState(game)
  return resolveIntent(result.intent, state, game)
}

export function applyPipelineChangesToContext(game: Game, stateChanges: StateChanges): Game {
  return applyPipelineChanges(game, stateChanges)
}

export function applyStartDay(ctx: GameMachineContext): Game {
  return startDay(ctx.game)
}

export function applyNomination(ctx: GameMachineContext, nominatorId: string, nomineeId: string): Game {
  return nominate(ctx.game, nominatorId, nomineeId)
}

export function applyVote(ctx: GameMachineContext, nomineeId: string, voteCount: number, votedIds?: string[]): Game {
  return resolveVote(ctx.game, nomineeId, voteCount, votedIds)
}

/**
 * Executes whoever is on the block, computes deaths, but does NOT transition
 * to night. The caller (gameMachine) must check end-of-day win conditions
 * while still in day phase, then call startNight separately.
 */
export function applyEndDay(ctx: GameMachineContext): {
  game: Game
  deaths: DeathRevealEntry[]
} {
  const state = getCurrentState(ctx.game)
  const preExecAliveIds = new Set(state.players.filter(isAlive).map((p) => p.id))

  const afterExec = executeAtEndOfDay(ctx.game)
  const postState = getCurrentState(afterExec)

  const deaths = computeDeathRevealQueue(preExecAliveIds, postState)

  return { game: afterExec, deaths }
}

export function applyTransitionToNight(game: Game): Game {
  const nightGame = startNight(game)
  return processAutoSkips(nightGame)
}

export function computeDeathRevealQueue(preAliveIds: Set<string>, postState: GameState): DeathRevealEntry[] {
  const deaths: DeathRevealEntry[] = []
  for (const id of preAliveIds) {
    const player = postState.players.find((p) => p.id === id)
    if (player && !isAlive(player)) {
      deaths.push({
        playerId: player.id,
        playerName: player.name,
        roleId: player.roleId,
      })
    }
  }
  return deaths
}

export function applyAddEffect(
  ctx: GameMachineContext,
  playerId: string,
  effectType: string,
  data?: Record<string, unknown>,
): Game {
  return addEffectToPlayer(ctx.game, playerId, effectType, data)
}

export function applyRemoveEffect(ctx: GameMachineContext, playerId: string, effectType: string): Game {
  return removeEffectFromPlayer(ctx.game, playerId, effectType)
}

export function applyUpdateEffect(
  ctx: GameMachineContext,
  playerId: string,
  effectType: string,
  data: Record<string, unknown>,
): Game {
  return updateEffectData(ctx.game, playerId, effectType, data)
}

export function applyFollowUpResult(ctx: GameMachineContext, result: NightFollowUpResult): Game {
  const changes: StateChanges = {
    entries: result.entries,
    addEffects: result.addEffects,
    removeEffects: result.removeEffects,
  }
  return applyPipelineChanges(ctx.game, changes)
}

export function applyDayActionResult(ctx: GameMachineContext, result: DayActionResult): Game {
  const changes: StateChanges = {
    entries: result.entries,
    addEffects: result.addEffects,
    removeEffects: result.removeEffects,
  }
  return applyPipelineChanges(ctx.game, changes)
}
