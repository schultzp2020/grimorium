import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '../lib/i18n'
import { clearWizardState, setWizardState } from '../lib/wizardState'
import { routeTree } from '../routeTree.gen'

vi.mock('../lib/storage', () => ({
  getGameSummaries: () => [],
  getCurrentGameId: () => null,
  getLastGamePlayers: () => [],
  saveGame: vi.fn<() => void>(),
  setCurrentGameId: vi.fn<() => void>(),
}))

afterEach(() => clearWizardState())

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

describe('New Game Wizard Routes', () => {
  it('/new-game/players renders PlayerEntry', async () => {
    await renderRoute('/new-game/players')
    expect(await screen.findByText('Step 1: Add players')).toBeInTheDocument()
  })

  it('/new-game/script without wizard state redirects to /new-game/players', async () => {
    const { router } = await renderRoute('/new-game/script')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/new-game/players')
    })
  })

  it('/new-game/roles without players+scriptId redirects to /new-game/players', async () => {
    const { router } = await renderRoute('/new-game/roles')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/new-game/players')
    })
  })

  it('/new-game/assign without full state redirects to /new-game/players', async () => {
    const { router } = await renderRoute('/new-game/assign')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/new-game/players')
    })
  })

  it('/new-game/script with valid wizard state renders ScriptSelection', async () => {
    setWizardState({ players: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'] })
    await renderRoute('/new-game/script')
    expect(await screen.findByText(/script/i)).toBeInTheDocument()
  })
})
