import { getRoleName, interpolate, useI18n } from '../../lib/i18n'
import { getRole } from '../../lib/roles/registry'
import type { PlayerState } from '../../lib/types'
import { BackButton, Button, Icon } from '../atoms'
import { MysticDivider } from '../items'

interface Props {
  player: PlayerState
  action: 'role_reveal' | 'night_action' | 'role_change'
  onProceed: () => void
  onMainMenu: () => void
}

export function NarratorPrompt({ player, action, onProceed, onMainMenu }: Props) {
  const { t, language } = useI18n()
  const role = getRole(player.roleId)
  const roleName = role ? getRoleName(role.id, language) : t.ui.unknown

  const isRoleReveal = action === 'role_reveal'
  const isRoleChange = action === 'role_change'

  const getIcon = () => {
    if (isRoleReveal) {
      return {
        name: 'eye' as const,
        className: 'text-mystic-gold text-glow-gold',
      }
    }
    if (isRoleChange) {
      return {
        name: 'sparkles' as const,
        className: 'text-purple-400 text-glow-gold',
      }
    }
    return { name: 'moon' as const, className: 'text-indigo-400' }
  }

  const getMessage = () => {
    if (isRoleReveal) {
      return interpolate(t.game.narratorGiveDevice, { player: player.name })
    }
    if (isRoleChange) {
      return interpolate(t.game.narratorRoleChanged, { player: player.name })
    }
    return interpolate(t.game.narratorWakePlayer, {
      player: player.name,
      role: roleName,
    })
  }

  const icon = getIcon()

  return (
    <div className='flex min-h-app flex-col bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker'>
      {/* Back button */}
      <div className='px-4 py-4'>
        <BackButton onClick={onMainMenu} label={t.common.mainMenu} />
      </div>

      <div className='flex flex-1 items-center justify-center p-4'>
        <div className='w-full max-w-sm text-center'>
          {/* Icon */}
          <div className='mb-8'>
            <div className='mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-mystic-gold/30 bg-mystic-gold/10'>
              <Icon name={icon.name} size='3xl' className={icon.className} />
            </div>
          </div>

          {/* Narrator label */}
          <p className='mb-2 text-xs tracking-widest text-parchment-500 uppercase'>{t.ui.narrator}</p>

          {/* Message */}
          <p className='mb-8 font-tarot text-xl leading-relaxed text-parchment-100'>{getMessage()}</p>

          {/* Decorative divider */}
          <MysticDivider className='mb-8' />

          {/* Button */}
          <Button onClick={onProceed} fullWidth size='lg' variant='gold'>
            {t.game.readyShowToPlayer}
          </Button>
        </div>
      </div>
    </div>
  )
}
