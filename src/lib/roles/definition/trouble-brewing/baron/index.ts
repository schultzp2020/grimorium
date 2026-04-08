import { registerRoleTranslations } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('baron', 'en', en)
registerRoleTranslations('baron', 'es', es)

export default defineRole({
  id: 'baron',
  category: 'passive',
  team: 'minion',
  icon: 'hatTop',
  firstNightReveal: 'evil',
  distributionModifier: { outsider: 2, townsfolk: -2 },
})
