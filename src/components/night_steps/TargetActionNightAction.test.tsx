import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { addEffectTo, makeGame, makePlayer, makeState, resetPlayerCounter } from '../../lib/__tests__/helpers'
import type { NightActionResult } from '../../lib/roles/types'
import { TargetActionNightAction, type TargetActionConfig } from './TargetActionNightAction'

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: {
      common: { confirm: 'Confirm', continue: 'Continue' },
      game: {
        stepChoosePlayer: 'Choose a player',
        stepShowEvilTeam: 'Show evil team',
        noEvilTeammates: 'No evil teammates',
      },
      teams: {
        minion: { name: 'Minion' },
        demon: { name: 'Demon' },
      },
    },
    language: 'en',
  }),
  getRoleName: (id: string) => id.charAt(0).toUpperCase() + id.slice(1),
  getRoleTranslations: () => ({
    info: 'Choose a Player',
    selectTarget: 'Select a target',
    evilTeamTitle: 'Your Evil Team',
    evilTeamDescription: 'These are your fellow evil players.',
  }),
  interpolate: (template: string, params: Record<string, string>) =>
    Object.entries(params).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template),
}))

// Mock effects registry
vi.mock('../../lib/effects/registry', () => ({
  isMalfunctioning: (player: { effects: Array<{ type: string }> }) =>
    player.effects.some((e) => e.type === 'poisoned' || e.type === 'drunk'),
}))

// Mock role registry
vi.mock('../../lib/roles/registry', () => ({
  getRole: (id: string) => {
    const roles: Record<string, { id: string; team: string; icon: string }> = {
      monk: { id: 'monk', team: 'townsfolk', icon: 'church' },
      imp: { id: 'imp', team: 'demon', icon: 'flameKindling' },
      poisoner: { id: 'poisoner', team: 'minion', icon: 'flask' },
      butler: { id: 'butler', team: 'outsider', icon: 'conciergeBell' },
      villager: { id: 'villager', team: 'townsfolk', icon: 'user' },
    }
    return roles[id]
  },
  getAllRoles: () => [],
}))

// Mock teams
vi.mock('../../lib/teams', () => ({
  getTeam: (id: string) => ({
    id,
    isEvil: id === 'minion' || id === 'demon',
    icon: 'user',
    name: id,
  }),
  isGoodTeam: (id: string) => id === 'townsfolk' || id === 'outsider',
  isEvilTeam: (id: string) => id === 'minion' || id === 'demon',
}))

afterEach(() => cleanup())
beforeEach(() => resetPlayerCounter())

const monkConfig: TargetActionConfig = {
  roleId: 'monk',
  icon: 'church',
  team: 'townsfolk',
  target: {
    filter: 'alive-others',
    applyEffect: { type: 'safe', data: { source: 'monk' }, expiresAt: 'end_of_night' },
    skipWhenMalfunctioning: true,
  },
  historyKeys: {
    action: 'roles.monk.history.protectedPlayer',
  },
}

describe('TargetActionNightAction', () => {
  describe('with Monk config', () => {
    it('renders step list on initial load', () => {
      const monk = makePlayer({ id: 'p1', name: 'Alice', roleId: 'monk' })
      const state = makeState({
        round: 2,
        players: [
          monk,
          makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' }),
          makePlayer({ id: 'p3', name: 'Carol', roleId: 'villager' }),
        ],
      })
      const game = makeGame(state)
      const onComplete = vi.fn()

      render(
        <TargetActionNightAction
          config={monkConfig}
          game={game}
          state={state}
          player={monk}
          onComplete={onComplete}
        />,
      )

      // Should show step list with the role name
      expect(screen.getByText('Monk')).toBeDefined()
    })

    it('calls onComplete with safe effect when target is selected', () => {
      const monk = makePlayer({ id: 'p1', name: 'Alice', roleId: 'monk' })
      const bob = makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' })
      const state = makeState({
        round: 2,
        players: [monk, bob],
      })
      const game = makeGame(state)
      const onComplete = vi.fn()

      render(
        <TargetActionNightAction
          config={monkConfig}
          game={game}
          state={state}
          player={monk}
          onComplete={onComplete}
        />,
      )

      // Click the step to go to player selector
      fireEvent.click(screen.getByText('Choose a player'))

      // Select Bob
      fireEvent.click(screen.getByText('Bob'))

      // Confirm
      fireEvent.click(screen.getByText('Confirm'))

      expect(onComplete).toHaveBeenCalledOnce()
      const result: NightActionResult = onComplete.mock.calls[0][0]

      // Should have a history entry
      expect(result.entries).toHaveLength(1)
      expect(result.entries[0].data).toMatchObject({
        roleId: 'monk',
        playerId: 'p1',
        targetId: 'p2',
      })

      // Should apply safe effect to Bob
      expect(result.addEffects).toBeDefined()
      expect(result.addEffects!['p2']).toEqual([
        { type: 'safe', data: { source: 'monk' }, expiresAt: 'end_of_night', sourcePlayerId: 'p1' },
      ])
    })

    it('skips effect application when malfunctioning', () => {
      const monk = addEffectTo(makePlayer({ id: 'p1', name: 'Alice', roleId: 'monk' }), 'poisoned')
      const bob = makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' })
      const state = makeState({
        round: 2,
        players: [monk, bob],
      })
      const game = makeGame(state)
      const onComplete = vi.fn()

      render(
        <TargetActionNightAction
          config={monkConfig}
          game={game}
          state={state}
          player={monk}
          onComplete={onComplete}
        />,
      )

      // Navigate through steps
      fireEvent.click(screen.getByText('Choose a player'))
      fireEvent.click(screen.getByText('Bob'))
      fireEvent.click(screen.getByText('Confirm'))

      expect(onComplete).toHaveBeenCalledOnce()
      const result: NightActionResult = onComplete.mock.calls[0][0]

      // Effect should NOT be applied
      expect(result.addEffects).toBeUndefined()
      // History entry should have malfunctioned flag
      expect(result.entries[0].data).toMatchObject({ malfunctioned: true })
    })

    it('does not show self in alive-others filter', () => {
      const monk = makePlayer({ id: 'p1', name: 'Alice', roleId: 'monk' })
      const bob = makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' })
      const state = makeState({
        round: 2,
        players: [monk, bob],
      })
      const game = makeGame(state)

      render(
        <TargetActionNightAction
          config={monkConfig}
          game={game}
          state={state}
          player={monk}
          onComplete={vi.fn()}
        />,
      )

      // Navigate to player selector
      fireEvent.click(screen.getByText('Choose a player'))

      // Bob should be visible, Alice should not
      expect(screen.getByText('Bob')).toBeDefined()
      expect(screen.queryByText('Alice')).toBeNull()
    })
  })

  describe('with Butler config', () => {
    const butlerConfig: TargetActionConfig = {
      roleId: 'butler',
      icon: 'conciergeBell',
      team: 'outsider',
      target: {
        filter: 'alive-others',
        applyEffect: { type: 'butler_master', expiresAt: 'never' },
        applyEffectTo: 'self',
        effectTargetDataKey: 'masterId',
        skipWhenMalfunctioning: true,
        autoReplaceEffect: true,
      },
      historyKeys: {
        action: 'roles.butler.history.choseMaster',
      },
    }

    it('includes removeEffects for auto-replace when autoReplaceEffect is true', () => {
      const butler = addEffectTo(
        makePlayer({ id: 'p1', name: 'Alice', roleId: 'butler' }),
        'butler_master',
        { masterId: 'p3' },
      )
      const bob = makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' })
      const state = makeState({
        round: 2,
        players: [butler, bob],
      })
      const game = makeGame(state)
      const onComplete = vi.fn()

      render(
        <TargetActionNightAction
          config={butlerConfig}
          game={game}
          state={state}
          player={butler}
          onComplete={onComplete}
        />,
      )

      fireEvent.click(screen.getByText('Choose a player'))
      fireEvent.click(screen.getByText('Bob'))
      fireEvent.click(screen.getByText('Confirm'))

      const result: NightActionResult = onComplete.mock.calls[0][0]

      // Should remove old butler_master from self
      expect(result.removeEffects).toBeDefined()
      expect(result.removeEffects!['p1']).toContain('butler_master')

      // Should add new butler_master to self with masterId = target
      expect(result.addEffects).toBeDefined()
      expect(result.addEffects!['p1']).toEqual([
        expect.objectContaining({
          type: 'butler_master',
          data: { masterId: 'p2' },
          expiresAt: 'never',
        }),
      ])
    })

    it('applies effect to self even without prior effect', () => {
      const butler = makePlayer({ id: 'p1', name: 'Alice', roleId: 'butler' })
      const bob = makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' })
      const state = makeState({
        round: 1,
        players: [butler, bob],
      })
      const game = makeGame(state)
      const onComplete = vi.fn()

      render(
        <TargetActionNightAction
          config={butlerConfig}
          game={game}
          state={state}
          player={butler}
          onComplete={onComplete}
        />,
      )

      fireEvent.click(screen.getByText('Choose a player'))
      fireEvent.click(screen.getByText('Bob'))
      fireEvent.click(screen.getByText('Confirm'))

      const result: NightActionResult = onComplete.mock.calls[0][0]

      // Should still include removeEffects (safe to remove even if not present)
      expect(result.removeEffects).toBeDefined()
      expect(result.removeEffects!['p1']).toContain('butler_master')

      // Should add new butler_master to self
      expect(result.addEffects!['p1']).toEqual([
        expect.objectContaining({
          type: 'butler_master',
          data: { masterId: 'p2' },
        }),
      ])
    })
  })

  describe('with Poisoner config (firstNightReveal)', () => {
    const poisonerConfig: TargetActionConfig = {
      roleId: 'poisoner',
      icon: 'flask',
      team: 'minion',
      firstNightReveal: 'evil',
      target: {
        filter: 'alive-others',
        applyEffect: {
          type: 'poisoned',
          data: { source: 'poisoner' },
          expiresAt: 'end_of_day',
        },
      },
      historyKeys: {
        action: 'roles.poisoner.history.poisonedPlayer',
        shownTeam: 'roles.poisoner.history.shownEvilTeam',
      },
    }

    it('shows team reveal step on first night', () => {
      const poisoner = makePlayer({ id: 'p1', name: 'Alice', roleId: 'poisoner' })
      const state = makeState({
        round: 1,
        players: [
          poisoner,
          makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' }),
          makePlayer({ id: 'p3', name: 'Eve', roleId: 'imp' }),
        ],
      })
      const game = makeGame(state)

      render(
        <TargetActionNightAction
          config={poisonerConfig}
          game={game}
          state={state}
          player={poisoner}
          onComplete={vi.fn()}
        />,
      )

      // Step list should contain "Show evil team" step
      expect(screen.getByText('Show evil team')).toBeDefined()
    })

    it('does NOT show team reveal step on subsequent nights', () => {
      const poisoner = makePlayer({ id: 'p1', name: 'Alice', roleId: 'poisoner' })
      const state = makeState({
        round: 2,
        players: [
          poisoner,
          makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' }),
        ],
      })
      const game = makeGame(state)

      render(
        <TargetActionNightAction
          config={poisonerConfig}
          game={game}
          state={state}
          player={poisoner}
          onComplete={vi.fn()}
        />,
      )

      // Step list should NOT contain "Show evil team" step
      expect(screen.queryByText('Show evil team')).toBeNull()
    })

    it('includes team reveal history entry on first night', () => {
      const poisoner = makePlayer({ id: 'p1', name: 'Alice', roleId: 'poisoner' })
      const bob = makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' })
      const state = makeState({
        round: 1,
        players: [poisoner, bob],
      })
      const game = makeGame(state)
      const onComplete = vi.fn()

      render(
        <TargetActionNightAction
          config={poisonerConfig}
          game={game}
          state={state}
          player={poisoner}
          onComplete={onComplete}
        />,
      )

      // Complete team reveal step
      fireEvent.click(screen.getByText('Show evil team'))
      fireEvent.click(screen.getByText('Continue'))

      // Now select target
      fireEvent.click(screen.getByText('Choose a player'))
      fireEvent.click(screen.getByText('Bob'))
      fireEvent.click(screen.getByText('Confirm'))

      const result: NightActionResult = onComplete.mock.calls[0][0]

      // Should have 2 entries: team reveal + poison action
      expect(result.entries).toHaveLength(2)
      expect(result.entries[0].data).toMatchObject({
        roleId: 'poisoner',
        playerId: 'p1',
        action: 'first_night_info',
      })
      expect(result.entries[1].data).toMatchObject({
        roleId: 'poisoner',
        targetId: 'p2',
      })
    })

    it('applies poisoned effect with sourcePlayerId', () => {
      const poisoner = makePlayer({ id: 'p1', name: 'Alice', roleId: 'poisoner' })
      const bob = makePlayer({ id: 'p2', name: 'Bob', roleId: 'villager' })
      const state = makeState({
        round: 2,
        players: [poisoner, bob],
      })
      const game = makeGame(state)
      const onComplete = vi.fn()

      render(
        <TargetActionNightAction
          config={poisonerConfig}
          game={game}
          state={state}
          player={poisoner}
          onComplete={onComplete}
        />,
      )

      fireEvent.click(screen.getByText('Choose a player'))
      fireEvent.click(screen.getByText('Bob'))
      fireEvent.click(screen.getByText('Confirm'))

      const result: NightActionResult = onComplete.mock.calls[0][0]

      expect(result.addEffects!['p2']).toEqual([
        expect.objectContaining({
          type: 'poisoned',
          data: { source: 'poisoner' },
          expiresAt: 'end_of_day',
          sourcePlayerId: 'p1',
        }),
      ])
    })
  })
})
