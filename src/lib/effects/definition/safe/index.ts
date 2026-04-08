import { registerEffectTranslations } from '../../../i18n'
import { createProtectionHandler } from '../../../pipeline/factories'
import type { EffectDefinition } from '../../types'
import en from './i18n/en'
import es from './i18n/es'

registerEffectTranslations('safe', 'en', en)
registerEffectTranslations('safe', 'es', es)

const definition: EffectDefinition = {
  id: 'safe',
  icon: 'shield',
  defaultType: 'buff',
  handlers: [
    createProtectionHandler({
      intentType: 'kill',
      priority: 10, // after deflect (5) -- redirect before protection
      reason: 'protected',
      historyDataReason: 'safe',
      historyKey: 'roles.imp.history.failedToKill',
    }),
  ],
}

export default definition
