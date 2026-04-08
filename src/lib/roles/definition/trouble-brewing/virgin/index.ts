import { registerRoleTranslations } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('virgin', 'en', en)
registerRoleTranslations('virgin', 'es', es)

export default defineRole({
  id: 'virgin',
  category: 'passive',
  team: 'townsfolk',
  icon: 'flower',
  initialEffects: [{ type: 'pure', expiresAt: 'never' }],
})
