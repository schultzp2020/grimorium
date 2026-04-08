import type { StorageBackend } from './types'

export function createLocalStorageBackend(): StorageBackend {
  return {
    async get<T>(key: string): Promise<T | null> {
      const data = localStorage.getItem(key)
      if (data === null) {
        return null
      }
      try {
        return JSON.parse(data) as T
      } catch {
        return null
      }
    },

    async set<T>(key: string, value: T): Promise<void> {
      localStorage.setItem(key, JSON.stringify(value))
    },

    async remove(key: string): Promise<void> {
      localStorage.removeItem(key)
    },
  }
}
