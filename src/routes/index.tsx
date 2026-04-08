import { createFileRoute } from '@tanstack/react-router'

import { MainMenu } from '../components/screens'

export const Route = createFileRoute('/')({
  component: MainMenu,
})
