import { checkWinCondition } from '../game'
import { getRole } from '../roles/registry'
import { type Game, getCurrentState } from '../types'

/**
 * Maps a loaded game's event-sourced state to the correct XState initial state.
 *
 * Mid-action state is intentionally not restored -- night/day action components
 * have ephemeral local state that can't be serialized. Narrator always returns
 * to the appropriate dashboard.
 */
export function getInitialMachineState(game: Game): string {
  const state = getCurrentState(game)

  if (state.phase === 'ended') {
    return 'game_over'
  }

  if (state.phase !== 'setup') {
    const winner = checkWinCondition(state, game)
    if (winner) {
      return 'game_over'
    }
  }

  switch (state.phase) {
    case 'setup': {
      const completedSetupPlayerIds = new Set(
        game.history.filter((e) => e.type === 'setup_action').map((e) => e.data.playerId as string),
      )

      const hasSetup = state.players.some((p) => {
        if (completedSetupPlayerIds.has(p.id)) {
          return false
        }
        const role = getRole(p.roleId)
        return role?.SetupAction !== undefined
      })

      return hasSetup ? 'setup' : 'revelation'
    }

    case 'night':
      return 'playing.night.dashboard'

    case 'day':
      return 'playing.day.main'

    // `voting` is ephemeral — it only exists within a day's nomination flow
    // and cannot be serialized/restored, so we fall through to `day.main`
    default:
      return 'playing.day.main'
  }
}
