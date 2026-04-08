import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { GameScreen } from '../../components/screens'
import { clearCurrentGame, getGame, setCurrentGameId } from '../../lib/storage'

export const Route = createFileRoute('/game/$gameId')({
  beforeLoad: ({ params }) => {
    const game = getGame(params.gameId)
    if (!game) {
      throw redirect({ to: '/' })
    }
    return { hideLanguagePicker: true, game }
  },
  component: GamePage,
})

function GamePage() {
  const { gameId } = Route.useParams()
  const { game } = Route.useRouteContext()
  const navigate = useNavigate()

  useEffect(() => {
    setCurrentGameId(gameId)
  }, [gameId])

  return (
    <GameScreen
      key={gameId}
      initialGame={game}
      onMainMenu={() => {
        clearCurrentGame()
        void navigate({ to: '/' })
      }}
    />
  )
}
