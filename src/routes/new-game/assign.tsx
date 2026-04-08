import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { RoleAssignment } from '../../components/screens'
import { type PlayerSetup, createGame } from '../../lib/game'
import { saveGame, setCurrentGameId } from '../../lib/storage'
import { clearWizardState, getWizardState } from '../../lib/wizardState'

export const Route = createFileRoute('/new-game/assign')({
  beforeLoad: () => {
    const { players, scriptId, selectedRoles } = getWizardState()
    if (!players || players.length < 5 || !scriptId || !selectedRoles || selectedRoles.length === 0) {
      throw redirect({ to: '/new-game/players' })
    }
    return { players, scriptId, selectedRoles }
  },
  component: AssignPage,
})

function AssignPage() {
  const { players, scriptId, selectedRoles } = Route.useRouteContext()
  const navigate = useNavigate()

  const handleStart = (assignments: { name: string; roleId: string }[]) => {
    const playerSetups: PlayerSetup[] = assignments.map((a) => ({
      name: a.name,
      roleId: a.roleId,
    }))
    const gameName = `Game ${new Date().toLocaleDateString()}`
    const game = createGame(gameName, scriptId, playerSetups)
    saveGame(game)
    setCurrentGameId(game.id)
    clearWizardState()
    void navigate({ to: '/game/$gameId', params: { gameId: game.id }, replace: true })
  }

  return (
    <RoleAssignment
      players={players}
      selectedRoles={selectedRoles}
      onStart={handleStart}
      onBack={() => void navigate({ to: '/new-game/roles' })}
    />
  )
}
