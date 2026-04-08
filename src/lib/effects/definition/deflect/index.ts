import { DeflectRedirectUI } from '../../../../components/items/DeflectRedirectUI'
import { registerEffectTranslations } from '../../../i18n'
import { createRedirectHandler } from '../../../pipeline/factories'
import type { EffectDefinition } from '../../types'
import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('deflect', 'en', en)
registerEffectTranslations('deflect', 'es', es)

const definition: EffectDefinition = {
  id: 'deflect',
  icon: 'trendingUpDown',
  defaultType: 'buff',
  handlers: [
    createRedirectHandler({
      intentType: 'kill',
      priority: 5, // before safe (10) -- redirect before protection
      UIComponent: DeflectRedirectUI,
      historyKey: 'roles.imp.history.deflectRedirected',
    }),
  ],
}

export default definition
