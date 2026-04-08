import type { ReactNode } from 'react'

import { EFFECT_TYPE_BADGE_VARIANT, getEffect, getEffectType } from '../../lib/effects/registry'
import {
  type Language,
  type Translations,
  getEffectTranslations,
  getEffectName as getRegistryEffectName,
  getRoleName as getRegistryRoleName,
  getRoleTranslations,
  useI18n,
} from '../../lib/i18n'
import { getRole } from '../../lib/roles/registry'
import { type GameState, type RichMessage as RichMessageType, getPlayer } from '../../lib/types'
import { Badge, Icon } from '../atoms'

interface Props {
  message: RichMessageType
  state: GameState
}

// Helper to resolve a dot-notation key by walking an object
function resolveNestedKey(obj: unknown, parts: string[]): string | undefined {
  let value: unknown = obj
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return typeof value === 'string' ? value : undefined
}

// Helper to get a translation value by dot-notation key.
// Checks the global translations first, then falls back to the
// distributed role/effect registries.
function getTranslation(t: Translations, key: string, lang: Language): string | undefined {
  const parts = key.split('.')

  // Try global translations first
  const globalResult = resolveNestedKey(t, parts)
  if (globalResult !== undefined) {
    return globalResult
  }

  // Fallback: check role registry for keys like "roles.<roleId>.xxx"
  if (parts[0] === 'roles' && parts.length >= 3) {
    const [, roleId] = parts
    const roleT = getRoleTranslations(roleId, lang)
    return resolveNestedKey(roleT, parts.slice(2))
  }

  // Fallback: check effect registry for keys like "effects.<effectId>.xxx"
  if (parts[0] === 'effects' && parts.length >= 3) {
    const [, effectId] = parts
    const effectT = getEffectTranslations(effectId, lang)
    return resolveNestedKey(effectT, parts.slice(2))
  }

  return undefined
}

// Param keys that represent player IDs
const PLAYER_PARAM_KEYS = new Set([
  'player',
  'player1',
  'player2',
  'target',
  'nominator',
  'nominee',
  'slayer',
  'redirect',
  'redHerring',
])
// Param keys that represent role IDs
const ROLE_PARAM_KEYS = new Set(['role'])
// Param keys that represent effect IDs
const EFFECT_PARAM_KEYS = new Set(['effect'])

export function RichMessage({ message, state }: Props) {
  const { t, language } = useI18n()

  const getLocalRoleName = (roleId: string) => getRegistryRoleName(roleId, language)

  const getLocalEffectName = (effectType: string) => getRegistryEffectName(effectType, language)

  // Render a player badge with their role icon
  const renderPlayerBadge = (playerId: string, key: string | number) => {
    const player = getPlayer(state, playerId)
    if (!player) {
      return <span key={key}>{t.ui.unknownPlayer}</span>
    }
    const role = getRole(player.roleId)
    return (
      <Badge key={key} variant='player' className='inline-flex items-center gap-1'>
        {role && <Icon name={role.icon} size='xs' />}
        {player.name}
      </Badge>
    )
  }

  // Render a role badge
  const renderRoleBadge = (roleId: string, key: string | number) => {
    const role = getRole(roleId)
    if (!role) {
      return <span key={key}>{t.ui.unknownRole}</span>
    }
    const teamVariant = role.team as 'townsfolk' | 'outsider' | 'minion' | 'demon'
    return (
      <Badge key={key} variant={teamVariant} className='inline-flex items-center gap-1'>
        <Icon name={role.icon} size='xs' /> {getLocalRoleName(roleId)}
      </Badge>
    )
  }

  // Parse a template with params and render with badges
  const renderI18nWithParams = (
    template: string,
    params: Partial<Record<string, string | number>>,
    baseKey: string,
  ): ReactNode[] => {
    const result: ReactNode[] = []
    // Match {paramName} placeholders
    const regex = /\{(\w+)\}/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(template)) !== null) {
      // Add text before the placeholder
      if (match.index > lastIndex) {
        result.push(<span key={`${baseKey}-text-${lastIndex}`}>{template.slice(lastIndex, match.index)}</span>)
      }

      const [, paramKey] = match
      const paramValue = params[paramKey]

      if (paramValue !== undefined) {
        if (PLAYER_PARAM_KEYS.has(paramKey)) {
          // Render as player badge
          result.push(renderPlayerBadge(String(paramValue), `${baseKey}-player-${paramKey}`))
        } else if (ROLE_PARAM_KEYS.has(paramKey)) {
          // Render as role badge
          result.push(renderRoleBadge(String(paramValue), `${baseKey}-role-${paramKey}`))
        } else if (EFFECT_PARAM_KEYS.has(paramKey)) {
          // Render as effect badge (use default type when no instance)
          const effectTypeId = String(paramValue)
          const effect = getEffect(effectTypeId)
          const effectType = getEffectType({ id: '', type: effectTypeId, data: {} }, effect)
          const badgeVariant = EFFECT_TYPE_BADGE_VARIANT[effectType]
          result.push(
            <Badge key={`${baseKey}-effect-${paramKey}`} variant={badgeVariant}>
              {getLocalEffectName(effectTypeId)}
            </Badge>,
          )
        } else {
          // Render as plain text
          result.push(<span key={`${baseKey}-param-${paramKey}`}>{paramValue}</span>)
        }
      } else {
        // Placeholder not found in params, keep as is
        result.push(<span key={`${baseKey}-missing-${paramKey}`}>{match[0]}</span>)
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text after last placeholder
    if (lastIndex < template.length) {
      result.push(<span key={`${baseKey}-text-end`}>{template.slice(lastIndex)}</span>)
    }

    return result
  }

  return (
    <span className='inline-flex flex-wrap items-center gap-1'>
      {message.map((part, index) => {
        switch (part.type) {
          case 'text': {
            return <span key={index}>{part.content}</span>
          }

          case 'i18n': {
            const template = getTranslation(t, part.key, language)
            if (!template) {
              return <span key={index}>[{part.key}]</span>
            }

            if (part.params && Object.keys(part.params).length > 0) {
              // Render with badges for player/role params
              return (
                <span key={index} className='inline-flex flex-wrap items-center gap-1'>
                  {renderI18nWithParams(template, part.params, `i18n-${index}`)}
                </span>
              )
            }
            return <span key={index}>{template}</span>
          }

          case 'player': {
            return renderPlayerBadge(part.playerId, index)
          }

          case 'role': {
            return renderRoleBadge(part.roleId, index)
          }

          case 'effect': {
            const effect = getEffect(part.effectType)
            const effectType = getEffectType({ id: '', type: part.effectType, data: {} }, effect)
            const badgeVariant = EFFECT_TYPE_BADGE_VARIANT[effectType]
            return (
              <Badge key={index} variant={badgeVariant}>
                {getLocalEffectName(part.effectType)}
              </Badge>
            )
          }

          default: {
            return null
          }
        }
      })}
    </span>
  )
}
