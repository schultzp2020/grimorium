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
import { saveGame } from '../storage'
import { type Game, type GameState, getCurrentState, isAlive } from '../types'
import type { GameMachineContext } from './types'

function persist(game: Game): Game {
  saveGame(game)
  return game
}

export function applySetupActionToContext(ctx: GameMachineContext, result: SetupActionResult): Game {
  const playerId = ctx.setupActionPlayerId
  if (!playerId) {
    return ctx.game
  }
  const newGame = applySetupAction(ctx.game, playerId, result)
  return persist(newGame)
}

export function applyMarkRoleRevealed(ctx: GameMachineContext, playerId: string): Game {
  const newGame = markRoleRevealed(ctx.game, playerId)
  return persist(newGame)
}

export function applyStartNight(ctx: GameMachineContext): Game {
  const nightGame = startNight(ctx.game)
  const readyGame = processAutoSkips(nightGame)
  return persist(readyGame)
}

export function applyNightActionDirect(ctx: GameMachineContext, result: NightActionResult): Game {
  const newGame = applyNightAction(ctx.game, result)
  return persist(newGame)
}

export function applySkipNightAction(ctx: GameMachineContext): Game {
  const { nightActionRoleId, nightActionPlayerId } = ctx
  if (!nightActionRoleId || !nightActionPlayerId) {
    return ctx.game
  }
  const newGame = skipNightAction(ctx.game, nightActionRoleId, nightActionPlayerId)
  const readyGame = processAutoSkips(newGame)
  return persist(readyGame)
}

export function autoSkipNightAction(game: Game, roleId: string, playerId: string): Game {
  const newGame = skipNightAction(game, roleId, playerId)
  const readyGame = processAutoSkips(newGame)
  return persist(readyGame)
}

export function processAutoSkipsOnGame(game: Game): Game {
  const readyGame = processAutoSkips(game)
  return persist(readyGame)
}

export function resolveIntentFromResult(game: Game, result: NightActionResult): PipelineResult | null {
  if (!result.intent) {
    return null
  }
  const state = getCurrentState(game)
  return resolveIntent(result.intent, state, game)
}

export function applyPipelineChangesToContext(game: Game, stateChanges: StateChanges): Game {
  const newGame = applyPipelineChanges(game, stateChanges)
  return persist(newGame)
}

export function applyStartDay(ctx: GameMachineContext): Game {
  const newGame = startDay(ctx.game)
  return persist(newGame)
}

export function applyNomination(ctx: GameMachineContext, nominatorId: string, nomineeId: string): Game {
  const newGame = nominate(ctx.game, nominatorId, nomineeId)
  return persist(newGame)
}

export function applyVote(ctx: GameMachineContext, nomineeId: string, voteCount: number, votedIds?: string[]): Game {
  const newGame = resolveVote(ctx.game, nomineeId, voteCount, votedIds)
  return persist(newGame)
}

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
  const newGame = addEffectToPlayer(ctx.game, playerId, effectType, data)
  return persist(newGame)
}

export function applyRemoveEffect(ctx: GameMachineContext, playerId: string, effectType: string): Game {
  const newGame = removeEffectFromPlayer(ctx.game, playerId, effectType)
  return persist(newGame)
}

export function applyUpdateEffect(
  ctx: GameMachineContext,
  playerId: string,
  effectType: string,
  data: Record<string, unknown>,
): Game {
  const newGame = updateEffectData(ctx.game, playerId, effectType, data)
  return persist(newGame)
}

export function applyFollowUpResult(ctx: GameMachineContext, result: NightFollowUpResult): Game {
  const changes: StateChanges = {
    entries: result.entries,
    addEffects: result.addEffects,
    removeEffects: result.removeEffects,
  }
  const newGame = applyPipelineChanges(ctx.game, changes)
  return persist(newGame)
}

export function applyDayActionResult(ctx: GameMachineContext, result: DayActionResult): Game {
  const changes: StateChanges = {
    entries: result.entries,
    addEffects: result.addEffects,
    removeEffects: result.removeEffects,
  }
  const newGame = applyPipelineChanges(ctx.game, changes)
  return persist(newGame)
}
