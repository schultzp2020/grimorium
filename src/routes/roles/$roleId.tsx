import { createFileRoute, redirect } from '@tanstack/react-router'

import { RolesLibrary } from '../../components/screens'
import { getRole } from '../../lib/roles'
import type { RoleId } from '../../lib/roles/types'

export const Route = createFileRoute('/roles/$roleId')({
  beforeLoad: ({ params }) => {
    const role = getRole(params.roleId as RoleId)
    if (!role) {
      throw redirect({ to: '/roles' })
    }
  },
  component: RoleDetailPage,
})

function RoleDetailPage() {
  const { roleId } = Route.useParams()
  return <RolesLibrary selectedRoleId={roleId as RoleId} />
}
