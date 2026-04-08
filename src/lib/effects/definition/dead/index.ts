import { registerEffectTranslations } from '../../../i18n'
import { hasEffect } from '../../../types'
import type { EffectDefinition } from '../../types'
import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('dead', 'en', en)
registerEffectTranslations('dead', 'es', es)

const definition: EffectDefinition = {
  id: 'dead',
  icon: 'skull',
  defaultType: 'nerf',

  preventsNightWake: true,
  preventsVoting: true,
  preventsNomination: true,

  // Dead players can vote once if they haven't used their dead vote
  canVote: (player) => !hasEffect(player, 'used_dead_vote'),

  canNominate: () => false,
}

export default definition
