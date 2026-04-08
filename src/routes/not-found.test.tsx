import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '../lib/i18n'
import { routeTree } from '../routeTree.gen'

vi.mock('../lib/storage', () => ({
  getGameSummaries: () => [],
  getCurrentGameId: () => null,
  getLastGamePlayers: () => [],
}))

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

describe('Not Found (404)', () => {
  it('redirects unknown routes to /', async () => {
    const { router } = await renderRoute('/some/unknown/path')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
    })
  })
})
