import { registerRoleTranslations } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('scarlet_woman', 'en', en)
registerRoleTranslations('scarlet_woman', 'es', es)

export default defineRole({
  id: 'scarlet_woman',
  category: 'passive',
  team: 'minion',
  icon: 'rose',
  firstNightReveal: 'evil',
  initialEffects: [{ type: 'demon_successor', expiresAt: 'never' }],
})
