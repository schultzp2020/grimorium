import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { PlayerEntry } from '../../components/screens'
import { clearWizardState, setWizardState } from '../../lib/wizardState'

export const Route = createFileRoute('/new-game/players')({
  component: PlayersPage,
})

function PlayersPage() {
  const navigate = useNavigate()

  return (
    <PlayerEntry
      onNext={(players) => {
        clearWizardState()
        setWizardState({ players })
        void navigate({ to: '/new-game/script' })
      }}
      onBack={() => void navigate({ to: '/' })}
    />
  )
}
