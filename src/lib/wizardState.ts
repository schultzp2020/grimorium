const WIZARD_STATE_KEY = 'grimorium_new_game_wizard'

export interface WizardState {
  players?: string[]
  scriptId?: string
  selectedRoles?: string[]
}

export function getWizardState(): WizardState {
  const raw = sessionStorage.getItem(WIZARD_STATE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as WizardState
  } catch {
    clearWizardState()
    return {}
  }
}

export function setWizardState(update: Partial<WizardState>): void {
  const current = getWizardState()
  sessionStorage.setItem(WIZARD_STATE_KEY, JSON.stringify({ ...current, ...update }))
}

export function clearWizardState(): void {
  sessionStorage.removeItem(WIZARD_STATE_KEY)
}
