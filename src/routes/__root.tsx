import { createRootRouteWithContext, Navigate, Outlet, useMatches } from '@tanstack/react-router'

import { LanguagePicker } from '../components/atoms'

export interface RouterContext {
  hideLanguagePicker?: boolean
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const matches = useMatches()
  const hideLanguagePicker = matches.some(
    (match) => (match.context as RouterContext | undefined)?.hideLanguagePicker === true,
  )

  return (
    <>
      <Outlet />
      {!hideLanguagePicker && (
        <div className='fixed top-4 right-4 z-50'>
          <LanguagePicker variant='floating' />
        </div>
      )}
    </>
  )
}

function NotFound() {
  return <Navigate to='/' replace />
}
