import { registerRoleTranslations } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('poisoner', 'en', en)
registerRoleTranslations('poisoner', 'es', es)

export default defineRole({
  id: 'poisoner',
  category: 'target-action',
  team: 'minion',
  icon: 'flask',
  nightOrder: 5,
  wakeCondition: 'always',
  firstNightReveal: 'evil',
  target: {
    filter: 'alive-others',
    applyEffect: {
      type: 'poisoned',
      data: { source: 'poisoner' },
      expiresAt: 'end_of_day',
    },
  },
  historyKeys: {
    action: 'roles.poisoner.history.poisonedPlayer',
    shownTeam: 'roles.poisoner.history.shownEvilTeam',
  },
})
