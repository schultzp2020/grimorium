export async function checkForUpdates(): Promise<void> {
  if (!('__TAURI_INTERNALS__' in globalThis)) {
    return
  }

  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const { relaunch } = await import('@tauri-apps/plugin-process')

    const update = await check()
    if (update) {
      await update.downloadAndInstall()
      await relaunch()
    }
  } catch {
    // Silent fail — update check is best-effort
  }
}
