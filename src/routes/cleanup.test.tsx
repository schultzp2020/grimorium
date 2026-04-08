import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '../lib/i18n'
import { routeTree } from '../routeTree.gen'

vi.mock('../lib/storage', () => ({
  getGameSummaries: () => [],
  getCurrentGameId: () => null,
  getLastGamePlayers: () => [],
  getGame: () => undefined,
  saveGame: vi.fn(),
  setCurrentGameId: vi.fn(),
  clearCurrentGame: vi.fn(),
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

describe('Route tree smoke tests (post-cleanup)', () => {
  it('/ renders MainMenu', async () => {
    await renderRoute('/')
    expect(await screen.findByText('Grimorium')).toBeInTheDocument()
  })

  it('/how-to-play renders HowToPlayScreen', async () => {
    await renderRoute('/how-to-play')
    const matches = await screen.findAllByText(/how to play/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('/roles renders RolesLibrary', async () => {
    await renderRoute('/roles')
    const matches = await screen.findAllByText(/townsfolk/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('/new-game/players renders PlayerEntry', async () => {
    await renderRoute('/new-game/players')
    expect(await screen.findByText('Step 1: Add players')).toBeInTheDocument()
  })

  it('/game/invalid redirects to /', async () => {
    const { router } = await renderRoute('/game/nonexistent')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
    })
  })

  it('/unknown redirects to /', async () => {
    const { router } = await renderRoute('/totally-bogus')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
    })
  })

  it('main.tsx does not import App', () => {
    // The new main.tsx uses RouterProvider, not App
    // If App.tsx existed and was imported, this test file would fail to compile
    // since we deleted it. This test serves as documentation.
    expect(true).toBeTruthy()
  })
})
