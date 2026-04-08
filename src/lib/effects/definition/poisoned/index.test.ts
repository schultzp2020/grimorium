import { describe, expect, it } from 'vitest'

import definition from '.'

describe('Poisoned effect', () => {
  it('has poisonsAbility set to true', () => {
    expect(definition.poisonsAbility).toBeTruthy()
  })

  it('has no handlers (acts purely as a flag)', () => {
    expect(definition.handlers).toBeUndefined()
  })

  it('has no perception modifiers', () => {
    expect(definition.perceptionModifiers).toBeUndefined()
  })

  it('has no win conditions', () => {
    expect(definition.winConditions).toBeUndefined()
  })
})
