import { registerRoleTranslations } from '../../../../i18n'
import { defineRole } from '../../../defineRole'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('librarian', 'en', en)
registerRoleTranslations('librarian', 'es', es)

export default defineRole({
  id: 'librarian',
  category: 'info-narrator-setup',
  team: 'townsfolk',
  icon: 'bookMarked',
  nightOrder: 11,
  wakeCondition: 'first-night-only',
  info: {
    roleId: 'librarian',
    icon: 'bookMarked',
    targetTeam: 'outsider',
    historyKeys: {
      discovered: 'roles.librarian.history.discoveredOutsider',
      noTarget: 'roles.librarian.history.noOutsiders',
    },
    getLabels: (roleT) => ({
      infoTitle: roleT.librarianInfo,
      noTargetTitle: roleT.noOutsidersInGame,
      noTargetMessage: roleT.noOutsidersMessage,
      noTargetConfirm: roleT.confirmNoOutsiders,
      showNoTargetLink: roleT.showNoOutsiders,
      mustIncludeTarget: roleT.mustIncludeOutsider,
    }),
  },
})
