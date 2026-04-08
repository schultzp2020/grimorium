import Imp from './definition/imp'
import Baron from './definition/trouble-brewing/baron'
import Butler from './definition/trouble-brewing/butler'
import Chef from './definition/trouble-brewing/chef'
import Drunk from './definition/trouble-brewing/drunk'
import Empath from './definition/trouble-brewing/empath'
import FortuneTeller from './definition/trouble-brewing/fortune-teller'
import Investigator from './definition/trouble-brewing/investigator'
import Librarian from './definition/trouble-brewing/librarian'
import Mayor from './definition/trouble-brewing/mayor'
import Monk from './definition/trouble-brewing/monk'
import Poisoner from './definition/trouble-brewing/poisoner'
import Ravenkeeper from './definition/trouble-brewing/ravenkeeper'
import Recluse from './definition/trouble-brewing/recluse'
import Saint from './definition/trouble-brewing/saint'
import ScarletWoman from './definition/trouble-brewing/scarlet-woman'
import Slayer from './definition/trouble-brewing/slayer'
import Soldier from './definition/trouble-brewing/soldier'
import Spy from './definition/trouble-brewing/spy'
import Undertaker from './definition/trouble-brewing/undertaker'
import Virgin from './definition/trouble-brewing/virgin'
// Trouble Brewing
import Washerwoman from './definition/trouble-brewing/washerwoman'
import Villager from './definition/villager'
import { registerRole } from './registry'

// Register all role definitions
registerRole(Imp)
registerRole(Villager)
registerRole(Washerwoman)
registerRole(Librarian)
registerRole(Investigator)
registerRole(Chef)
registerRole(Empath)
registerRole(FortuneTeller)
registerRole(Undertaker)
registerRole(Monk)
registerRole(Ravenkeeper)
registerRole(Soldier)
registerRole(Virgin)
registerRole(Slayer)
registerRole(Mayor)
registerRole(Saint)
registerRole(ScarletWoman)
registerRole(Recluse)
registerRole(Poisoner)
registerRole(Drunk)
registerRole(Butler)
registerRole(Baron)
registerRole(Spy)

// Re-export lookup functions from registry
export { getAllRoles, getNightOrderRoles, getRole, getRolesRecord } from './registry'

// Re-export scripts module for backward compatibility
export { SCRIPTS, type ScriptId } from '../scripts'

// Re-export distribution helpers from scripts module for backward compatibility
export { getRecommendedDistribution, type RoleDistribution } from '../scripts'

export * from './types'
