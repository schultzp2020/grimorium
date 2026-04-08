/**
 * Distributed i18n registry for roles and effects.
 *
 * Roles and effects register their own translations at import time,
 * keeping translation text co-located with the code that uses it.
 * Shared/generic translations remain in the central translation files.
 */

import type { Language } from './types'

// ─── Internal registries ─────────────────────────────────────────────────────

/** Flat string values exposed to consumers of getRoleTranslations / getEffectTranslations. */
type TranslationRecord = Record<string, string>

/**
 * Internal storage type — role/effect translation files may contain non-string
 * values (e.g. `lines` arrays, nested `history` objects). We store as-is and
 * expose a narrower Record<string,string> to callers, which is what their
 * property accesses actually need.
 */
type InternalTranslationRecord = Record<string, unknown>

const roleTranslations: Partial<Record<string, Partial<Record<string, InternalTranslationRecord>>>> = {}
const effectTranslations: Partial<Record<string, Partial<Record<string, InternalTranslationRecord>>>> = {}

// ─── Registration functions ──────────────────────────────────────────────────

/**
 * Register translations for a role. Called as a side-effect of importing
 * the role definition module.
 */
export function registerRoleTranslations(
  roleId: string,
  lang: Language,
  translations: InternalTranslationRecord,
): void {
  const entry = (roleTranslations[roleId] ??= {})
  entry[lang] = translations
}

/**
 * Register translations for an effect. Called as a side-effect of importing
 * the effect definition module.
 */
export function registerEffectTranslations(
  effectId: string,
  lang: Language,
  translations: InternalTranslationRecord,
): void {
  const entry = (effectTranslations[effectId] ??= {})
  entry[lang] = translations
}

// ─── Lookup functions ────────────────────────────────────────────────────────

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

/**
 * Get a role's translations for the given language, falling back to English.
 * Returns an empty object if nothing is registered.
 */
export function getRoleTranslations(roleId: string, lang: Language): TranslationRecord {
  const byLang = roleTranslations[roleId]
  if (!byLang) {
    return {}
  }
  return (byLang[lang] ?? byLang['en'] ?? {}) as TranslationRecord
}

/**
 * Get an effect's translations for the given language, falling back to English.
 * Returns an empty object if nothing is registered.
 */
export function getEffectTranslations(effectId: string, lang: Language): TranslationRecord {
  const byLang = effectTranslations[effectId]
  if (!byLang) {
    return {}
  }
  return (byLang[lang] ?? byLang['en'] ?? {}) as TranslationRecord
}

// ─── Convenience helpers ─────────────────────────────────────────────────────

/** Get a role's display name for the given language. */
export function getRoleName(roleId: string, lang: Language): string {
  return asString(getRoleTranslations(roleId, lang).name, roleId)
}

/** Get a role's description for the given language. */
export function getRoleDescription(roleId: string, lang: Language): string {
  return asString(getRoleTranslations(roleId, lang).description, '')
}

/** Get an effect's display name for the given language. */
export function getEffectName(effectId: string, lang: Language): string {
  return asString(getEffectTranslations(effectId, lang).name, effectId)
}

/** Get an effect's description for the given language. */
export function getEffectDescription(effectId: string, lang: Language): string {
  return asString(getEffectTranslations(effectId, lang).description, '')
}

/** Get a role's flavor quote for the given language. */
export function getRoleQuote(roleId: string, lang: Language): string {
  return asString(getRoleTranslations(roleId, lang).quote, '')
}

/** Get a role's ability/condition lines for the given language. */
export function getRoleLines(roleId: string, lang: Language): { type: string; text: string }[] {
  const { lines } = getRoleTranslations(roleId, lang)
  if (Array.isArray(lines)) {
    return lines as { type: string; text: string }[]
  }
  return []
}
