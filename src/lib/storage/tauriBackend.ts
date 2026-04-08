import { LazyStore } from '@tauri-apps/plugin-store'

import type { StorageBackend } from './types'

export function createTauriBackend(): StorageBackend {
  const store = new LazyStore('grimorium.json')

  return {
    async get<T>(key: string): Promise<T | null> {
      const value = await store.get<T>(key)
      return value ?? null
    },

    async set<T>(key: string, value: T): Promise<void> {
      await store.set(key, value)
    },

    async remove(key: string): Promise<void> {
      await store.delete(key)
    },
  }
}
