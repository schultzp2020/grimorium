import { useMachine } from '@xstate/react'
import { useMemo } from 'react'

import {
  getBlockStatus,
  getLastNightDeaths,
  getNominatorsToday,
  getNomineesToday,
  hasVirginExecutionToday,
} from '../../lib/game'
import { useI18n } from '../../lib/i18n'
import { gameMachine } from '../../lib/machine'
import { getAvailableDayActions } from '../../lib/pipeline'
import { getRole } from '../../lib/roles/registry'
import { getTeam } from '../../lib/teams'
import { type Game, getCurrentState, getPlayer } from '../../lib/types'
import { Icon, LanguagePicker } from '../atoms'
import { PlayerFacingContext } from '../context/PlayerFacingContext'
import { GrimoireModal } from '../items/GrimoireModal'
import { RoleCard } from '../items/RoleCard'
import { CardLink, TeamBackground } from '../items/TeamBackground'
import { PlayerFacingScreen } from '../layouts/PlayerFacingScreen'
import { DawnScreen } from './DawnScreen'
import { DayPhase } from './DayPhase'
import { DeathRevealScreen } from './DeathRevealScreen'
import { GameOver } from './GameOver'
import { HistoryView } from './HistoryView'
import { NightDashboard } from './NightDashboard'
import { NominationScreen } from './NominationScreen'
import { RoleRevelationScreen } from './RoleRevelationScreen'
import { SetupActionsScreen } from './SetupActionsScreen'
import { VotingPhase } from './VotingPhase'

interface Props {
  initialGame: Game
  onMainMenu: () => void
}

export function GameScreen({ initialGame, onMainMenu }: Props) {
  const { t } = useI18n()

  const [snapshot, send] = useMachine(gameMachine, {
    input: { game: initialGame },
  })

  const { context } = snapshot
  const { game } = context
  const state = getCurrentState(game)

  const playerFacingCtx = useMemo(
    () => ({
      setPlayerFacing: (value: boolean) => send({ type: 'SET_PLAYER_FACING', value }),
    }),
    [send],
  )

  if (context.historyOpen) {
    return (
      <div className='relative'>
        <HistoryView game={game} onClose={() => send({ type: 'CLOSE_HISTORY' })} />
        <div className='fixed top-4 right-4 z-50'>
          <LanguagePicker variant='floating' />
        </div>
      </div>
    )
  }

  if (context.grimoireRoleCardPlayerId) {
    const player = getPlayer(state, context.grimoireRoleCardPlayerId)
    if (player) {
      const cardRole = getRole(player.roleId)
      const cardTeamId = cardRole?.team ?? 'townsfolk'
      const cardTeam = getTeam(cardTeamId)
      return (
        <TeamBackground teamId={cardTeamId}>
          <RoleCard roleId={player.roleId} />
          <CardLink onClick={() => send({ type: 'CLOSE_GRIMOIRE_ROLE_CARD' })} isEvil={cardTeam.isEvil}>
            {t.common.back}
          </CardLink>
        </TeamBackground>
      )
    }
  }

  const renderScreen = () => {
    if (snapshot.matches({ setup: 'actions_list' })) {
      return (
        <SetupActionsScreen
          game={game}
          state={state}
          onOpenSetupAction={(playerId, roleId) => send({ type: 'OPEN_SETUP_ACTION', playerId, roleId })}
          onContinue={() => send({ type: 'SETUP_ACTIONS_CONTINUE' })}
          onShowRoleCard={(player) => send({ type: 'SHOW_GRIMOIRE_ROLE_CARD', playerId: player.id })}
          onEditEffects={(player) =>
            send({
              type: 'OPEN_GRIMOIRE',
              intent: { view: 'edit_effects', player },
            })
          }
        />
      )
    }

    if (snapshot.matches({ setup: 'action' })) {
      const setupPlayer = context.setupActionPlayerId ? getPlayer(state, context.setupActionPlayerId) : null
      const setupRole = context.setupActionRoleId ? getRole(context.setupActionRoleId) : null
      if (!setupPlayer || !setupRole?.SetupAction) return null

      return (
        <setupRole.SetupAction
          player={setupPlayer}
          state={state}
          onComplete={(result) => send({ type: 'SETUP_ACTION_COMPLETE', result })}
        />
      )
    }

    if (snapshot.matches({ revelation: 'list' })) {
      return (
        <RoleRevelationScreen
          game={game}
          state={state}
          onRevealRole={(playerId) => send({ type: 'REVEAL_ROLE', playerId })}
          onStartNight={() => send({ type: 'START_FIRST_NIGHT' })}
          onMainMenu={onMainMenu}
        />
      )
    }

    if (snapshot.matches({ revelation: 'showing_role' })) {
      const player = context.showingRolePlayerId ? getPlayer(state, context.showingRolePlayerId) : null
      if (!player) return null
      const role = getRole(player.roleId)
      if (!role) return null

      return (
        <PlayerFacingScreen playerName={player.name}>
          <role.RoleReveal player={player} onContinue={() => send({ type: 'ROLE_REVEAL_DISMISS' })} />
        </PlayerFacingScreen>
      )
    }

    if (snapshot.matches({ playing: { night: 'dashboard' } })) {
      return (
        <NightDashboard
          game={game}
          state={state}
          onOpenNightAction={(playerId, roleId) => send({ type: 'OPEN_NIGHT_ACTION', playerId, roleId })}
          onOpenNightFollowUp={(followUp) => send({ type: 'OPEN_NIGHT_FOLLOW_UP', followUp })}
          onStartDay={() => send({ type: 'START_DAY' })}
          onMainMenu={onMainMenu}
          onShowRoleCard={(player) => send({ type: 'SHOW_GRIMOIRE_ROLE_CARD', playerId: player.id })}
          onEditEffects={(player) =>
            send({
              type: 'OPEN_GRIMOIRE',
              intent: { view: 'edit_effects', player },
            })
          }
          onOpenGrimoirePlayer={(player) =>
            send({
              type: 'OPEN_GRIMOIRE',
              intent: { view: 'player_detail', player },
            })
          }
        />
      )
    }

    if (snapshot.matches({ playing: { night: 'action' } })) {
      const player = context.nightActionPlayerId ? getPlayer(state, context.nightActionPlayerId) : null
      const role = context.nightActionRoleId ? getRole(context.nightActionRoleId) : null
      if (!player || !role?.NightAction) return null

      return (
        <role.NightAction
          game={game}
          state={state}
          player={player}
          onComplete={(result) => send({ type: 'NIGHT_ACTION_COMPLETE', result })}
          onOpenGrimoire={(intent, readOnly) =>
            send({
              type: 'OPEN_GRIMOIRE',
              intent: { ...intent, readOnly },
            })
          }
        />
      )
    }

    if (snapshot.matches({ playing: { night: 'follow_up' } })) {
      const followUp = context.activeFollowUp
      if (!followUp) return null
      const FollowUpComponent = followUp.ActionComponent
      return (
        <FollowUpComponent
          state={state}
          game={game}
          playerId={followUp.playerId}
          onComplete={(result) => send({ type: 'NIGHT_FOLLOW_UP_COMPLETE', result })}
        />
      )
    }

    if (snapshot.matches({ playing: { night: 'pipeline_input' } })) {
      if (!context.pipelineUI) return null
      const PipelineComponent = context.pipelineUI.Component
      return (
        <PipelineComponent
          state={state}
          intent={context.pipelineUI.intent}
          onComplete={(result) => send({ type: 'PIPELINE_INPUT_COMPLETE', result })}
        />
      )
    }

    if (snapshot.matches({ playing: 'death_reveal' }) || snapshot.matches({ playing: 'death_reveal_to_night' })) {
      return (
        <DeathRevealScreen
          deaths={context.deathRevealQueue}
          onContinue={() => send({ type: 'DEATH_REVEAL_CONTINUE' })}
        />
      )
    }

    if (snapshot.matches({ playing: 'dawn' })) {
      return (
        <DawnScreen
          state={state}
          deaths={context.dawnDeaths}
          round={context.dawnRound}
          onContinue={() => send({ type: 'DAWN_CONTINUE' })}
        />
      )
    }

    if (snapshot.matches({ playing: { day: 'main' } })) {
      const dayActions = getAvailableDayActions(state, t)
      const deaths = getLastNightDeaths(game)

      return (
        <DayPhase
          state={state}
          blockStatus={getBlockStatus(game)}
          dayActions={dayActions}
          nightSummary={{
            deaths,
            round: state.round - 1 || state.round,
          }}
          nominationsBlocked={hasVirginExecutionToday(game)}
          onNominate={() => send({ type: 'OPEN_NOMINATION' })}
          onDayAction={(action) => send({ type: 'OPEN_DAY_ACTION', action })}
          onEndDay={() => send({ type: 'END_DAY' })}
          onMainMenu={onMainMenu}
          onShowRoleCard={(player) => send({ type: 'SHOW_GRIMOIRE_ROLE_CARD', playerId: player.id })}
          onEditEffects={(player) =>
            send({
              type: 'OPEN_GRIMOIRE',
              intent: { view: 'edit_effects', player },
            })
          }
          onOpenGrimoirePlayer={(player) =>
            send({
              type: 'OPEN_GRIMOIRE',
              intent: { view: 'player_detail', player },
            })
          }
        />
      )
    }

    if (snapshot.matches({ playing: { day: 'nomination' } })) {
      return (
        <NominationScreen
          state={state}
          nominatorsToday={getNominatorsToday(game)}
          nomineesToday={getNomineesToday(game)}
          onNominate={(nominatorId, nomineeId) => send({ type: 'NOMINATE', nominatorId, nomineeId })}
          onBack={() => send({ type: 'BACK_FROM_NOMINATION' })}
        />
      )
    }

    if (snapshot.matches({ playing: { day: 'voting' } })) {
      if (!context.votingNomineeId) return null
      return (
        <VotingPhase
          state={state}
          nomineeId={context.votingNomineeId}
          blockStatus={getBlockStatus(game)}
          onVoteComplete={(voteCount, votedIds) => send({ type: 'VOTE_COMPLETE', voteCount, votedIds })}
          onCancel={() => send({ type: 'CANCEL_VOTE' })}
        />
      )
    }

    if (snapshot.matches({ playing: { day: 'day_action' } })) {
      if (!context.activeDayAction) return null
      const { ActionComponent } = context.activeDayAction
      return (
        <ActionComponent
          state={state}
          playerId={context.activeDayAction.playerId}
          onComplete={(result) => send({ type: 'DAY_ACTION_COMPLETE', result })}
          onBack={() => send({ type: 'BACK_FROM_DAY_ACTION' })}
        />
      )
    }

    if (snapshot.matches('game_over')) {
      return <GameOver state={state} onMainMenu={onMainMenu} onShowHistory={() => send({ type: 'OPEN_HISTORY' })} />
    }

    return null
  }

  const showFloatingButtons =
    !snapshot.matches('game_over') && !context.grimoireRoleCardPlayerId && !context.isPlayerFacing

  return (
    <div className='relative'>
      <PlayerFacingContext.Provider value={playerFacingCtx}>{renderScreen()}</PlayerFacingContext.Provider>

      <div className='fixed top-4 right-4 z-50'>
        <LanguagePicker variant='floating' />
      </div>

      {showFloatingButtons && (
        <div className='fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-2'>
          <button
            type='button'
            onClick={() =>
              send({
                type: 'OPEN_GRIMOIRE',
                intent: { view: 'list' },
              })
            }
            className='flex h-12 w-12 items-center justify-center rounded-full border border-mystic-gold/30 bg-grimoire-dark/90 text-mystic-gold shadow-lg transition-colors hover:border-mystic-gold/50 hover:bg-grimoire-dark'
            title={t.game.grimoire}
          >
            <Icon name='bookUser' size='md' />
          </button>

          <button
            type='button'
            onClick={() => send({ type: 'OPEN_HISTORY' })}
            className='flex h-12 w-12 items-center justify-center rounded-full border border-parchment-500/30 bg-grimoire-dark/90 text-parchment-400 shadow-lg transition-colors hover:border-parchment-400/50 hover:bg-grimoire-dark hover:text-parchment-300'
            title={t.common.history}
          >
            <Icon name='history' size='md' />
          </button>
        </div>
      )}

      <GrimoireModal
        state={state}
        open={context.grimoireOpen}
        onClose={() => send({ type: 'CLOSE_GRIMOIRE' })}
        intent={context.grimoireIntent}
        onShowRoleCard={(player) => send({ type: 'SHOW_GRIMOIRE_ROLE_CARD', playerId: player.id })}
        onAddEffect={(playerId, effectType, data) => send({ type: 'ADD_EFFECT', playerId, effectType, data })}
        onRemoveEffect={(playerId, effectType) => send({ type: 'REMOVE_EFFECT', playerId, effectType })}
        onUpdateEffect={(playerId, effectType, data) => send({ type: 'UPDATE_EFFECT', playerId, effectType, data })}
      />
    </div>
  )
}
