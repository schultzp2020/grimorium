import { createFileRoute } from '@tanstack/react-router'

import { RolesLibrary } from '../../components/screens'

export const Route = createFileRoute('/roles/')({
  component: () => <RolesLibrary />,
})
