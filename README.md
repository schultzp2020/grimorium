# Grimorium

> A fully digital Grimoire for Blood on the Clocktower.

<p align="center">
  <img src="public/og-image.png" alt="Grimorium Preview" width="700">
</p>

<p align="center">
  🕯️ <a href="https://grimorium.app"><strong>grimorium.app</strong></a>
</p>

<p align="center">
  <a href="https://buymeacoffee.com/csansoon">
    <img src="public/bmc-button.png" alt="Buy Me A Coffee" width="200">
  </a>
</p>

---

## About

**Grimorium** is a complete, interactive, digital version of the Grimoire for  
[Blood on the Clocktower](https://wiki.bloodontheclocktower.com/Main_Page).

It allows you to run an entire game — from setup to final win condition — using only your phone, tablet, or laptop.

No box required.  
No tokens to manage.  
No rule lookups mid-night.

Everything happens inside the app.

<p align="center">
  <img src="public/game_management.png" alt="Game management — setup, day phase, and event history" width="900">
</p>

- **Game Creation** — Start a new game and add your players.
- **Role Selection** — Pick a script and choose the roles in play, or let Grimorium generate a balanced set for you.
- **Role Reveal** — Show each player their role privately, with themed role cards.
- **Night Management** — The app walks you through each night in the correct wake order, resolving abilities, poisoning, protection, and death timing automatically.
- **Day Phase** — Handle day abilities (like the Slayer's shot), track statuses, and move the game forward.
- **Nominations & Voting** — Run nominations, collect votes, and resolve executions with automatic vote threshold tracking.
- **Win Detection** — The game detects when a win condition is met, including dynamic conditions like the Saint and the Mayor.
- **Full History** — Every action and state change is recorded in a reviewable event log.
- **Bilingual** — Full English and Spanish support.

Poisoning, drunkenness, misinformation, role changes... The app handles the mechanics, but every decision stays with the Storyteller.

---

## Why It Exists

This project started for a simple reason:  
as a Storyteller, I kept forgetting small but important things — a wake order detail, a poisoning interaction, a timing nuance.

Grimorium was built to internalize those rules.

Instead of remembering what to pick up, flip, move, or show, the interface narrows your focus to what actually matters:

- The decision being made
- The information being shown
- The current state of the game

The system handles the rest.

---

## Modular by Design

**Trouble Brewing** is fully implemented — all 23 roles — and the system is built around a modular role architecture ready for additional scripts.

Each character defines:

- When it acts and in what order
- What decisions it requires from the Storyteller
- How it affects the game state
- How it interacts with other roles through a decoupled intent pipeline

<p align="center">
  <img src="public/roles.png" alt="Role cards — Fortune Teller and Imp" width="700">
</p>

Every role comes with its own themed card showing its ability, alignment, and win condition. Roles can be added independently, and new scripts can grow incrementally over time.

The engine doesn't just list characters — it models how they behave.

---

## Architecture & Workflow

Grimorium is built upon several advanced architectural patterns to ensure flexibility:

- **Event-Sourced Game State:** Game state is purely event-sourced and never mutated directly. All changes append a `HistoryEntry` to an immutable game model, maintaining a full snapshot after each event.
- **The Intent Pipeline:** Roles and effects do not reference each other's logic. Characters emit "intents" (e.g., "kill this player"), which are pushed through a middleware pipeline where other effects can intercept, modify, or prevent them.
- **Decoupled Roles & Effects:** Roles are thin wrappers; all passive ability rule interactions live within modular **Effects**.
- **Malfunction System:** Automatically tracks and overrides abilities producing false results (from Poisoned or Drunk effects) without needing narrator rule-lookups.
- **Perception System:** Information roles query perceived identity rather than actual identity, allowing misregistration effects (Recluse, Spy) to work without hardcoded role checks.

---

## Fully Client-Side

Grimorium is designed to work anywhere:

- **Web** — Installable as a Progressive Web App (PWA), fully functional offline
- **Desktop** — Native Windows and Mac apps via [Tauri v2](https://v2.tauri.app/)
- **Android** — Native app via Tauri v2 (APK from [GitHub Releases](https://github.com/pschultz/grimorium/releases))
- No accounts
- No servers
- No game data leaves your device

Everything runs locally. Your games stay yours.

---

## Script Support

- ✅ **Trouble Brewing** — All 23 roles (13 Townsfolk, 4 Outsiders, 4 Minions, 2 Demons)
- ⏳ Additional scripts planned

---

## Development

Requires Node.js 22+. For native builds, also install [Rust](https://rustup.rs/) and the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/).

```bash
npm install
npm run dev              # web dev server (browser)
npm test                 # run tests
npm run lint             # oxlint (type-aware)
npm run format           # oxfmt
npm run tauri:dev        # native desktop window with hot reload
npm run tauri:build      # build desktop installer
npm run tauri:android-dev    # launch on Android device/emulator
npm run tauri:android-build  # build Android APK
```

Contributions, ideas, and discussions are welcome.

### Releasing Native Builds

Native builds are triggered by pushing a version tag. Before the first release, set up signing keys:

**1. Desktop updater signing key:**

```bash
npx tauri signer generate -w ~/.tauri/grimorium.key
```

This prints a public key — update `src-tauri/tauri.conf.json` → `plugins.updater.pubkey` with it.

**2. Android keystore:**

```bash
keytool -genkey -v -keystore grimorium.jks -keyalg RSA -keysize 2048 -validity 10000 -alias grimorium
```

**3. Add GitHub Secrets** (repo Settings → Secrets and variables → Actions):

| Secret                               | Value                                |
| ------------------------------------ | ------------------------------------ |
| `TAURI_SIGNING_PRIVATE_KEY`          | Contents of `~/.tauri/grimorium.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password from step 1 (empty if none) |
| `ANDROID_KEY_BASE64`                 | `base64 -w 0 grimorium.jks` output   |
| `ANDROID_KEY_ALIAS`                  | `grimorium`                          |
| `ANDROID_KEY_PASSWORD`               | Password from step 2                 |

**4. Tag and release:**

```bash
git tag v0.1.0
git push --tags
```

The release workflow builds Windows (.msi/.exe), Mac (.dmg), and Android (.apk) installers and attaches them to a draft GitHub Release. Delete the local `grimorium.jks` after uploading — it only needs to exist in GitHub Secrets.

---

## Support

If you find the project useful and want to support its development:

[https://buymeacoffee.com/csansoon](https://buymeacoffee.com/csansoon)

---

## License

MIT
