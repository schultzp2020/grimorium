import { registerRoleTranslations } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('monk', 'en', en)
registerRoleTranslations('monk', 'es', es)

export default defineRole({
  id: 'monk',
  category: 'target-action',
  team: 'townsfolk',
  icon: 'church',
  nightOrder: 20,
  wakeCondition: 'not-first-night',
  target: {
    filter: 'alive-others',
    applyEffect: { type: 'safe', data: { source: 'monk' }, expiresAt: 'end_of_night' },
    skipWhenMalfunctioning: true,
  },
  historyKeys: {
    action: 'roles.monk.history.protectedPlayer',
  },
})
