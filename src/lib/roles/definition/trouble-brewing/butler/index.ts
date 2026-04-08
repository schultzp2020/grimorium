import { registerRoleTranslations } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('butler', 'en', en)
registerRoleTranslations('butler', 'es', es)

export default defineRole({
  id: 'butler',
  category: 'target-action',
  team: 'outsider',
  icon: 'conciergeBell',
  nightOrder: 35,
  wakeCondition: 'always',
  target: {
    filter: 'alive-others',
    applyEffect: { type: 'butler_master', expiresAt: 'never' },
    applyEffectTo: 'self',
    effectTargetDataKey: 'masterId',
    skipWhenMalfunctioning: true,
    autoReplaceEffect: true,
  },
  historyKeys: {
    action: 'roles.butler.history.choseMaster',
  },
})
