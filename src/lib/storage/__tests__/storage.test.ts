import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  clearCurrentGame,
  deleteGame,
  getAllGames,
  getCurrentGame,
  getCurrentGameId,
  getGame,
  getGameSummaries,
  getLastGamePlayers,
  saveGame,
  setCurrentGameId,
} from '../index'
import { createLocalStorageBackend } from '../localStorageBackend'
import type { StorageBackend } from '../types'
import type { Game } from '../../types'

function makeTestGame(overrides: Partial<Game> = {}): Game {
  return {
    id: overrides.id ?? 'game-1',
    name: overrides.name ?? 'Test Game',
    scriptId: overrides.scriptId ?? 'trouble-brewing',
    createdAt: overrides.createdAt ?? 1000,
    history: overrides.history ?? [
      {
        id: 'entry-1',
        timestamp: 1000,
        type: 'game_created',
        message: [],
        data: {},
        stateAfter: {
          phase: 'setup',
          round: 0,
          players: [
            { id: 'p1', name: 'Alice', roleId: 'villager', effects: [] },
            { id: 'p2', name: 'Bob', roleId: 'imp', effects: [] },
            { id: 'p3', name: 'Carol', roleId: 'monk', effects: [] },
            { id: 'p4', name: 'Dave', roleId: 'poisoner', effects: [] },
            { id: 'p5', name: 'Eve', roleId: 'slayer', effects: [] },
          ],
          winner: null,
        },
      },
    ],
  }
}

describe('LocalStorageBackend', () => {
  let backend: StorageBackend

  beforeEach(() => {
    localStorage.clear()
    backend = createLocalStorageBackend()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('get returns null for missing keys', async () => {
    const result = await backend.get<string>('nonexistent')
    expect(result).toBeNull()
  })

  it('set and get round-trip a value', async () => {
    await backend.set('key', { name: 'test', value: 42 })
    const result = await backend.get<{ name: string; value: number }>('key')
    expect(result).toEqual({ name: 'test', value: 42 })
  })

  it('set overwrites existing values', async () => {
    await backend.set('key', 'first')
    await backend.set('key', 'second')
    const result = await backend.get<string>('key')
    expect(result).toBe('second')
  })

  it('remove deletes a key', async () => {
    await backend.set('key', 'value')
    await backend.remove('key')
    const result = await backend.get<string>('key')
    expect(result).toBeNull()
  })

  it('remove is a no-op for missing keys', async () => {
    await expect(backend.remove('nonexistent')).resolves.toBeUndefined()
  })

  it('get returns null for corrupt JSON', async () => {
    localStorage.setItem('key', 'not-valid-json{{{')
    const result = await backend.get<string>('key')
    expect(result).toBeNull()
  })
})

describe('Storage public API', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('saveGame + getAllGames round-trip', async () => {
    const game = makeTestGame()
    await saveGame(game)
    const games = await getAllGames()
    expect(games).toHaveLength(1)
    expect(games[0].id).toBe('game-1')
  })

  it('saveGame updates existing game', async () => {
    const game = makeTestGame()
    await saveGame(game)
    const updated = { ...game, name: 'Updated' }
    await saveGame(updated)
    const games = await getAllGames()
    expect(games).toHaveLength(1)
    expect(games[0].name).toBe('Updated')
  })

  it('getGame finds by ID', async () => {
    await saveGame(makeTestGame({ id: 'a' }))
    await saveGame(makeTestGame({ id: 'b' }))
    const found = await getGame('b')
    expect(found?.id).toBe('b')
  })

  it('getGame returns undefined for missing ID', async () => {
    const found = await getGame('nonexistent')
    expect(found).toBeUndefined()
  })

  it('deleteGame removes a game', async () => {
    await saveGame(makeTestGame({ id: 'a' }))
    await saveGame(makeTestGame({ id: 'b' }))
    await deleteGame('a')
    const games = await getAllGames()
    expect(games).toHaveLength(1)
    expect(games[0].id).toBe('b')
  })

  it('deleteGame clears current game if it was the deleted one', async () => {
    await saveGame(makeTestGame({ id: 'a' }))
    await setCurrentGameId('a')
    await deleteGame('a')
    const current = await getCurrentGameId()
    expect(current).toBeNull()
  })

  it('setCurrentGameId + getCurrentGameId round-trip', async () => {
    await setCurrentGameId('game-1')
    const id = await getCurrentGameId()
    expect(id).toBe('game-1')
  })

  it('clearCurrentGame removes current game ID', async () => {
    await setCurrentGameId('game-1')
    await clearCurrentGame()
    const id = await getCurrentGameId()
    expect(id).toBeNull()
  })

  it('getCurrentGame returns the current game', async () => {
    const game = makeTestGame({ id: 'game-1' })
    await saveGame(game)
    await setCurrentGameId('game-1')
    const current = await getCurrentGame()
    expect(current?.id).toBe('game-1')
  })

  it('getLastGamePlayers returns player names from the most recent game', async () => {
    await saveGame(makeTestGame({ id: 'old', createdAt: 1000 }))
    await saveGame(makeTestGame({ id: 'new', createdAt: 2000 }))
    const names = await getLastGamePlayers()
    expect(names).toEqual(['Alice', 'Bob', 'Carol', 'Dave', 'Eve'])
  })

  it('getGameSummaries returns sorted summaries', async () => {
    await saveGame(makeTestGame({ id: 'a', name: 'First', createdAt: 1000 }))
    await saveGame(makeTestGame({ id: 'b', name: 'Second', createdAt: 2000 }))
    const summaries = await getGameSummaries()
    expect(summaries).toHaveLength(2)
    expect(summaries[0].name).toBe('Second')
    expect(summaries[1].name).toBe('First')
  })
})
