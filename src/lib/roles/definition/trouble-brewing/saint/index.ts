import { registerRoleTranslations } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('saint', 'en', en)
registerRoleTranslations('saint', 'es', es)

export default defineRole({
  id: 'saint',
  category: 'passive',
  team: 'outsider',
  icon: 'starNorth',
  initialEffects: [{ type: 'martyrdom', expiresAt: 'never' }],
})
