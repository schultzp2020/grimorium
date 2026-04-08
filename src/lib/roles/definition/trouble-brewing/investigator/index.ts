import { registerRoleTranslations } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('investigator', 'en', en)
registerRoleTranslations('investigator', 'es', es)

export default defineRole({
  id: 'investigator',
  category: 'info-narrator-setup',
  team: 'townsfolk',
  icon: 'search',
  nightOrder: 12,
  wakeCondition: 'first-night-only',
  info: {
    roleId: 'investigator',
    icon: 'search',
    targetTeam: 'minion',
    historyKeys: {
      discovered: 'roles.investigator.history.discoveredMinion',
      noTarget: 'roles.investigator.history.noMinions',
    },
    getLabels: (roleT) => ({
      infoTitle: roleT.investigatorInfo,
      noTargetTitle: roleT.noMinionsInGame,
      noTargetMessage: roleT.noMinionsMessage,
      noTargetConfirm: roleT.confirmNoMinions,
      showNoTargetLink: roleT.showNoMinions,
      mustIncludeTarget: roleT.mustIncludeMinion,
    }),
  },
})
