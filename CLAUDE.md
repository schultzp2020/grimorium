# Grimorium — Agent Manual

**Blood on the Clocktower** storyteller companion app. React 19, TypeScript, Vite 8, Tailwind CSS 4, Radix UI, XState 5, TanStack Router. The storyteller controls the device at all times and shows the screen to players when needed.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Event-Sourced Game State](#2-event-sourced-game-state)
3. [The Game Controller](#3-the-game-controller)
4. [The XState Game Machine](#4-the-xstate-game-machine)
5. [Roles](#5-roles)
6. [Effects](#6-effects)
7. [The Intent Pipeline](#7-the-intent-pipeline)
8. [The Perception System](#8-the-perception-system)
9. [Day Actions & Night Follow-Ups](#9-day-actions--night-follow-ups)
10. [Win Conditions](#10-win-conditions)
11. [Internationalization (i18n)](#11-internationalization-i18n)
12. [How to Implement a New Role](#12-how-to-implement-a-new-role)
13. [How to Implement a New Effect](#13-how-to-implement-a-new-effect)
14. [Testing](#14-testing)
15. [Rules and Anti-Patterns](#15-rules-and-anti-patterns)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    XState gameMachine                        │
│            (State machine + event handler)                   │
│                            │                                │
│    ┌───────────────────────┼──────────────────────────┐     │
│    │                       │                          │     │
│    ▼                       ▼                          ▼     │
│  Screen components     game.ts                   Pipeline   │
│  (DayPhase,         (Game controller)          (Intent      │
│   NightDashboard,      │                      resolution,   │
│   VotingPhase, ...)    │                      Perception)   │
│                        │                          │         │
│                        ▼                          │         │
│                   Event-sourced state             │         │
│                   (Game.history)                  │         │
│                        ▲                          │         │
│                        │                          │         │
│              ┌─────────┼─────────┐               │         │
│              │         │         │               │         │
│              ▼         ▼         ▼               ▼         │
│           Roles    Effects    Teams           Resolvers     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Event Sourcing** — All changes are appended as `HistoryEntry` objects to `game.history`. Each entry contains an immutable `stateAfter` snapshot.

2. **Modularity through Pipelines** — Roles and effects never reference each other. Interactions happen through the **Intent Pipeline**: roles emit intents, effects register handlers to intercept/modify/prevent them.

3. **Perception over Identity** — Information roles never check a player's actual role directly. They use `perceive()`, which allows effects to modify how a player is perceived.

4. **Effects carry behavior** — Roles are thin. Passive abilities live on **Effects** attached via `initialEffects`. Effects declare intent handlers, day actions, win conditions, and perception modifiers.

5. **No hardcoded role logic in the game controller** — `game.ts` knows nothing about individual roles.

---

## 2. Event-Sourced Game State

**File:** `src/lib/types.ts`

```typescript
type Phase = 'setup' | 'night' | 'day' | 'ended'

type Game = {
  id: string; name: string; createdAt: number; scriptId: string
  history: HistoryEntry[]
}

type HistoryEntry = {
  id: string; timestamp: number; type: EventType
  message: RichMessage; data: Record<string, unknown>
  stateAfter: GameState
}

type GameState = {
  phase: Phase; round: number  // 0 = setup, 1+ = game rounds
  players: PlayerState[]; winner: Team | null
}

type PlayerState = {
  id: string; name: string; roleId: string
  effects: EffectInstance[]
}

type EffectInstance = {
  id: string; type: string; data?: Record<string, unknown>
  sourcePlayerId?: string; expiresAt?: 'end_of_night' | 'end_of_day' | 'never'
}
```

State evolves via `addHistoryEntry(game, entry, stateUpdates, addEffects, removeEffects, changeRoles)`. `getCurrentState(game)` returns the latest snapshot.

### Event Types

`game_created`, `night_started`, `role_revealed`, `night_action`, `night_skipped`, `night_resolved`, `day_started`, `nomination`, `vote`, `execution`, `virgin_execution`, `virgin_spent`, `slayer_shot`, `effect_added`, `effect_removed`, `role_changed`, `role_change_revealed`, `setup_action`, `game_ended`.

---

## 3. The Game Controller

**File:** `src/lib/game.ts`

Pure functions: `Game → Game`. Zero knowledge of individual roles.

| Function | Purpose |
|---|---|
| `createGame(name, scriptId, players)` | Creates game, applies `initialEffects` |
| `getNextStep(game)` | Returns next `GameStep` |
| `startNight(game)` | Night phase, increment round |
| `startDay(game)` | Resolve night, announce deaths, expire effects |
| `applyNightAction(game, result)` | Apply direct entries/effects from night action |
| `skipNightAction(game, roleId, playerId)` | Skip a role's night action |
| `processAutoSkips(game)` | Auto-skip roles where `shouldWake` returns false |
| `nominate(game, nominatorId, nomineeId)` | Send nomination through pipeline |
| `resolveVote(game, nomineeId, voteCount, votedIds)` | Process vote result |
| `executeAtEndOfDay(game)` | Execute the player on the block via pipeline |
| `getBlockStatus(game)` | Who's on the block |
| `checkWinCondition(state, game)` | Core + dynamic win conditions |
| `checkEndOfDayWinConditions(state, game)` | End-of-day trigger win conditions |
| `endGame(game, winner)` | End game with winner |
| `applySetupAction(game, playerId, result)` | Pre-revelation setup (e.g., Drunk) |
| `addEffectToPlayer(game, playerId, effectType, data)` | Narrator adds effect |
| `updateEffectData(game, playerId, effectType, data)` | Narrator updates effect data |
| `removeEffectFromPlayer(game, playerId, effectType)` | Narrator removes effect |
| `getNightRolesStatus(game)` | Night dashboard role status list |
| `getVoteThreshold(state)` | Votes needed for execution |
| `markRoleRevealed(game, playerId)` | Mark a role as revealed |

**Night action flow**: `applyNightAction()` applies direct changes (entries, effects, role changes). The `intent` field (if present) is resolved separately by the XState machine via `resolveIntent()`, because the pipeline may return `needs_input` requiring UI.

---

## 4. The XState Game Machine

**Files:** `src/lib/machine/gameMachine.ts`, `src/lib/machine/types.ts`, `src/lib/machine/actions.ts`, `src/lib/machine/guards.ts`

The game machine (XState v5 setup API) manages all screen transitions and game flow. `GameScreen.tsx` is a thin UI renderer that reads `snapshot.matches()` and dispatches events via `send()`.

### State Hierarchy

```
setup
  ├─ actions_list         (setup actions screen)
  └─ action               (individual setup action in progress)

revelation
  ├─ list                 (role revelation list)
  └─ showing_role         (player seeing their role)

playing
  ├─ night
  │  ├─ dashboard         (night action list)
  │  ├─ action            (active night action)
  │  ├─ follow_up         (reactive night follow-up)
  │  └─ pipeline_input    (pipeline requesting UI)
  ├─ death_reveal         (death reveal queue processing)
  ├─ death_reveal_to_night (transitioning to night after reveals)
  ├─ dawn                 (dawn screen announcing deaths)
  └─ day
     ├─ main              (day phase: nominations + day actions)
     ├─ nomination        (nomination screen)
     ├─ voting            (voting on nominated player)
     └─ action            (day action UI)

game_over                 (final screen with results)
```

### Key Machine Events

`OPEN_SETUP_ACTION`, `SETUP_ACTION_COMPLETE`, `REVEAL_ROLE`, `ROLE_REVEAL_DISMISS`, `START_FIRST_NIGHT`, `OPEN_NIGHT_ACTION`, `NIGHT_ACTION_COMPLETE`, `NIGHT_ACTION_SKIP`, `OPEN_NIGHT_FOLLOW_UP`, `NIGHT_FOLLOW_UP_COMPLETE`, `START_DAY`, `DAWN_CONTINUE`, `OPEN_NOMINATION`, `NOMINATE`, `VOTE_COMPLETE`, `CANCEL_VOTE`, `OPEN_DAY_ACTION`, `DAY_ACTION_COMPLETE`, `END_DAY`, `DEATH_REVEAL_CONTINUE`, `PIPELINE_INPUT_COMPLETE`, `ADD_EFFECT`, `REMOVE_EFFECT`, `UPDATE_EFFECT`, `SET_PLAYER_FACING`.

### Critical Flow: Night → Day

```
Night Dashboard → OPEN_NIGHT_ACTION → NightAction component
  → NIGHT_ACTION_COMPLETE → applies direct changes
    → if intent: resolveIntent() through pipeline
      → resolved/prevented: apply changes, check win, back to dashboard
      → needs_input: transition to pipeline_input screen
  → all actions done → START_DAY
    → death reveals (if any) → DAWN_CONTINUE → Day
```

---

## 5. Roles

**Files:** `src/lib/roles/types.ts`, `src/lib/roles/index.ts`, `src/lib/roles/definition/`

### File Structure

Each role lives in its own directory: `definition/<script>/<role-name>/`

```
definition/
├── villager/          index.ts, index.test.ts, i18n/en.ts, i18n/es.ts
├── imp/               index.ts, index.test.ts, i18n/en.ts, i18n/es.ts
└── trouble-brewing/
    ├── chef/          index.ts, index.test.ts, i18n/en.ts, i18n/es.ts
    ├── empath/        ...
    └── ...
```

### Current Roles (23)

| Role | Team | Night Action | Pattern |
|---|---|---|---|
| `villager` | townsfolk | none | Passive, no abilities |
| `washerwoman` | townsfolk | yes | Info: narrator-setup, first night only |
| `librarian` | townsfolk | yes | Info: narrator-setup, first night only |
| `investigator` | townsfolk | yes | Info: narrator-setup, first night only |
| `chef` | townsfolk | yes | Info: auto-calc alignment, first night only |
| `empath` | townsfolk | yes | Info: auto-calc alignment, every night |
| `fortune_teller` | townsfolk | yes | Info: boolean result, every night |
| `undertaker` | townsfolk | yes | Info: death-triggered (execution), skips night 1 |
| `monk` | townsfolk | yes | Action: applies `safe` effect, skips night 1 |
| `ravenkeeper` | townsfolk | yes | Info: death-triggered (own death) |
| `soldier` | townsfolk | none | Passive via `safe` effect (permanent) |
| `virgin` | townsfolk | none | Passive via `pure` effect |
| `slayer` | townsfolk | none | Passive via `slayer_bullet` day action |
| `mayor` | townsfolk | none | Passive via `deflect` effect + win condition |
| `saint` | townsfolk | none | Passive via `martyrdom` effect |
| `butler` | outsider | yes | Action: chooses master, `butler_master` effect |
| `drunk` | outsider | setup action | Narrator picks believed role, permanent malfunction |
| `recluse` | outsider | none | Passive via `misregister` effect |
| `baron` | minion | none | Passive, `distributionModifier: { outsider: +2, townsfolk: -2 }` |
| `spy` | minion | yes | Info: sees grimoire (read-only), every night |
| `scarlet_woman` | minion | none | Passive via `demon_successor` effect |
| `poisoner` | minion | yes | Action: applies `poisoned` effect, every night |
| `imp` | demon | yes | Action: kill intent, self-starpass |

### RoleDefinition

```typescript
interface RoleDefinition {
  id: RoleId
  team: TeamId
  icon: IconName
  nightOrder: number | null           // Lower = wakes earlier. null = doesn't wake
  distributionModifier?: Partial<Record<TeamId, number>>
  shouldWake?: (game, player) => boolean
  initialEffects?: EffectToAdd[]
  winConditions?: WinConditionCheck[]
  nightSteps?: NightStepDefinition[]  // Step list metadata for NightStepListLayout
  RoleReveal: FC<RoleRevealProps>
  NightAction: FC<NightActionProps> | null
  SetupAction?: FC<SetupActionProps>
}
```

### NightActionResult

```typescript
interface NightActionResult {
  entries: Omit<HistoryEntry, 'id' | 'timestamp' | 'stateAfter'>[]
  stateUpdates?: Partial<GameState>
  addEffects?: Record<string, EffectToAdd[]>
  removeEffects?: Record<string, string[]>
  changeRoles?: Record<string, string>     // playerId -> new roleId
  intent?: Intent                           // Sent through pipeline
}
```

`entries`, `stateUpdates`, `addEffects`, `removeEffects`, `changeRoles` are applied **directly**. The `intent` goes through the pipeline.

### Night Action Steps

Every `NightAction` starts with `NightStepListLayout` as a landing page. Roles declare `nightSteps` for metadata; the component builds a `NightStep[]` array at runtime combining metadata with status tracking. The narrator sees all steps before any player-facing screen appears.

### Setup Actions

Roles with `SetupAction` are configured **before** role revelation. Currently only Drunk (narrator picks believed Townsfolk role).

### Registering a New Role

1. Create directory `src/lib/roles/definition/<script>/<role-name>/` with `index.ts`, `index.test.ts`, `i18n/en.ts`, `i18n/es.ts`
2. Add `RoleId` to the union in `src/lib/roles/types.ts`
3. Register in `src/lib/roles/index.ts` (`ROLES` map + `SCRIPTS` entry)

---

## 6. Effects

**Files:** `src/lib/effects/types.ts`, `src/lib/effects/index.ts`, `src/lib/effects/definition/`

### File Structure

Each effect lives in `definition/<effect-name>/` with `index.ts` (or `.tsx`), `index.test.ts`, `i18n/en.ts`, `i18n/es.ts`.

### Current Effects (15)

| Effect | Purpose | Key Features |
|---|---|---|
| `dead` | Player is dead | `preventsNightWake`, conditional voting (one dead vote) |
| `used_dead_vote` | Dead player used their vote | `preventsVoting` |
| `safe` | Protection from death | Handler: prevents kill intents (priority 10) |
| `red_herring` | Fortune Teller false positive | Marker, checked directly by FT |
| `pure` | Virgin: nominator executed | Handler: intercepts nominations |
| `slayer_bullet` | One-shot day kill | Day action: SlayerActionScreen |
| `deflect` | Mayor: redirects kills | Handler: requests UI, redirects kill (priority 5) |
| `martyrdom` | Saint: evil wins if executed | Win condition: `after_execution` |
| `demon_successor` | Scarlet Woman: becomes Demon | Handler: piggybacks role change + `pending_role_reveal` |
| `misregister` | Recluse/Spy: perceived differently | Perception modifiers + `canRegisterAs`. Configured per-instance via `data.canRegisterAs` |
| `pending_role_reveal` | Signals role change needs reveal | Night follow-up: shows RoleCard |
| `poisoned` | Ability malfunction (temporary) | `poisonsAbility: true`, expires end of day |
| `drunk` | Permanent malfunction | `poisonsAbility: true`, perception: always Drunk/Outsider |
| `butler_master` | Butler's chosen master | Marker, `canVote` restricts voting to match master |
| `imp_starpass_pending` | Imp self-kill: starpass pending | Night follow-up for Imp → minion role change |

### EffectDefinition

```typescript
interface EffectDefinition {
  id: EffectId
  icon: IconName
  preventsNightWake?: boolean
  preventsVoting?: boolean
  preventsNomination?: boolean
  poisonsAbility?: boolean                        // Malfunction flag
  canVote?: (player, state, votes?) => boolean    // Conditional voting
  canNominate?: (player, state) => boolean
  handlers?: IntentHandler[]                      // Pipeline integration
  dayActions?: DayActionDefinition[]
  nightFollowUps?: NightFollowUpDefinition[]
  winConditions?: WinConditionCheck[]
  perceptionModifiers?: PerceptionModifier[]
  canRegisterAs?: { teams?: TeamId[]; alignments?: ('good' | 'evil')[] }
  defaultType?: EffectType                        // Badge styling
  getType?: (instance: EffectInstance) => EffectType
  Description?: FC<EffectDescriptionProps>         // Custom rich description
  ConfigEditor?: FC<EffectConfigEditorProps>        // Narrator configuration UI
}
```

`EffectType`: `'buff' | 'nerf' | 'marker' | 'passive' | 'perception' | 'pending'`

### Effect Lifecycle

- **Created** via `initialEffects`, `addEffects` in results, or narrator UI
- **Expires** at `"end_of_night"`, `"end_of_day"`, or `"never"` — handled by `expireEffects()` during phase transitions
- **Managed** manually via Grimoire UI (`EditEffectsModal`), which uses `ConfigEditor` if the effect defines one

### The Malfunction System

Effects with `poisonsAbility: true` cause malfunction. `isMalfunctioning(player)` checks for any such effect.

| Role Category | Malfunction Behavior |
|---|---|
| Info roles (auto-calc) | Narrator picks false result via `MalfunctionConfigStep` |
| Info roles (narrator-setup) | Narrator freely picks any players/roles |
| Info roles (death-triggered) | Narrator picks false role via `MalfunctionConfigStep` |
| Info roles (boolean) | Narrator picks true/false via `MalfunctionConfigStep` |
| Action roles | Effect/intent conditionally omitted |
| Passive handlers | `collectActiveHandlers()` skips malfunctioning players automatically |
| Win conditions | `checkDynamicWinConditions()` skips malfunctioning players automatically |

### Registering a New Effect

1. Create directory `src/lib/effects/definition/<effect-name>/` with `index.ts`, `index.test.ts`, `i18n/en.ts`, `i18n/es.ts`
2. Add `EffectId` to the union in `src/lib/effects/types.ts`
3. Register in `src/lib/effects/index.ts`

---

## 7. The Intent Pipeline

**Files:** `src/lib/pipeline/types.ts`, `src/lib/pipeline/index.ts`, `src/lib/pipeline/resolvers.ts`

### Intent Types

```typescript
type KillIntent = { type: 'kill'; sourceId: string; targetId: string; cause: string }
type NominateIntent = { type: 'nominate'; nominatorId: string; nomineeId: string }
type ExecuteIntent = { type: 'execute'; playerId: string; cause: string }
type Intent = KillIntent | NominateIntent | ExecuteIntent
```

### Pipeline Flow

1. `collectActiveHandlers()` gathers handlers from all players' effects (skips malfunctioning players)
2. Sort by priority (ascending)
3. For each handler where `appliesTo()` returns true, call `handle()`:
   - `allow` → merge stateChanges, continue
   - `prevent` → merge stateChanges, stop pipeline
   - `redirect` → merge stateChanges, restart with new intent
   - `request_ui` → pause, show UI, resume with narrator input
4. If not prevented → default resolver runs
5. Return `PipelineResult` (resolved | prevented | needs_input)

### Default Resolvers

| Intent | Default Action |
|---|---|
| `kill` | Adds `dead` effect to target |
| `nominate` | Creates nomination entry |
| `execute` | Creates execution entry, adds `dead` effect |

### Priority Conventions

| Priority | Use Case |
|---|---|
| 1-5 | Redirects (Deflect/Mayor) |
| 6-10 | Protection (Safe/Soldier) |
| 11-20 | Modification |
| 21+ | Observation |

---

## 8. The Perception System

**Files:** `src/lib/pipeline/perception.ts`

Info roles call `perceive(target, observer, context, state)` instead of checking actual identity. Returns `{ roleId, team, alignment }`.

### Contexts

| Context | Used By | Queries |
|---|---|---|
| `"alignment"` | Chef, Empath | Good or evil? |
| `"team"` | Washerwoman, Librarian, Investigator | Which team? |
| `"role"` | Fortune Teller, Undertaker, Ravenkeeper | Which role? |

### Perception Utilities

- **`getAmbiguousPlayers(players, context)`** — Returns players with effects declaring `canRegisterAs` for the context. Used to decide if a `PerceptionConfigStep` is needed.
- **`applyPerceptionOverrides(state, overrides)`** — Creates ephemeral copy of state with perception data injected. Never emits game events.
- **`canRegisterAsAlignment(player, alignment)`** / **`canRegisterAsTeam(player, team)`** — Check if a player has misregistration effects.

### PerceptionConfigStep

Narrator-only screen where ambiguous players' registrations are configured. Returns overrides passed to `applyPerceptionOverrides()`.

---

## 9. Day Actions & Night Follow-Ups

Both are declared on effects and collected dynamically.

**Day actions** — `getAvailableDayActions(state, t)` collects from all players' effects. Currently: Slayer Shot.

**Night follow-ups** — `getAvailableNightFollowUps(state, game, t)` collects from all players' effects. Appear in Night Dashboard after regular actions. Currently: Role Change Reveal (`pending_role_reveal`), Imp Starpass (`imp_starpass_pending`).

Follow-ups disappear when done — the completion handler removes the triggering effect, which makes the condition false.

---

## 10. Win Conditions

### Core (in `game.ts`)

- **Good wins** if all demons are dead
- **Evil wins** if living demons >= living non-demon players (2+ alive)

### Dynamic (on effects/roles)

| Source | Trigger | Condition |
|---|---|---|
| `martyrdom` effect (Saint) | `after_execution` | Evil wins if Saint is executed |
| `mayor` role | `end_of_day` | Good wins if 3 alive, no execution, Mayor alive |

`checkDynamicWinConditions()` skips malfunctioning players automatically.

---

## 11. Internationalization (i18n)

**Files:** `src/lib/i18n/`

Languages: English (`en`), Spanish (`es`). Each role and effect has its own `i18n/en.ts` and `i18n/es.ts` files co-located in its directory.

```typescript
const { t } = useI18n()
// t.game.*, t.roles.*, t.effects.*, t.teams.*, etc.
```

Global translations in `src/lib/i18n/translations/en.ts` and `es.ts`. Type in `src/lib/i18n/types.ts`.

---

## 12. How to Implement a New Role

1. **Decide the category**: night action, passive (via effects), info (via `perceive()`)?

2. **Create the directory**: `src/lib/roles/definition/<script>/<role-name>/` with `index.ts`, `index.test.ts`, `i18n/en.ts`, `i18n/es.ts`

3. **NightAction**: Must start with `NightStepListLayout`. Use `useState` for step/phase tracking. Add perception config step if using `perceive()` with `getAmbiguousPlayers()`. Add malfunction support via `isMalfunctioning()` + `MalfunctionConfigStep`.

4. **Register**: Add to `RoleId` union in `types.ts`, register in `index.ts` (`ROLES` + `SCRIPTS`)

5. **Effects**: Create effect definitions for passive abilities. Never put passive logic directly on the role.

6. **Never modify `game.ts`** for role-specific logic.

---

## 13. How to Implement a New Effect

1. **Create directory**: `src/lib/effects/definition/<effect-name>/` with `index.ts`, `index.test.ts`, `i18n/en.ts`, `i18n/es.ts`

2. **Register**: Add to `EffectId` union in `types.ts`, register in `index.ts`

3. **Wire up**: Assign via `initialEffects` on a role, or add dynamically via `addEffects`

### Capability Reference

| I want to... | Use... |
|---|---|
| Prevent a kill | `handlers` with `intentType: "kill"`, return `prevent` |
| Redirect a kill | `handlers` with `intentType: "kill"`, return `redirect` |
| Need narrator input during pipeline | `handlers` returning `request_ui` |
| Day-phase ability | `dayActions` |
| Reactive night action | `nightFollowUps` |
| Role change reveal | Add `pending_role_reveal` effect |
| Custom win condition | `winConditions` |
| Alter perceived identity | `perceptionModifiers` + `canRegisterAs` |
| Malfunction a player | `poisonsAbility: true` |
| Prevent night wake | `preventsNightWake: true` |
| Prevent voting | `preventsVoting: true` or `canVote` |

---

## 14. Testing

**Framework:** Vitest + Testing Library + jsdom

```bash
npm test              # run all
npm test Chef         # pattern match
npm run lint          # oxlint (type-aware)
npm run format        # oxfmt
```

### Structure

Tests are co-located with their source:

```
src/lib/
├── __tests__/
│   ├── helpers.ts              # makePlayer, makeState, makeGame, addEffectTo, etc.
│   ├── game.test.ts
│   ├── pipeline.test.ts
│   ├── perception.test.ts
│   ├── effects.test.ts
│   ├── winConditions.test.ts
│   ├── nightFollowUps.test.ts
│   └── roleAssignment.test.ts
├── roles/definition/<role>/index.test.ts
├── effects/definition/<effect>/index.test.ts
└── machine/
    ├── gameMachine.test.ts
    ├── actions.test.ts
    ├── guards.test.ts
    ├── integration.test.ts
    └── pipelineFlow.test.ts
```

### What to Test

| Category | Test |
|---|---|
| Info roles | `shouldWake`, perception integration (false positives + negatives) |
| Action roles | `shouldWake` conditions |
| Passive roles | Empty test delegating to effect test |
| Effect handlers | `appliesTo` guard, `handle` logic, stateChanges |
| Effect day/night actions | `condition` function |
| Win conditions | `check` with various states |
| Malfunction | `poisonsAbility`, pipeline skipping |

### Perception Deception Testing

Mock `getEffect` to inject test effects with perception modifiers. Always test both directions: false positive (good appearing evil) and false negative (evil appearing good).

### Test Helpers (`src/lib/__tests__/helpers.ts`)

`makePlayer()`, `addEffectTo()`, `makeState()`, `makeGame()`, `makeGameWithHistory()`, `makeStandardPlayers()`, `resetPlayerCounter()`.

---

## 15. Rules and Anti-Patterns

### DO

- Use `perceive()` in all information roles — never check actual role/team directly
- Emit intents for interceptable actions (kills, nominations, executions)
- Put passive abilities on effects, not roles
- Return `stateChanges` from handlers — never mutate state
- Use `expiresAt` for temporary effects
- Use i18n keys for all user-facing text
- Start every NightAction with `NightStepListLayout`
- Use `getAmbiguousPlayers()` to detect perception ambiguity — never hardcode role checks
- Use `isMalfunctioning()` — never hardcode `"poisoned"` or `"drunk"` checks
- Add malfunction support to every new role with a night action

### DON'T

- Never add role-specific logic to `game.ts`
- Never import one role from another role's definition
- Never import effect definitions from role definitions
- Never mutate state — always return new objects
- Never skip the pipeline for interceptable actions
- Never check `player.roleId` for team/alignment in info role logic
- Never hardcode effect checks in GameScreen, DayPhase, or NightDashboard
- Never skip the step list for NightAction components

### Handler Priority: 1-5 redirects, 6-10 protection, 11-20 modification, 21+ observation

### File Conventions

- Roles: `definition/<script>/<kebab-case>/index.ts` + `i18n/`
- Effects: `definition/<kebab-case>/index.ts` + `i18n/`
- `.tsx` for files with JSX, `.ts` otherwise

### Import Rules

- Roles import from: `../types`, `../../types`, `../../i18n`, `../../effects` (for `isMalfunctioning`), `../../pipeline` (for `perceive`, `getAmbiguousPlayers`, `applyPerceptionOverrides`), UI components
- Effects import from: `../types`, `../../pipeline/types`, `../../types`, UI components
- Pipeline imports from: `../types`, `../effects`, `../roles/index`, `../teams`
- `game.ts` imports from: `./types`, `./roles`, `./pipeline`, `./roles/types`

### CI/CD

GitHub Actions (`.github/workflows/deploy.yml`): format check → lint → test → build → deploy to GitHub Pages. Failing tests block deployment.
