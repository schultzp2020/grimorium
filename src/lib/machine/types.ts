import type { FC } from 'react'

import type { GrimoireIntent } from '../../components/items/GrimoireModal'
import type { DeathRevealEntry } from '../../components/screens/DeathRevealScreen'
import type {
  AvailableDayAction,
  AvailableNightFollowUp,
  DayActionResult,
  Intent,
  NightFollowUpResult,
  PipelineInputProps,
  PipelineResult,
} from '../pipeline/types'
import type { NightActionResult, SetupActionResult } from '../roles/types'
import type { Game } from '../types'

export interface GameMachineContext {
  game: Game

  nightActionPlayerId: string | null
  nightActionRoleId: string | null
  activeFollowUp: AvailableNightFollowUp | null

  votingNomineeId: string | null
  activeDayAction: AvailableDayAction | null

  setupActionPlayerId: string | null
  setupActionRoleId: string | null
  showingRolePlayerId: string | null

  deathRevealQueue: DeathRevealEntry[]

  pipelineUI: {
    Component: FC<PipelineInputProps>
    intent: Intent
    onResult: (result: unknown) => void
  } | null

  grimoireIntent: GrimoireIntent
  grimoireOpen: boolean
  grimoireRoleCardPlayerId: string | null
  historyOpen: boolean

  /** When true, floating buttons are hidden (player is looking at screen) */
  isPlayerFacing: boolean

  dawnDeaths: string[]
  dawnRound: number

  /** Non-serializable closure for pipeline resume — acceptable because we never persist machine state */
  _pipelineResume: ((result: unknown) => PipelineResult) | null
}

export type GameMachineEvent =
  | { type: 'OPEN_SETUP_ACTION'; playerId: string; roleId: string }
  | { type: 'SETUP_ACTION_COMPLETE'; result: SetupActionResult }
  | { type: 'SETUP_ACTIONS_CONTINUE' }
  | { type: 'REVEAL_ROLE'; playerId: string }
  | { type: 'ROLE_REVEAL_DISMISS' }
  | { type: 'START_FIRST_NIGHT' }
  | { type: 'OPEN_NIGHT_ACTION'; playerId: string; roleId: string }
  | { type: 'NIGHT_ACTION_COMPLETE'; result: NightActionResult }
  | { type: 'NIGHT_ACTION_SKIP' }
  | { type: 'OPEN_NIGHT_FOLLOW_UP'; followUp: AvailableNightFollowUp }
  | { type: 'NIGHT_FOLLOW_UP_COMPLETE'; result: NightFollowUpResult }
  | { type: 'START_DAY' }
  | { type: 'DAWN_CONTINUE' }
  | { type: 'OPEN_NOMINATION' }
  | { type: 'NOMINATE'; nominatorId: string; nomineeId: string }
  | { type: 'VOTE_COMPLETE'; voteCount: number; votedIds?: string[] }
  | { type: 'CANCEL_VOTE' }
  | { type: 'BACK_FROM_NOMINATION' }
  | { type: 'OPEN_DAY_ACTION'; action: AvailableDayAction }
  | { type: 'DAY_ACTION_COMPLETE'; result: DayActionResult }
  | { type: 'BACK_FROM_DAY_ACTION' }
  | { type: 'END_DAY' }
  | { type: 'DEATH_REVEAL_CONTINUE' }
  | { type: 'PIPELINE_INPUT_COMPLETE'; result: unknown }
  | { type: 'OPEN_GRIMOIRE'; intent: GrimoireIntent }
  | { type: 'CLOSE_GRIMOIRE' }
  | { type: 'SHOW_GRIMOIRE_ROLE_CARD'; playerId: string }
  | { type: 'CLOSE_GRIMOIRE_ROLE_CARD' }
  | { type: 'OPEN_HISTORY' }
  | { type: 'CLOSE_HISTORY' }
  | { type: 'ADD_EFFECT'; playerId: string; effectType: string; data?: Record<string, unknown> }
  | { type: 'REMOVE_EFFECT'; playerId: string; effectType: string }
  | { type: 'UPDATE_EFFECT'; playerId: string; effectType: string; data: Record<string, unknown> }
  | { type: 'SET_PLAYER_FACING'; value: boolean }

export function createInitialContext(game: Game): GameMachineContext {
  return {
    game,
    nightActionPlayerId: null,
    nightActionRoleId: null,
    activeFollowUp: null,
    votingNomineeId: null,
    activeDayAction: null,
    setupActionPlayerId: null,
    setupActionRoleId: null,
    showingRolePlayerId: null,
    deathRevealQueue: [],
    pipelineUI: null,
    grimoireIntent: { view: 'list' },
    grimoireOpen: false,
    grimoireRoleCardPlayerId: null,
    historyOpen: false,
    isPlayerFacing: false,
    dawnDeaths: [],
    dawnRound: 0,
    _pipelineResume: null,
  }
}
