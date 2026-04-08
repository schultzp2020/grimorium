import { createFileRoute } from '@tanstack/react-router'

import { HowToPlayScreen } from '../components/screens'

export const Route = createFileRoute('/how-to-play')({
  component: HowToPlayScreen,
})
