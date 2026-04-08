import { registerRoleTranslations } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('washerwoman', 'en', en)
registerRoleTranslations('washerwoman', 'es', es)

export default defineRole({
  id: 'washerwoman',
  category: 'info-narrator-setup',
  team: 'townsfolk',
  icon: 'shirt',
  nightOrder: 10,
  wakeCondition: 'first-night-only',
  info: {
    roleId: 'washerwoman',
    icon: 'shirt',
    targetTeam: 'townsfolk',
    historyKeys: {
      discovered: 'roles.washerwoman.history.discoveredTownsfolk',
      noTarget: 'roles.washerwoman.history.noTownsfolk',
    },
    getLabels: (roleT) => ({
      infoTitle: roleT.washerwomanInfo,
      noTargetTitle: roleT.noTownsfolkInGame,
      noTargetMessage: roleT.noTownsfolkMessage,
      noTargetConfirm: roleT.confirmNoTownsfolk,
      showNoTargetLink: roleT.showNoTownsfolk,
      mustIncludeTarget: roleT.mustIncludeTownsfolk,
    }),
  },
})
