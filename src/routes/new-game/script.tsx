import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { ScriptSelection } from '../../components/screens'
import { getWizardState, setWizardState } from '../../lib/wizardState'

export const Route = createFileRoute('/new-game/script')({
  beforeLoad: () => {
    const { players } = getWizardState()
    if (!players || players.length < 5) {
      throw redirect({ to: '/new-game/players' })
    }
    return { players }
  },
  component: ScriptPage,
})

function ScriptPage() {
  const { players } = Route.useRouteContext()
  const navigate = useNavigate()

  return (
    <ScriptSelection
      players={players}
      onSelect={(scriptId) => {
        setWizardState({ scriptId })
        void navigate({ to: '/new-game/roles', replace: true })
      }}
      onBack={() => void navigate({ to: '/new-game/players' })}
    />
  )
}
