import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '../lib/i18n'
import { routeTree } from '../routeTree.gen'

async function renderRoute(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: {},
  })
  await router.load()
  return {
    router,
    ...render(
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>,
    ),
  }
}

describe('Roles Routes', () => {
  it('/roles renders the RolesLibrary', async () => {
    await renderRoute('/roles')
    const matches = await screen.findAllByText(/townsfolk/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('/roles/$roleId renders with a selected role', async () => {
    await renderRoute('/roles/imp')
    // RoleCard for Imp is rendered (the detail view shows a RoleCard)
    const matches = await screen.findAllByText(/imp/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('/roles/invalid-role redirects to /roles', async () => {
    const { router } = await renderRoute('/roles/nonexistent-role-xyz')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/roles')
    })
  })
})
