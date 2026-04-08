import { useState } from 'react'

import { Button, Icon } from '../../../../../components/atoms'
import { RolePickerGrid } from '../../../../../components/inputs'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { getRoleTranslations, registerRoleTranslations, useI18n } from '../../../../i18n'
import { getAllRoles } from '../../../registry'
import type { RoleDefinition, SetupActionProps } from '../../../types'
import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('drunk', 'en', en)
registerRoleTranslations('drunk', 'es', es)

/**
 * The Drunk — Outsider role.
 *
 * The Drunk does not know they are the Drunk. They believe they are a
 * Townsfolk character. During the setup phase (before role revelation),
 * the narrator chooses which Townsfolk role the Drunk believes they are.
 *
 * The Drunk's roleId is then changed to that Townsfolk role, and a
 * permanent "drunk" effect is applied. The game treats them as the
 * believed role in every way (night order, NightAction, shouldWake),
 * but the drunk effect causes their ability to malfunction.
 *
 * The Drunk effect's perception modifier ensures info roles see "Drunk"
 * and "Outsider" when checking this player's identity.
 *
 * nightOrder is null because the Drunk never wakes as "Drunk" — they
 * wake as their believed role.
 * NightAction is null for the same reason.
 */

function DrunkSetupAction({ player, state, onComplete }: SetupActionProps) {
  const { t, language } = useI18n()
  const roleT = getRoleTranslations('drunk', language)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  // Get all Townsfolk roles for the narrator to choose from
  const townsfolkRoles = getAllRoles().filter((r) => r.team === 'townsfolk')

  const handleSelect = (roleId: string) => {
    setSelectedRole((prev) => (prev === roleId ? null : roleId))
  }

  const handleConfirm = () => {
    if (!selectedRole) {
      return
    }

    onComplete({
      changeRole: selectedRole,
      addEffects: {
        [player.id]: [
          {
            type: 'drunk',
            data: { actualRole: 'drunk' },
            expiresAt: 'never',
          },
        ],
      },
    })
  }

  return (
    <div className='flex min-h-app flex-col bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker'>
      {/* Header */}
      <div className='sticky top-0 z-10 border-b border-mystic-gold/20 bg-grimoire-dark/95 px-4 py-3 backdrop-blur-xs'>
        <div className='mx-auto flex max-w-lg items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full border border-amber-700/50 bg-amber-900/30'>
            <Icon name='beer' size='md' className='text-amber-400' />
          </div>
          <div>
            <h1 className='font-tarot text-lg tracking-wider text-parchment-100 uppercase'>{roleT.drunkSetupTitle}</h1>
            <p className='text-xs text-parchment-500'>{player.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 py-4'>
        <div className='mb-4 rounded-xl border border-amber-700/30 bg-amber-900/10 p-4'>
          <p className='text-sm text-parchment-300'>{roleT.drunkSetupDescription}</p>
        </div>

        <h3 className='mb-3 text-sm font-medium tracking-wider text-parchment-400 uppercase'>
          {roleT.chooseBelievedRole}
        </h3>

        <div className='mb-6'>
          <RolePickerGrid
            roles={townsfolkRoles}
            state={state}
            selected={selectedRole ? [selectedRole] : []}
            onSelect={handleSelect}
            selectionCount={1}
            colorMode='team'
          />
        </div>
      </div>

      {/* Footer */}
      <div className='sticky bottom-0 border-t border-mystic-gold/20 bg-grimoire-dark/95 px-4 py-3 backdrop-blur-xs'>
        <div className='mx-auto max-w-lg'>
          <Button onClick={handleConfirm} disabled={!selectedRole} fullWidth size='lg' variant='gold'>
            <Icon name='check' size='md' className='mr-2' />
            {t.common.confirm}
          </Button>
        </div>
      </div>
    </div>
  )
}

const definition: RoleDefinition = {
  id: 'drunk',
  team: 'outsider',
  icon: 'beer',
  nightOrder: null, // Never wakes as "Drunk"
  chaos: 60,

  RoleReveal: DefaultRoleReveal, // Never shown — player sees their believed role

  NightAction: null, // The believed role's NightAction runs instead

  SetupAction: DrunkSetupAction,
}

export default definition
