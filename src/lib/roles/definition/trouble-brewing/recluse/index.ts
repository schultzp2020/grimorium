import { registerRoleTranslations } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('recluse', 'en', en)
registerRoleTranslations('recluse', 'es', es)

export default defineRole({
  id: 'recluse',
  category: 'passive',
  team: 'outsider',
  icon: 'candleHolderLit',
  initialEffects: [
    {
      type: 'misregister',
      expiresAt: 'never',
      data: {
        canRegisterAs: {
          teams: ['minion', 'demon'],
          alignments: ['evil'],
        },
      },
    },
  ],
})
