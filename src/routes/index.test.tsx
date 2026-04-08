import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
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
  return render(
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>,
  )
}

describe('Index Route (/)', () => {
  it('renders the MainMenu', async () => {
    await renderRoute('/')
    expect(await screen.findByText('Grimorium')).toBeInTheDocument()
  })
})
