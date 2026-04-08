import { isMalfunctioning } from '../../../../effects/registry'
import { registerRoleTranslations } from '../../../../i18n'
import { getAlivePlayers } from '../../../../types'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('mayor', 'en', en)
registerRoleTranslations('mayor', 'es', es)

export default defineRole({
  id: 'mayor',
  category: 'passive',
  team: 'townsfolk',
  icon: 'landmark',
  initialEffects: [{ type: 'deflect', expiresAt: 'never' }],
  winConditions: [
    {
      trigger: 'end_of_day',
      check: (state, game) => {
        if (state.phase !== 'day') {
          return null
        }

        const alivePlayers = getAlivePlayers(state)
        if (alivePlayers.length !== 3) {
          return null
        }

        for (let i = game.history.length - 1; i >= 0; i--) {
          const entry = game.history[i]
          if (entry.type === 'day_started') {
            break
          }
          if (entry.type === 'execution' || entry.type === 'virgin_execution') {
            return null
          }
        }

        const hasAliveMayor = alivePlayers.some((p) => p.roleId === 'mayor' && !isMalfunctioning(p))
        if (!hasAliveMayor) {
          return null
        }

        return 'townsfolk'
      },
    },
  ],
})
