import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '../lib/i18n'
import { routeTree } from '../routeTree.gen'

const mockGame = {
  id: 'test-game-1',
  name: 'Test Game',
  createdAt: Date.now(),
  history: [
    {
      id: 'h1',
      timestamp: Date.now(),
      type: 'game_created',
      message: [],
      data: {},
      stateAfter: {
        phase: 'setup',
        round: 0,
        players: [
          { id: 'p1', name: 'Alice', roleId: 'villager', effects: [] },
          { id: 'p2', name: 'Bob', roleId: 'imp', effects: [] },
        ],
        winner: null,
      },
    },
  ],
}

vi.mock('../lib/storage', () => ({
  getGame: (id: string) => (id === 'test-game-1' ? mockGame : undefined),
  saveGame: vi.fn(),
  setCurrentGameId: vi.fn(),
  clearCurrentGame: vi.fn(),
  getCurrentGameId: () => null,
  getGameSummaries: () => [],
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

describe('Game Route (/game/$gameId)', () => {
  it('renders GameScreen for a valid game ID', async () => {
    await renderRoute('/game/test-game-1')
    await waitFor(() => {
      expect(screen.queryByText('Grimorium')).not.toBeInTheDocument()
    })
  })

  it('redirects to / for an invalid game ID', async () => {
    const { router } = await renderRoute('/game/nonexistent')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
    })
  })
})
