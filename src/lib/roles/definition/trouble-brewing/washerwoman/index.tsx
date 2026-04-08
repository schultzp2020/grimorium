import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { type InfoRoleConfig, InfoRoleNightAction } from '../../../../../components/night_steps/InfoRoleNightAction'
import { registerRoleTranslations } from '../../../../i18n'
import { isAlive } from '../../../../types'
import type { RoleDefinition } from '../../../types'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('washerwoman', 'en', en)
registerRoleTranslations('washerwoman', 'es', es)

const washerwomanConfig: InfoRoleConfig = {
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
}

const definition: RoleDefinition = {
  id: 'washerwoman',
  team: 'townsfolk',
  icon: 'shirt',
  nightOrder: 10,
  shouldWake: (game, player) => isAlive(player) && game.history.at(-1)?.stateAfter.round === 1,

  RoleReveal: DefaultRoleReveal,

  NightAction: (props) => <InfoRoleNightAction config={washerwomanConfig} {...props} />,
}

export default definition
