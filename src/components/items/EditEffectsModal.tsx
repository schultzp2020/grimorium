import { useCallback, useState } from 'react'

import { EFFECT_TYPE_BADGE_VARIANT, getAllEffects, getEffect, getEffectType } from '../../lib/effects/registry'
import type { EffectDefinition } from '../../lib/effects/types'
import { getEffectName as getRegistryEffectName, useI18n } from '../../lib/i18n'
import { type EffectInstance, type GameState, type PlayerState, hasEffect } from '../../lib/types'
import { Badge, Button, Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, Icon } from '../atoms'

type ModalMode =
  | { type: 'list' }
  | { type: 'add_config'; effectDef: EffectDefinition }
  | { type: 'edit_config'; effectInstance: EffectInstance; effectDef: EffectDefinition }

interface Props {
  player: PlayerState | null
  state: GameState
  open: boolean
  onClose: () => void
  onAddEffect: (playerId: string, effectType: string, data?: Record<string, unknown>) => void
  onRemoveEffect: (playerId: string, effectType: string) => void
  onUpdateEffect: (playerId: string, effectType: string, data: Record<string, unknown>) => void
}

export function EditEffectsModal({ player, state, open, onClose, onAddEffect, onRemoveEffect, onUpdateEffect }: Props) {
  const { t, language } = useI18n()
  const [mode, setMode] = useState<ModalMode>({ type: 'list' })

  const resetMode = useCallback(() => setMode({ type: 'list' }), [])

  // Reset mode when modal closes or reopens
  const handleClose = useCallback(() => {
    resetMode()
    onClose()
  }, [onClose, resetMode])

  if (!player) {
    return null
  }

  const allEffects = getAllEffects()
  const currentEffectTypes = player.effects.map((e) => e.type)

  const getEffectName = (effectType: string) => getRegistryEffectName(effectType, language)

  // ── Add effect flow ──
  const handleAddEffect = (effectDef: EffectDefinition) => {
    if (effectDef.ConfigEditor) {
      // Show config editor for effects that need configuration
      setMode({ type: 'add_config', effectDef })
    } else {
      // Direct add for simple effects
      onAddEffect(player.id, effectDef.id)
    }
  }

  const handleAddWithConfig = (data: Record<string, unknown>) => {
    if (mode.type !== 'add_config') {
      return
    }
    onAddEffect(player.id, mode.effectDef.id, data)
    resetMode()
  }

  // ── Edit effect flow ──
  const handleEditEffect = (effectInstance: EffectInstance) => {
    const effectDef = getEffect(effectInstance.type)
    if (!effectDef?.ConfigEditor) {
      return
    }
    setMode({ type: 'edit_config', effectInstance, effectDef })
  }

  const handleSaveEdit = (data: Record<string, unknown>) => {
    if (mode.type !== 'edit_config') {
      return
    }
    onUpdateEffect(player.id, mode.effectInstance.type, data)
    resetMode()
  }

  // ── Remove effect flow ──
  const handleRemoveEffect = (effectType: string) => {
    onRemoveEffect(player.id, effectType)
  }

  // ── Render ──

  // Config editor screen (add or edit)
  if (mode.type === 'add_config' || mode.type === 'edit_config') {
    const { effectDef } = mode
    const { ConfigEditor } = effectDef
    if (!ConfigEditor) {
      return null
    }
    const existingData = mode.type === 'edit_config' ? mode.effectInstance.data : undefined
    const isEditing = mode.type === 'edit_config'
    const effectName = getEffectName(effectDef.id)

    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <div className='mb-4 flex justify-center'>
              <div className='flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-500/40 bg-cyan-900/30'>
                <Icon name={effectDef.icon} size='2xl' className='text-cyan-400' />
              </div>
            </div>
            <DialogTitle>{isEditing ? t.ui.editEffectConfig : t.ui.addEffect}</DialogTitle>
            <p className='mt-1 text-center text-sm text-parchment-400'>
              {effectName} — {player.name}
            </p>
          </DialogHeader>

          <DialogBody>
            <ConfigEditor
              data={existingData}
              state={state}
              playerId={player.id}
              language={language}
              onSave={isEditing ? handleSaveEdit : handleAddWithConfig}
              onCancel={resetMode}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    )
  }

  // List screen (default)
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <div className='mb-4 flex justify-center'>
            <div className='flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-500/40 bg-cyan-900/30'>
              <Icon name='sparkles' size='2xl' className='text-cyan-400' />
            </div>
          </div>
          <DialogTitle>{t.ui.editEffects}</DialogTitle>
          <p className='mt-1 text-center text-sm text-parchment-400'>{player.name}</p>
        </DialogHeader>

        <DialogBody>
          {/* Current Effects */}
          <div className='mb-6'>
            <div className='mb-3 flex items-center gap-2'>
              <Icon name='sparkles' size='sm' className='text-cyan-400' />
              <span className='font-tarot text-sm tracking-wider text-parchment-100 uppercase'>
                {t.ui.currentEffects}
              </span>
            </div>
            {currentEffectTypes.length === 0 ? (
              <p className='text-sm text-parchment-500 italic'>{t.ui.noEffects}</p>
            ) : (
              <div className='space-y-2'>
                {player.effects.map((effectInstance, index) => {
                  const effect = getEffect(effectInstance.type)
                  const effectName = getEffectName(effectInstance.type)
                  const effectType = getEffectType(effectInstance, effect)
                  const badgeVariant = EFFECT_TYPE_BADGE_VARIANT[effectType]
                  const hasConfig = !!effect?.ConfigEditor
                  const DescriptionComponent = effect?.Description

                  return (
                    <div
                      key={`${effectInstance.type}-${index}`}
                      className='rounded-lg border border-white/10 bg-white/5 p-3'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex min-w-0 items-center gap-2'>
                          {effect && (
                            <Badge variant={badgeVariant}>
                              <Icon name={effect.icon} size='xs' />
                            </Badge>
                          )}
                          <span className='truncate text-sm text-parchment-200'>{effectName}</span>
                        </div>
                        <div className='flex shrink-0 items-center gap-1'>
                          {hasConfig && (
                            <Button
                              onClick={() => handleEditEffect(effectInstance)}
                              size='icon'
                              variant='ghost'
                              className='min-h-[44px] min-w-[44px] text-cyan-400 hover:bg-cyan-900/20 hover:text-cyan-300'
                            >
                              <Icon name='pencil' size='sm' />
                            </Button>
                          )}
                          <Button
                            onClick={() => handleRemoveEffect(effectInstance.type)}
                            size='icon'
                            variant='ghost'
                            className='min-h-[44px] min-w-[44px] text-red-400 hover:bg-red-900/20 hover:text-red-300'
                          >
                            <Icon name='minus' size='sm' />
                          </Button>
                        </div>
                      </div>
                      {/* Show effect description/data summary */}
                      {DescriptionComponent && (
                        <div className='mt-2 text-xs leading-relaxed text-parchment-400'>
                          <DescriptionComponent instance={effectInstance} language={language} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Add Effects */}
          <div>
            <div className='mb-3 flex items-center gap-2'>
              <Icon name='plus' size='sm' className='text-green-400' />
              <span className='font-tarot text-sm tracking-wider text-parchment-100 uppercase'>{t.ui.addEffect}</span>
            </div>
            <div className='space-y-1.5'>
              {allEffects.map((effect) => {
                const effectName = getEffectName(effect.id)
                const alreadyHas = hasEffect(player, effect.id)
                const hasConfig = !!effect.ConfigEditor

                return (
                  <button
                    type='button'
                    key={effect.id}
                    onClick={() => handleAddEffect(effect)}
                    disabled={alreadyHas}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                      alreadyHas
                        ? 'cursor-not-allowed border-white/5 bg-white/5 opacity-40'
                        : 'border-white/10 bg-white/5 hover:border-green-500/50 hover:bg-green-900/20 active:bg-green-900/30'
                    }`}
                  >
                    <Icon
                      name={effect.icon}
                      size='md'
                      className={alreadyHas ? 'text-parchment-500' : 'text-parchment-300'}
                    />
                    <span className={`flex-1 text-sm ${alreadyHas ? 'text-parchment-500' : 'text-parchment-200'}`}>
                      {effectName}
                    </span>
                    {hasConfig && !alreadyHas && <Icon name='settings' size='xs' className='text-parchment-500' />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Close Button */}
          <div className='mt-6'>
            <Button onClick={handleClose} fullWidth variant='outline'>
              {t.common.confirm}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
