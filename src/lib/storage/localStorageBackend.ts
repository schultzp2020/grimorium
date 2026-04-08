import type { StorageBackend } from './types'

export function createLocalStorageBackend(): StorageBackend {
  return {
    get<T>(key: string): Promise<T | null> {
      const data = localStorage.getItem(key)
      if (data === null) {
        return Promise.resolve(null)
      }
      try {
        return Promise.resolve(JSON.parse(data) as T)
      } catch {
        return Promise.resolve(null)
      }
    },

    set<T>(key: string, value: T): Promise<void> {
      localStorage.setItem(key, JSON.stringify(value))
      return Promise.resolve()
    },

    remove(key: string): Promise<void> {
      localStorage.removeItem(key)
      return Promise.resolve()
    },
  }
}
