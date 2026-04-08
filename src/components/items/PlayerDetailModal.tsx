import { EFFECT_TYPE_BADGE_VARIANT, getEffect, getEffectType } from '../../lib/effects/registry'
import {
  getEffectDescription as getRegistryEffectDescription,
  getEffectName as getRegistryEffectName,
  getRoleDescription as getRegistryRoleDescription,
  getRoleName as getRegistryRoleName,
  useI18n,
} from '../../lib/i18n'
import { getRole } from '../../lib/roles/registry'
import { getTeam } from '../../lib/teams'
import { type PlayerState, hasEffect } from '../../lib/types'
import { cn } from '../../lib/utils'
import { Badge, Button, Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, Icon } from '../atoms'
import { PlayerRoleIcon, filterVisibleEffects } from './PlayerRoleIcon'

interface Props {
  player: PlayerState | null
  open: boolean
  onClose: () => void
  onShowRoleCard?: (player: PlayerState) => void
  onEditEffects?: (player: PlayerState) => void
}

export function PlayerDetailModal({ player, open, onClose, onShowRoleCard, onEditEffects }: Props) {
  const { t, language } = useI18n()

  if (!player) {
    return null
  }

  const role = getRole(player.roleId)
  const team = role ? getTeam(role.team) : null
  const isDead = hasEffect(player, 'dead')
  const isDrunk = hasEffect(player, 'drunk')
  const isEvil = team?.isEvil ?? false

  const teamId = role?.team

  const roleName = role ? getRegistryRoleName(role.id, language) : t.ui.unknown
  const roleDescription = role ? getRegistryRoleDescription(role.id, language) : ''
  const teamName = teamId ? t.teams[teamId]?.name : ''
  const winCondition = teamId ? t.teams[teamId]?.winCondition : ''

  const getEffectName = (effectType: string) => getRegistryEffectName(effectType, language)

  const getEffectDescription = (effectType: string) => getRegistryEffectDescription(effectType, language)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          {/* Player status indicator */}
          <div className='mb-4 flex justify-center'>
            <PlayerRoleIcon player={player} size='lg' iconClassName={isEvil ? 'text-red-400' : 'text-mystic-gold'} />
          </div>

          {/* Player Name */}
          <DialogTitle>{player.name}</DialogTitle>

          {/* Status badges */}
          <div className='mt-2 flex justify-center gap-2'>
            {isDead && (
              <Badge variant='dead'>
                <Icon name='skull' size='xs' className='mr-1' />
                {getEffectName('dead')}
              </Badge>
            )}
            {isDrunk && (
              <Badge variant='outsider'>
                <Icon name='beer' size='xs' className='mr-1' />
                {getEffectName('drunk')}
              </Badge>
            )}
            {role && (
              <Badge variant={role.team}>
                <Icon name={role.icon} size='xs' className='mr-1' />
                {roleName}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Role Section */}
          {role && (
            <div className='mb-6'>
              <div className='mb-2 flex items-center gap-2'>
                <Icon name={role.icon} size='sm' className={team?.colors.text} />
                <span className='font-tarot text-sm tracking-wider text-parchment-100 uppercase'>{t.common.role}</span>
                <span className='text-xs text-parchment-500'>({teamName})</span>
              </div>
              <div className='rounded-lg border border-white/10 bg-white/5 p-4'>
                <p className='text-sm leading-relaxed text-parchment-200'>{roleDescription}</p>
              </div>
            </div>
          )}

          {/* Effects Section (dead and drunk are shown via custom UI above) */}
          {filterVisibleEffects(player.effects).length > 0 && (
            <div className='mb-6'>
              <div className='mb-2 flex items-center gap-2'>
                <Icon name='sparkles' size='sm' className='text-cyan-400' />
                <span className='font-tarot text-sm tracking-wider text-parchment-100 uppercase'>{t.ui.effects}</span>
              </div>
              <div className='space-y-2'>
                {filterVisibleEffects(player.effects).map((effectInstance, index) => {
                  const effect = getEffect(effectInstance.type)
                  const effectName = getEffectName(effectInstance.type)
                  const effectDescription = getEffectDescription(effectInstance.type)
                  const effectType = getEffectType(effectInstance, effect)
                  const badgeVariant = EFFECT_TYPE_BADGE_VARIANT[effectType]
                  const DescriptionComponent = effect?.Description

                  return (
                    <div
                      key={`${effectInstance.type}-${index}`}
                      className='rounded-lg border border-white/10 bg-white/5 p-3'
                    >
                      <div className='flex items-center gap-2'>
                        {effect && (
                          <Badge variant={badgeVariant}>
                            <Icon name={effect.icon} size='xs' />
                          </Badge>
                        )}
                        <span className='text-xs font-bold text-parchment-400'>{effectName}</span>
                      </div>
                      {DescriptionComponent ? (
                        <div className='mt-2 text-xs leading-relaxed text-parchment-400'>
                          <DescriptionComponent instance={effectInstance} language={language} />
                        </div>
                      ) : (
                        effectDescription && <p className='mt-2 text-xs text-parchment-400'>{effectDescription}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Win Condition */}
          {winCondition && (
            <div className='mb-6'>
              <div className='mb-2 flex items-center gap-2'>
                <Icon name='trophy' size='sm' className={isEvil ? 'text-red-400' : 'text-mystic-gold'} />
                <span className='font-tarot text-sm tracking-wider text-parchment-100 uppercase'>
                  {t.common.winCondition}
                </span>
              </div>
              <div
                className={cn(
                  'rounded-lg p-4 border',
                  isEvil ? 'bg-red-950/30 border-red-600/30' : 'bg-mystic-gold/5 border-mystic-gold/20',
                )}
              >
                <p className='text-sm leading-relaxed text-parchment-300'>{winCondition}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='space-y-2'>
            {/* See Role Card Button */}
            {role && onShowRoleCard && (
              <Button
                onClick={() => {
                  onClose()
                  onShowRoleCard(player)
                }}
                fullWidth
                variant='outline'
                className='border-mystic-gold/30 text-mystic-gold hover:bg-mystic-gold/10'
              >
                <Icon name='eye' size='md' className='mr-2' />
                {t.ui.seeRoleCard}
              </Button>
            )}

            {/* Edit Effects Button */}
            {onEditEffects && (
              <Button
                onClick={() => {
                  onClose()
                  onEditEffects(player)
                }}
                fullWidth
                variant='outline'
                className='border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20'
              >
                <Icon name='sparkles' size='md' className='mr-2' />
                {t.ui.editEffects}
              </Button>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
