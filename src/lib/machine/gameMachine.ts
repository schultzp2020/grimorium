import { assign, setup } from 'xstate'

import type { DeathRevealEntry } from '../../components/screens/DeathRevealScreen'
import { checkEndOfDayWinConditions, checkWinCondition, endGame, getLastNightDeaths } from '../game'
import { getRole } from '../roles/registry'
import { saveGame } from '../storage'
import { getCurrentState, isAlive } from '../types'
import type { Game } from '../types'
import {
  applyAddEffect,
  applyDayActionResult,
  applyEndDay,
  applyFollowUpResult,
  applyMarkRoleRevealed,
  applyNightActionDirect,
  applyNomination,
  applyPipelineChangesToContext,
  applyRemoveEffect,
  applySetupActionToContext,
  applySkipNightAction,
  applyStartDay,
  applyStartNight,
  applyTransitionToNight,
  applyUpdateEffect,
  applyVote,
  autoSkipNightAction,
  processAutoSkipsOnGame,
  resolveIntentFromResult,
} from './actions'
import { hasEndOfDayWinner, hasSetupActions, isDayPhase, isGameOver, isNightPhase } from './guards'
import { type GameMachineContext, type GameMachineEvent, createInitialContext } from './types'

export const gameMachine = setup({
  types: {
    context: {} as GameMachineContext,
    events: {} as GameMachineEvent,
    input: {} as { game: Game },
  },
  guards: {
    hasSetupActions: ({ context }) => hasSetupActions(context),
    isGameOver: ({ context }) => isGameOver(context),
    hasEndOfDayWinner: ({ context }) => hasEndOfDayWinner(context),
    hasPendingDeathReveals: ({ context }) => context.deathRevealQueue.length > 0,
    hasPipelineNeedsInput: ({ context }) => context.pipelineUI !== null,
    hasRoleNightAction: ({ event }) => {
      if (event.type !== 'OPEN_NIGHT_ACTION') {
        return false
      }
      const role = getRole(event.roleId)
      return role?.NightAction !== null && role?.NightAction !== undefined
    },
    isNightPhase: ({ context }) => isNightPhase(context),
    isDayPhase: ({ context }) => isDayPhase(context),
  },
  actions: {
    persistGame: ({ context }) => {
      void saveGame(context.game)
    },
    applyEndOfDayWin: assign({
      game: ({ context }) => {
        const state = getCurrentState(context.game)
        const winner = checkEndOfDayWinConditions(state, context.game)
        if (winner) {
          return endGame(context.game, winner)
        }
        return context.game
      },
    }),

    setSetupActionTarget: assign({
      setupActionPlayerId: ({ event }) => {
        if (event.type !== 'OPEN_SETUP_ACTION') {
          return null
        }
        return event.playerId
      },
      setupActionRoleId: ({ event }) => {
        if (event.type !== 'OPEN_SETUP_ACTION') {
          return null
        }
        return event.roleId
      },
    }),
    applySetupAction: assign({
      game: ({ context, event }) => {
        if (event.type !== 'SETUP_ACTION_COMPLETE') {
          return context.game
        }
        return applySetupActionToContext(context, event.result)
      },
      setupActionPlayerId: () => null,
      setupActionRoleId: () => null,
    }),

    setShowingRole: assign({
      showingRolePlayerId: ({ event }) => {
        if (event.type !== 'REVEAL_ROLE') {
          return null
        }
        return event.playerId
      },
    }),
    markRoleRevealed: assign({
      game: ({ context }) => {
        if (!context.showingRolePlayerId) {
          return context.game
        }
        return applyMarkRoleRevealed(context, context.showingRolePlayerId)
      },
      showingRolePlayerId: () => null,
    }),

    startNight: assign({
      game: ({ context }) => applyStartNight(context),
    }),
    setNightActionTarget: assign({
      nightActionPlayerId: ({ event }) => {
        if (event.type !== 'OPEN_NIGHT_ACTION') {
          return null
        }
        return event.playerId
      },
      nightActionRoleId: ({ event }) => {
        if (event.type !== 'OPEN_NIGHT_ACTION') {
          return null
        }
        return event.roleId
      },
    }),
    autoSkipNightAction: assign({
      game: ({ context, event }) => {
        if (event.type !== 'OPEN_NIGHT_ACTION') {
          return context.game
        }
        return autoSkipNightAction(context.game, event.roleId, event.playerId)
      },
    }),
    applyNightActionDirect: assign(({ context, event }) => {
      if (event.type !== 'NIGHT_ACTION_COMPLETE') {
        return {}
      }

      const gameAfterDirect = applyNightActionDirect(context, event.result)
      const pipelineResult = resolveIntentFromResult(gameAfterDirect, event.result)

      if (!pipelineResult) {
        const state = getCurrentState(gameAfterDirect)
        const winner = checkWinCondition(state, gameAfterDirect)
        if (winner) {
          const finalGame = endGame(gameAfterDirect, winner)
          return {
            game: finalGame,
            nightActionPlayerId: null,
            nightActionRoleId: null,
            pipelineUI: null,
            _pipelineResume: null,
          }
        }
        const readyGame = processAutoSkipsOnGame(gameAfterDirect)
        return {
          game: readyGame,
          nightActionPlayerId: null,
          nightActionRoleId: null,
          pipelineUI: null,
          _pipelineResume: null,
        }
      }

      if (pipelineResult.type === 'resolved' || pipelineResult.type === 'prevented') {
        const gameAfterPipeline = applyPipelineChangesToContext(gameAfterDirect, pipelineResult.stateChanges)
        const state = getCurrentState(gameAfterPipeline)
        const winner = checkWinCondition(state, gameAfterPipeline)
        if (winner) {
          const finalGame = endGame(gameAfterPipeline, winner)
          return {
            game: finalGame,
            nightActionPlayerId: null,
            nightActionRoleId: null,
            pipelineUI: null,
            _pipelineResume: null,
          }
        }
        const readyGame = processAutoSkipsOnGame(gameAfterPipeline)
        return {
          game: readyGame,
          nightActionPlayerId: null,
          nightActionRoleId: null,
          pipelineUI: null,
          _pipelineResume: null,
        }
      }

      // Only remaining case: needs_input
      return {
        game: gameAfterDirect,
        pipelineUI: {
          Component: pipelineResult.UIComponent,
          intent: pipelineResult.intent,
          onResult: () => {},
        },
        _pipelineResume: pipelineResult.resume,
      }
    }),
    skipNightAction: assign({
      game: ({ context }) => applySkipNightAction(context),
      nightActionPlayerId: () => null,
      nightActionRoleId: () => null,
    }),
    setActiveFollowUp: assign({
      activeFollowUp: ({ event }) => {
        if (event.type !== 'OPEN_NIGHT_FOLLOW_UP') {
          return null
        }
        return event.followUp
      },
    }),
    applyNightFollowUp: assign({
      game: ({ context, event }) => {
        if (event.type !== 'NIGHT_FOLLOW_UP_COMPLETE') {
          return context.game
        }
        return applyFollowUpResult(context, event.result)
      },
      activeFollowUp: () => null,
    }),

    applyStartDay: assign(({ context }) => {
      const preState = getCurrentState(context.game)
      const newGame = applyStartDay(context)

      const newState = getCurrentState(newGame)
      const winner = checkWinCondition(newState, newGame)
      if (winner) {
        const finalGame = endGame(newGame, winner)
        return { game: finalGame }
      }

      const deaths = getLastNightDeaths(newGame)
      const deadPlayers: DeathRevealEntry[] = deaths.flatMap((id) => {
        const p = preState.players.find((pl) => pl.id === id)
        return p ? [{ playerId: p.id, playerName: p.name, roleId: p.roleId }] : []
      })

      if (deadPlayers.length > 0) {
        return {
          game: newGame,
          deathRevealQueue: deadPlayers,
          dawnDeaths: deaths,
          dawnRound: newState.round,
        }
      }

      return {
        game: newGame,
        deathRevealQueue: [],
        dawnDeaths: deaths,
        dawnRound: newState.round,
      }
    }),
    clearDeathRevealQueue: assign({
      deathRevealQueue: () => [] as DeathRevealEntry[],
    }),

    applyNomination: assign(({ context, event }) => {
      if (event.type !== 'NOMINATE') {
        return {}
      }

      const preState = getCurrentState(context.game)
      const preAliveIds = new Set(preState.players.filter(isAlive).map((p) => p.id))

      const newGame = applyNomination(context, event.nominatorId, event.nomineeId)
      const newState = getCurrentState(newGame)

      const winner = checkWinCondition(newState, newGame)
      if (winner) {
        const finalGame = endGame(newGame, winner)
        return { game: finalGame }
      }

      const postAliveIds = new Set(newState.players.filter(isAlive).map((p) => p.id))
      const deathIds = [...preAliveIds].filter((id) => !postAliveIds.has(id))

      if (deathIds.length > 0) {
        const deadPlayers: DeathRevealEntry[] = deathIds.flatMap((id) => {
          const p = newState.players.find((pl) => pl.id === id)
          return p ? [{ playerId: p.id, playerName: p.name, roleId: p.roleId }] : []
        })
        return {
          game: newGame,
          deathRevealQueue: deadPlayers,
          votingNomineeId: null,
        }
      }

      return {
        game: newGame,
        votingNomineeId: event.nomineeId,
      }
    }),
    applyVote: assign({
      game: ({ context, event }) => {
        if (event.type !== 'VOTE_COMPLETE' || !context.votingNomineeId) {
          return context.game
        }
        return applyVote(context, context.votingNomineeId, event.voteCount, event.votedIds)
      },
      votingNomineeId: () => null,
    }),
    applyEndDay: assign(({ context }) => {
      const { game: afterExecGame, deaths } = applyEndDay(context)

      const postState = getCurrentState(afterExecGame)
      const postExecWinner = checkWinCondition(postState, afterExecGame)
      if (postExecWinner) {
        const finalGame = endGame(afterExecGame, postExecWinner)
        return { game: finalGame }
      }

      if (deaths.length > 0) {
        return {
          game: afterExecGame,
          deathRevealQueue: deaths,
        }
      }

      return { game: afterExecGame }
    }),
    transitionToNight: assign({
      game: ({ context }) => applyTransitionToNight(context.game),
    }),

    setActiveDayAction: assign({
      activeDayAction: ({ event }) => {
        if (event.type !== 'OPEN_DAY_ACTION') {
          return null
        }
        return event.action
      },
    }),
    applyDayAction: assign(({ context, event }) => {
      if (event.type !== 'DAY_ACTION_COMPLETE') {
        return {}
      }

      const preState = getCurrentState(context.game)
      const preAliveIds = new Set(preState.players.filter(isAlive).map((p) => p.id))

      const newGame = applyDayActionResult(context, event.result)
      const newState = getCurrentState(newGame)

      const winner = checkWinCondition(newState, newGame)
      if (winner) {
        const finalGame = endGame(newGame, winner)
        return { game: finalGame, activeDayAction: null }
      }

      const postAliveIds = new Set(newState.players.filter(isAlive).map((p) => p.id))
      const deathIds = [...preAliveIds].filter((id) => !postAliveIds.has(id))

      if (deathIds.length > 0) {
        const deadPlayers: DeathRevealEntry[] = deathIds.flatMap((id) => {
          const p = newState.players.find((pl) => pl.id === id)
          return p ? [{ playerId: p.id, playerName: p.name, roleId: p.roleId }] : []
        })
        return {
          game: newGame,
          deathRevealQueue: deadPlayers,
          activeDayAction: null,
        }
      }

      return { game: newGame, activeDayAction: null }
    }),
    clearDayAction: assign({
      activeDayAction: () => null,
    }),

    openGrimoire: assign({
      grimoireOpen: () => true,
      grimoireIntent: ({ event }) => {
        if (event.type !== 'OPEN_GRIMOIRE') {
          return { view: 'list' as const }
        }
        return event.intent
      },
    }),
    closeGrimoire: assign({
      grimoireOpen: () => false,
    }),
    showGrimoireRoleCard: assign({
      grimoireRoleCardPlayerId: ({ event }) => {
        if (event.type !== 'SHOW_GRIMOIRE_ROLE_CARD') {
          return null
        }
        return event.playerId
      },
      grimoireOpen: () => false,
    }),
    closeGrimoireRoleCard: assign({
      grimoireRoleCardPlayerId: () => null,
    }),

    openHistory: assign({
      historyOpen: () => true,
    }),
    closeHistory: assign({
      historyOpen: () => false,
    }),

    addEffect: assign({
      game: ({ context, event }) => {
        if (event.type !== 'ADD_EFFECT') {
          return context.game
        }
        return applyAddEffect(context, event.playerId, event.effectType, event.data)
      },
    }),
    removeEffect: assign({
      game: ({ context, event }) => {
        if (event.type !== 'REMOVE_EFFECT') {
          return context.game
        }
        return applyRemoveEffect(context, event.playerId, event.effectType)
      },
    }),
    updateEffect: assign({
      game: ({ context, event }) => {
        if (event.type !== 'UPDATE_EFFECT') {
          return context.game
        }
        return applyUpdateEffect(context, event.playerId, event.effectType, event.data)
      },
    }),

    setPlayerFacing: assign({
      isPlayerFacing: ({ event }) => {
        if (event.type !== 'SET_PLAYER_FACING') {
          return false
        }
        return event.value
      },
    }),

    processPipelineInput: assign(({ context, event }) => {
      if (event.type !== 'PIPELINE_INPUT_COMPLETE' || !context._pipelineResume) {
        return {}
      }

      const resumed = context._pipelineResume(event.result)

      if (resumed.type === 'resolved' || resumed.type === 'prevented') {
        const gameAfterPipeline = applyPipelineChangesToContext(context.game, resumed.stateChanges)
        const state = getCurrentState(gameAfterPipeline)
        const winner = checkWinCondition(state, gameAfterPipeline)
        if (winner) {
          const finalGame = endGame(gameAfterPipeline, winner)
          return {
            game: finalGame,
            pipelineUI: null,
            _pipelineResume: null,
            nightActionPlayerId: null,
            nightActionRoleId: null,
          }
        }
        const readyGame = processAutoSkipsOnGame(gameAfterPipeline)
        return {
          game: readyGame,
          pipelineUI: null,
          _pipelineResume: null,
          nightActionPlayerId: null,
          nightActionRoleId: null,
        }
      }

      // Only remaining case: needs_input
      return {
        pipelineUI: {
          Component: resumed.UIComponent,
          intent: resumed.intent,
          onResult: () => {},
        },
        _pipelineResume: resumed.resume,
      }
    }),
  },
}).createMachine({
  id: 'game',
  context: ({ input }: { input: { game: Game } }) => createInitialContext(input.game),

  on: {
    OPEN_GRIMOIRE: { actions: 'openGrimoire' },
    CLOSE_GRIMOIRE: { actions: 'closeGrimoire' },
    SHOW_GRIMOIRE_ROLE_CARD: { actions: 'showGrimoireRoleCard' },
    CLOSE_GRIMOIRE_ROLE_CARD: { actions: 'closeGrimoireRoleCard' },
    OPEN_HISTORY: { actions: 'openHistory' },
    CLOSE_HISTORY: { actions: 'closeHistory' },
    ADD_EFFECT: { actions: ['addEffect', 'persistGame'] },
    REMOVE_EFFECT: { actions: ['removeEffect', 'persistGame'] },
    UPDATE_EFFECT: { actions: ['updateEffect', 'persistGame'] },
    SET_PLAYER_FACING: { actions: 'setPlayerFacing' },
  },

  initial: 'initializing',

  states: {
    initializing: {
      always: [
        { target: 'game_over', guard: 'isGameOver' },
        { target: 'playing.night.dashboard', guard: 'isNightPhase' },
        { target: 'playing.day.main', guard: 'isDayPhase' },
        { target: 'setup', guard: 'hasSetupActions' },
        { target: 'revelation' },
      ],
    },

    setup: {
      initial: 'actions_list',
      states: {
        actions_list: {
          on: {
            OPEN_SETUP_ACTION: {
              target: 'action',
              actions: 'setSetupActionTarget',
            },
            SETUP_ACTIONS_CONTINUE: {
              target: '#game.revelation',
            },
          },
        },
        action: {
          on: {
            SETUP_ACTION_COMPLETE: {
              target: 'actions_list',
              actions: ['applySetupAction', 'persistGame'],
            },
          },
        },
      },
    },

    revelation: {
      initial: 'list',
      states: {
        list: {
          on: {
            REVEAL_ROLE: {
              target: 'showing_role',
              actions: 'setShowingRole',
            },
            START_FIRST_NIGHT: {
              target: '#game.playing',
              actions: ['startNight', 'persistGame'],
            },
          },
        },
        showing_role: {
          on: {
            ROLE_REVEAL_DISMISS: {
              target: 'list',
              actions: ['markRoleRevealed', 'persistGame'],
            },
          },
        },
      },
    },

    playing: {
      initial: 'night',
      states: {
        night: {
          initial: 'dashboard',
          states: {
            dashboard: {
              on: {
                OPEN_NIGHT_ACTION: [
                  {
                    target: 'action',
                    guard: 'hasRoleNightAction',
                    actions: 'setNightActionTarget',
                  },
                  {
                    target: 'dashboard',
                    actions: ['autoSkipNightAction', 'persistGame'],
                  },
                ],
                OPEN_NIGHT_FOLLOW_UP: {
                  target: 'follow_up',
                  actions: 'setActiveFollowUp',
                },
                START_DAY: {
                  target: '#game.playing.transition_to_day',
                  actions: ['applyStartDay', 'persistGame'],
                },
              },
            },
            action: {
              on: {
                NIGHT_ACTION_COMPLETE: {
                  target: 'resolving_night_action',
                  actions: ['applyNightActionDirect', 'persistGame'],
                },
                NIGHT_ACTION_SKIP: {
                  target: 'dashboard',
                  actions: ['skipNightAction', 'persistGame'],
                },
              },
            },
            resolving_night_action: {
              always: [
                { target: '#game.game_over', guard: 'isGameOver' },
                { target: 'pipeline_input', guard: 'hasPipelineNeedsInput' },
                { target: 'dashboard' },
              ],
            },
            follow_up: {
              on: {
                NIGHT_FOLLOW_UP_COMPLETE: {
                  target: 'dashboard',
                  actions: ['applyNightFollowUp', 'persistGame'],
                },
              },
            },
            pipeline_input: {
              on: {
                PIPELINE_INPUT_COMPLETE: {
                  target: 'resolving_pipeline',
                  actions: ['processPipelineInput', 'persistGame'],
                },
              },
            },
            resolving_pipeline: {
              always: [
                { target: '#game.game_over', guard: 'isGameOver' },
                { target: 'pipeline_input', guard: 'hasPipelineNeedsInput' },
                { target: 'dashboard' },
              ],
            },
          },
        },

        transition_to_day: {
          always: [
            {
              target: '#game.game_over',
              guard: 'isGameOver',
            },
            {
              target: 'death_reveal',
              guard: 'hasPendingDeathReveals',
            },
            {
              target: 'dawn',
            },
          ],
        },

        death_reveal: {
          on: {
            DEATH_REVEAL_CONTINUE: {
              target: 'day',
              actions: 'clearDeathRevealQueue',
            },
          },
        },

        dawn: {
          on: {
            DAWN_CONTINUE: {
              target: 'day',
            },
          },
        },

        day: {
          initial: 'main',
          states: {
            main: {
              on: {
                OPEN_NOMINATION: {
                  target: 'nomination',
                },
                OPEN_DAY_ACTION: {
                  target: 'day_action',
                  actions: 'setActiveDayAction',
                },
                END_DAY: {
                  target: '#game.playing.end_of_day',
                  actions: ['applyEndDay', 'persistGame'],
                },
              },
            },
            nomination: {
              on: {
                NOMINATE: {
                  target: 'resolving_nomination',
                  actions: ['applyNomination', 'persistGame'],
                },
                BACK_FROM_NOMINATION: {
                  target: 'main',
                },
              },
            },
            resolving_nomination: {
              always: [
                { target: '#game.game_over', guard: 'isGameOver' },
                { target: '#game.playing.death_reveal', guard: 'hasPendingDeathReveals' },
                { target: 'voting' },
              ],
            },
            voting: {
              on: {
                VOTE_COMPLETE: {
                  target: 'main',
                  actions: ['applyVote', 'persistGame'],
                },
                CANCEL_VOTE: {
                  target: 'main',
                },
              },
            },
            day_action: {
              on: {
                DAY_ACTION_COMPLETE: {
                  target: 'resolving_day_action',
                  actions: ['applyDayAction', 'persistGame'],
                },
                BACK_FROM_DAY_ACTION: {
                  target: 'main',
                  actions: 'clearDayAction',
                },
              },
            },
            resolving_day_action: {
              always: [
                { target: '#game.game_over', guard: 'isGameOver' },
                { target: '#game.playing.death_reveal', guard: 'hasPendingDeathReveals' },
                { target: 'main' },
              ],
            },
          },
        },

        end_of_day: {
          always: [
            {
              target: '#game.game_over',
              guard: 'isGameOver',
            },
            {
              target: '#game.game_over',
              guard: 'hasEndOfDayWinner',
              actions: ['applyEndOfDayWin', 'persistGame'],
            },
            {
              target: 'death_reveal_to_night',
              guard: 'hasPendingDeathReveals',
              actions: ['transitionToNight', 'persistGame'],
            },
            {
              target: 'night.dashboard',
              actions: ['transitionToNight', 'persistGame'],
            },
          ],
        },

        death_reveal_to_night: {
          on: {
            DEATH_REVEAL_CONTINUE: {
              target: 'night.dashboard',
              actions: 'clearDeathRevealQueue',
            },
          },
        },
      },
    },

    game_over: {
      type: 'final',
    },
  },
})
