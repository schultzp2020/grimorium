import ButlerMaster from './definition/butler-master'
import Dead from './definition/dead'
import Deflect from './definition/deflect'
import DemonSuccessor from './definition/demon-successor'
import Drunk from './definition/drunk'
import ImpStarpassPending from './definition/imp-starpass-pending'
import Martyrdom from './definition/martyrdom'
import Misregister from './definition/misregister'
import PendingRoleReveal from './definition/pending-role-reveal'
import Poisoned from './definition/poisoned'
import Pure from './definition/pure'
import RedHerring from './definition/red-herring'
import Safe from './definition/safe'
import SlayerBullet from './definition/slayer-bullet'
import UsedDeadVote from './definition/used-dead-vote'
import { registerEffect } from './registry'

// Register all effect definitions
registerEffect(Dead)
registerEffect(UsedDeadVote)
registerEffect(Safe)
registerEffect(RedHerring)
registerEffect(Pure)
registerEffect(SlayerBullet)
registerEffect(Deflect)
registerEffect(Martyrdom)
registerEffect(DemonSuccessor)
registerEffect(Misregister)
registerEffect(PendingRoleReveal)
registerEffect(Poisoned)
registerEffect(Drunk)
registerEffect(ButlerMaster)
registerEffect(ImpStarpassPending)

// Re-export lookup functions from registry
export {
  EFFECT_TYPE_BADGE_VARIANT,
  getAllEffects,
  getEffect,
  getEffectType,
  isMalfunctioning,
  resolveCanRegisterAs,
} from './registry'

export * from './types'
