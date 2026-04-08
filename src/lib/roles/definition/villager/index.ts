import { registerRoleTranslations } from '../../../i18n'
import { defineRole } from '../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('villager', 'en', en)
registerRoleTranslations('villager', 'es', es)

export default defineRole({
  id: 'villager',
  category: 'passive',
  team: 'townsfolk',
  icon: 'user',
})
