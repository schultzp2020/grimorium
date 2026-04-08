import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { registerRoleTranslations } from '../../../../i18n'
import type { RoleDefinition } from '../../../types'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('saint', 'en', en)
registerRoleTranslations('saint', 'es', es)

const definition: RoleDefinition = {
  id: 'saint',
  team: 'outsider',
  icon: 'starNorth',
  nightOrder: null, // Doesn't wake at night — passive ability

  // Saint gets Martyrdom effect at game start (evil wins if executed)
  initialEffects: [{ type: 'martyrdom', expiresAt: 'never' }],

  RoleReveal: DefaultRoleReveal,

  NightAction: null,
}

export default definition
