import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createLocalStorageBackend } from '../localStorageBackend'
import type { StorageBackend } from '../types'

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
})
