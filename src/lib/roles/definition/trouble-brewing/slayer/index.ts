import { registerRoleTranslations } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('slayer', 'en', en)
registerRoleTranslations('slayer', 'es', es)

export default defineRole({
  id: 'slayer',
  category: 'passive',
  team: 'townsfolk',
  icon: 'crosshair',
  initialEffects: [{ type: 'slayer_bullet', expiresAt: 'never' }],
})
