import { RouterProvider, createMemoryHistory, createRoute, createRouter } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '../lib/i18n'
import { type RouterContext, Route as rootRoute } from './__root'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper uses the real root route with ad-hoc children
function renderWithRouter(initialPath: string, routes: any[]) {
  const routeTree = rootRoute.addChildren(routes)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    context: {} satisfies RouterContext,
  })
  return render(
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>,
  )
}

describe('Root Layout', () => {
  it('shows LanguagePicker by default', async () => {
    const testRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => <div>Test Page</div>,
    })

    renderWithRouter('/', [testRoute])

    expect(await screen.findByRole('button', { name: /english/i })).toBeInTheDocument()
  })

  it('hides LanguagePicker when route context sets hideLanguagePicker', async () => {
    const testRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => <div data-testid='game-page'>Game Page</div>,
      beforeLoad: () => ({ hideLanguagePicker: true }),
    })

    renderWithRouter('/', [testRoute])

    expect(await screen.findByTestId('game-page')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /english/i })).not.toBeInTheDocument()
  })
})
