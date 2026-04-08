import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { RoleSelection } from '../../components/screens'
import type { ScriptId } from '../../lib/scripts'
import { getWizardState, setWizardState } from '../../lib/wizardState'

export const Route = createFileRoute('/new-game/roles')({
  beforeLoad: () => {
    const { players, scriptId } = getWizardState()
    if (!players || players.length < 5 || !scriptId) {
      throw redirect({ to: '/new-game/players' })
    }
  },
  component: RolesPage,
})

function RolesPage() {
  const { players, scriptId } = getWizardState()
  const navigate = useNavigate()

  return (
    <RoleSelection
      players={players!}
      scriptId={scriptId as ScriptId}
      onNext={(selectedRoles) => {
        setWizardState({ selectedRoles })
        void navigate({ to: '/new-game/assign' })
      }}
      onBack={() => void navigate({ to: '/new-game/script' })}
    />
  )
}
