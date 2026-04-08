import type { Game } from '../types'
import { createLocalStorageBackend } from './localStorageBackend'
import type { StorageBackend } from './types'

export type { StorageBackend } from './types'

const GAMES_KEY = 'grimoire_games'
const CURRENT_GAME_KEY = 'grimoire_current_game'

function isTauri(): boolean {
  return typeof globalThis !== 'undefined' && '__TAURI_INTERNALS__' in globalThis
}

// Cached promise -- resolved once, reused for all subsequent calls.
// Dynamic import() is required because:
// 1. This project uses "type": "module" (ESM) -- require() is not available
// 2. Vite won't eagerly follow dynamic import() paths, so the web build
//    won't choke on @tauri-apps/plugin-store when it's not in a Tauri context
let _backendPromise: Promise<StorageBackend> | null = null

function getBackend(): Promise<StorageBackend> {
  if (!_backendPromise) {
    _backendPromise = isTauri()
      ? import('./tauriBackend').then(({ createTauriBackend }) => createTauriBackend())
      : Promise.resolve(createLocalStorageBackend())
  }
  return _backendPromise
}

// saveGame does read-modify-write. With fire-and-forget calls from XState,
// two rapid saves could interleave (read1, read2, write1, write2 -- losing
// write1's data). This queue ensures writes execute sequentially.
let _writeQueue: Promise<void> = Promise.resolve()

function serialized(fn: () => Promise<void>): Promise<void> {
  _writeQueue = _writeQueue.then(fn, fn)
  return _writeQueue
}

export function saveGame(game: Game): Promise<void> {
  return serialized(async () => {
    const backend = await getBackend()
    const games = await getAllGames()
    const existingIndex = games.findIndex((g) => g.id === game.id)

    if (existingIndex >= 0) {
      games[existingIndex] = game
    } else {
      games.push(game)
    }

    await backend.set(GAMES_KEY, games)
  })
}

export async function getAllGames(): Promise<Game[]> {
  const backend = await getBackend()
  const data = await backend.get<Game[]>(GAMES_KEY)
  return data ?? []
}

export async function getGame(gameId: string): Promise<Game | undefined> {
  const games = await getAllGames()
  return games.find((g) => g.id === gameId)
}

export function deleteGame(gameId: string): Promise<void> {
  return serialized(async () => {
    const backend = await getBackend()
    const games = (await getAllGames()).filter((g) => g.id !== gameId)
    await backend.set(GAMES_KEY, games)

    if ((await getCurrentGameId()) === gameId) {
      await clearCurrentGame()
    }
  })
}

export async function setCurrentGameId(gameId: string): Promise<void> {
  const backend = await getBackend()
  await backend.set(CURRENT_GAME_KEY, gameId)
}

export async function getCurrentGameId(): Promise<string | null> {
  const backend = await getBackend()
  return backend.get<string>(CURRENT_GAME_KEY)
}

export async function clearCurrentGame(): Promise<void> {
  const backend = await getBackend()
  await backend.remove(CURRENT_GAME_KEY)
}

export async function getCurrentGame(): Promise<Game | undefined> {
  const gameId = await getCurrentGameId()
  if (!gameId) {
    return undefined
  }
  return getGame(gameId)
}

export interface GameSummary {
  id: string
  name: string
  createdAt: number
  playerCount: number
  phase: string
  round: number
}

export async function getLastGamePlayers(): Promise<string[]> {
  const games = await getAllGames()
  if (games.length === 0) {
    return []
  }

  const sorted = [...games].sort((a, b) => b.createdAt - a.createdAt)
  const [lastGame] = sorted
  const lastEntry = lastGame.history.at(-1)
  if (!lastEntry) {
    return []
  }

  return lastEntry.stateAfter.players.map((p) => p.name)
}

export async function getGameSummaries(): Promise<GameSummary[]> {
  const games = await getAllGames()

  return games
    .map((game) => {
      const lastEntry = game.history.at(-1)
      const state = lastEntry?.stateAfter

      return {
        id: game.id,
        name: game.name,
        createdAt: game.createdAt,
        playerCount: state?.players.length ?? 0,
        phase: state?.phase ?? 'unknown',
        round: state?.round ?? 0,
      }
    })
    .sort((a, b) => b.createdAt - a.createdAt)
}
