import { useCallback, useMemo, useState } from 'react'

import { isMalfunctioning } from '../../lib/effects/registry'
import { getRoleName, getRoleTranslations, useI18n } from '../../lib/i18n'
import { canRegisterAsTeam, perceive } from '../../lib/pipeline'
import { getAllRoles, getRole } from '../../lib/roles/registry'
import type { NightActionResult, RoleDefinition } from '../../lib/roles/types'
import { type TeamId, getTeam } from '../../lib/teams'
import type { GameState, PlayerState } from '../../lib/types'
import { Icon } from '../atoms'
import type { IconName } from '../atoms/icon'
import { PlayerPickerList, RolePickerGrid } from '../inputs'
import { AlertBox, InfoBox, RoleRevealBadge, StepSection } from '../items'
import { RoleCard } from '../items/RoleCard'
import { TeamBackground } from '../items/TeamBackground'
import {
  HandbackButton,
  HandbackCardLink,
  NarratorSetupLayout,
  NightActionLayout,
  NightStepListLayout,
  PlayerFacingScreen,
} from '../layouts'
import type { NightStep } from '../layouts'

// ============================================================================
// CONFIG TYPE
// ============================================================================

export interface InfoRoleConfig {
  roleId: string
  icon: IconName
  /** The team this role looks for (townsfolk, outsider, minion) */
  targetTeam: TeamId
  /** i18n keys for history entries */
  historyKeys: {
    discovered: string
    noTarget: string
  }
  /** Getter for role-specific labels from role translations */
  getLabels: (roleT: Record<string, string>) => {
    infoTitle: string
    noTargetTitle: string
    noTargetMessage: string
    noTargetConfirm: string
    showNoTargetLink: string
    mustIncludeTarget: string
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

type Phase = 'step_list' | 'select_players' | 'configure_malfunction' | 'show_results' | 'no_target_view'

interface Props {
  config: InfoRoleConfig
  state: GameState
  player: PlayerState
  onComplete: (result: NightActionResult) => void
}

export function InfoRoleNightAction({ config, state, player, onComplete }: Props) {
  const { t, language } = useI18n()
  const roleT = getRoleTranslations(config.roleId, language)
  const labels = config.getLabels(roleT)
  const [phase, setPhase] = useState<Phase>('step_list')
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [selectedTargetPlayer, setSelectedTargetPlayer] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [selectPlayersDone, setSelectPlayersDone] = useState(false)
  const [malfunctionConfigDone, setMalfunctionConfigDone] = useState(false)

  const malfunctioning = isMalfunctioning(player)
  const allPlayers = state.players

  // Annotation to highlight the current player in the picker
  const currentPlayerAnnotation = useMemo(
    () => ({
      [player.id]: t.game.currentPlayer,
    }),
    [player.id, t],
  )

  // All defined roles of target team (for malfunction role picker)
  const targetTeamAllRoles = useMemo(
    () => getAllRoles().filter((r) => r.team === config.targetTeam),
    [config.targetTeam],
  )

  // ================================================================
  // Player classification for smart grouping
  // ================================================================

  /** Players whose actual team or canRegisterAs includes the target team */
  const isTargetTeamPlayer = useCallback(
    (p: PlayerState): boolean => {
      const perception = perceive(p, player, 'team', state)
      return perception.team === config.targetTeam || canRegisterAsTeam(p, config.targetTeam)
    },
    [player, state, config.targetTeam],
  )

  const targetGroupPlayers = useMemo(() => allPlayers.filter(isTargetTeamPlayer), [allPlayers, isTargetTeamPlayer])
  const otherGroupPlayers = useMemo(
    () => allPlayers.filter((p) => !isTargetTeamPlayer(p)),
    [allPlayers, isTargetTeamPlayer],
  )

  // Is there at least one player who could be perceived as the target team?
  const hasTargetTeam = targetGroupPlayers.length > 0

  // ================================================================
  // Disabled logic for smart selection
  // ================================================================

  const disabledPlayerIds = useMemo(() => {
    const disabled = new Set<string>()

    if (selectedPlayers.length === 1) {
      const [selectedId] = selectedPlayers
      const selectedIsTarget = targetGroupPlayers.some((p) => p.id === selectedId)

      if (!selectedIsTarget) {
        // Selected one from "other" group — must pick from "target" group next
        for (const p of otherGroupPlayers) {
          if (p.id !== selectedId) {
            disabled.add(p.id)
          }
        }
      }
      // If selected is from target group, can pick from either — nothing disabled
    }

    return disabled
  }, [selectedPlayers, targetGroupPlayers, otherGroupPlayers])

  // ================================================================
  // Players in selection that are on the target team
  // ================================================================

  const targetsInSelection = selectedPlayers.filter((playerId) => {
    const p = state.players.find((pl) => pl.id === playerId)
    if (!p) {
      return false
    }
    const perception = perceive(p, player, 'team', state)
    return perception.team === config.targetTeam || canRegisterAsTeam(p, config.targetTeam)
  })

  // ================================================================
  // Role options for the picker (inline perception)
  // ================================================================

  const targetRoleOptions = useMemo(() => {
    const roleToPlayers = new Map<string, string[]>()
    const roles: RoleDefinition[] = []
    const seen = new Set<string>()

    for (const pid of targetsInSelection) {
      const p = state.players.find((pl) => pl.id === pid)
      if (!p) {
        continue
      }
      const pTeam = perceive(p, player, 'team', state)

      // If the player's actual team matches, show their perceived role
      // If the player can only register as target team (via misregistration), show ALL target team roles
      const pRoles =
        pTeam.team === config.targetTeam
          ? (() => {
              const rp = perceive(p, player, 'role', state)
              const r = getRole(rp.roleId)
              return r ? [r] : []
            })()
          : targetTeamAllRoles

      for (const role of pRoles) {
        const existing = roleToPlayers.get(role.id) ?? []
        if (!roleToPlayers.has(role.id)) {
          roleToPlayers.set(role.id, existing)
        }
        if (!existing.includes(pid)) {
          existing.push(pid)
        }
        if (!seen.has(role.id)) {
          seen.add(role.id)
          roles.push(role)
        }
      }
    }
    return { roles, roleToPlayers }
  }, [targetsInSelection, state, config.targetTeam, player, targetTeamAllRoles])

  // ================================================================
  // Completion checks
  // ================================================================

  // Healthy flow: can proceed when 2 players selected + target identified + role selected
  const canCompleteHealthySetup =
    selectedPlayers.length === 2 &&
    targetsInSelection.length >= 1 &&
    selectedTargetPlayer !== null &&
    selectedRoleId !== null

  // Malfunction flow: can proceed from select_players when 2 players selected
  const canCompleteMalfunctionSelect = selectedPlayers.length === 2

  // Malfunction flow: can proceed from configure_malfunction when role selected
  const canCompleteMalfunctionConfig = selectedRoleId !== null

  // ================================================================
  // Handlers
  // ================================================================

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers((prev) => {
      if (prev.includes(playerId)) {
        if (playerId === selectedTargetPlayer) {
          setSelectedTargetPlayer(null)
          setSelectedRoleId(null)
        }
        return prev.filter((id) => id !== playerId)
      } else if (prev.length < 2) {
        return [...prev, playerId]
      }
      return prev
    })
  }

  const handleSelectRole = (playerId: string, roleId: string) => {
    if (selectedRoleId === roleId) {
      setSelectedTargetPlayer(null)
      setSelectedRoleId(null)
    } else {
      setSelectedTargetPlayer(playerId)
      setSelectedRoleId(roleId)
    }
  }

  const handleMalfunctionSelectRole = (roleId: string) => {
    setSelectedRoleId((prev) => (prev === roleId ? null : roleId))
  }

  const handleCompleteSelectPlayers = () => {
    if (malfunctioning) {
      if (!canCompleteMalfunctionSelect) {
        return
      }
    } else if (!canCompleteHealthySetup) {
      return
    }
    setSelectPlayersDone(true)
    setPhase('step_list')
  }

  const handleCompleteMalfunctionConfig = () => {
    if (!selectedRoleId) {
      return
    }
    // Auto-assign target player for history (arbitrary — info is false)
    if (!selectedTargetPlayer) {
      setSelectedTargetPlayer(selectedPlayers[0])
    }
    setMalfunctionConfigDone(true)
    setPhase('step_list')
  }

  const handleCompleteNoTarget = () => {
    onComplete({
      entries: [
        {
          type: 'night_action',
          message: [
            {
              type: 'i18n',
              key: config.historyKeys.noTarget,
              params: { player: player.id },
            },
          ],
          data: {
            roleId: config.roleId,
            playerId: player.id,
            action: 'no_target',
            ...(malfunctioning ? { malfunctioned: true } : {}),
          },
        },
      ],
    })
  }

  const handleComplete = () => {
    if (!selectedTargetPlayer || !selectedRoleId) {
      return
    }

    const player1 = state.players.find((p) => p.id === selectedPlayers[0])
    const player2 = state.players.find((p) => p.id === selectedPlayers[1])
    if (!player1 || !player2) {
      return
    }

    onComplete({
      entries: [
        {
          type: 'night_action',
          message: [
            {
              type: 'i18n',
              key: config.historyKeys.discovered,
              params: {
                player: player.id,
                player1: player1.id,
                player2: player2.id,
                role: selectedRoleId,
              },
            },
          ],
          data: {
            roleId: config.roleId,
            playerId: player.id,
            action: 'see_target',
            shownPlayers: selectedPlayers,
            targetId: selectedTargetPlayer,
            shownRoleId: selectedRoleId,
            ...(malfunctioning ? { malfunctioned: true } : {}),
          },
        },
      ],
    })
  }

  const getLocalRoleName = (roleId: string) => getRoleName(roleId, language)

  const getPlayerName = (playerId: string) => state.players.find((p) => p.id === playerId)?.name ?? t.ui.unknown

  const targetTeamName = t.teams[config.targetTeam as keyof typeof t.teams].name
  const otherGroupLabel = t.game.otherPlayers

  // ================================================================
  // Build steps
  // ================================================================

  const steps: NightStep[] = useMemo(() => {
    const result: NightStep[] = []

    result.push({
      id: 'select_players',
      icon: config.icon,
      label: t.game.stepSelectPlayers,
      status: selectPlayersDone ? 'done' : 'pending',
      audience: 'narrator' as const,
    })

    if (malfunctioning) {
      result.push({
        id: 'configure_malfunction',
        icon: 'flask',
        label: t.game.stepConfigureMalfunction,
        status: malfunctionConfigDone ? 'done' : 'pending',
        audience: 'narrator' as const,
      })
    }

    result.push({
      id: 'show_results',
      icon: config.icon,
      label: t.game.stepShowResult,
      status: 'pending',
      audience: 'player_reveal' as const,
    })

    return result
  }, [selectPlayersDone, malfunctioning, malfunctionConfigDone, t, config.icon])

  const handleSelectStep = (stepId: string) => {
    if (stepId === 'select_players') {
      setPhase('select_players')
    } else if (stepId === 'configure_malfunction') {
      setPhase('configure_malfunction')
    } else if (stepId === 'show_results') {
      setPhase('show_results')
    }
  }

  // ================================================================
  // Phase: Step List
  // ================================================================
  if (phase === 'step_list') {
    return (
      <NightStepListLayout
        icon={config.icon}
        roleName={getLocalRoleName(config.roleId)}
        playerName={player.name}
        steps={steps}
        onSelectStep={handleSelectStep}
      />
    )
  }

  // ================================================================
  // Phase: Select Players (healthy, no target team among other players)
  // ================================================================
  if (phase === 'select_players' && !malfunctioning && !hasTargetTeam) {
    return (
      <NarratorSetupLayout
        audience='narrator'
        icon={config.icon}
        roleName={getLocalRoleName(config.roleId)}
        playerName={getPlayerName(player.id)}
        onShowToPlayer={() => setPhase('no_target_view')}
        showToPlayerLabel={labels.noTargetConfirm}
      >
        <div className='flex flex-1 items-center justify-center'>
          <InfoBox icon={config.icon} title={labels.noTargetTitle} description={labels.noTargetMessage} />
        </div>
      </NarratorSetupLayout>
    )
  }

  // ================================================================
  // Phase: Select Players (healthy — with constraints + role picking)
  // ================================================================
  if (phase === 'select_players' && !malfunctioning) {
    return (
      <NarratorSetupLayout
        audience='narrator'
        icon={config.icon}
        roleName={getLocalRoleName(config.roleId)}
        playerName={getPlayerName(player.id)}
        onShowToPlayer={handleCompleteSelectPlayers}
        showToPlayerDisabled={!canCompleteHealthySetup}
        showToPlayerLabel={t.common.confirm}
      >
        <StepSection step={1} label={t.game.selectTwoPlayers} count={{ current: selectedPlayers.length, max: 2 }}>
          <PlayerPickerList
            players={allPlayers}
            selected={selectedPlayers}
            onSelect={handlePlayerToggle}
            selectionCount={2}
            variant='blue'
            disabled={disabledPlayerIds}
            annotations={currentPlayerAnnotation}
            groups={[
              { label: targetTeamName, playerIds: targetGroupPlayers.map((p) => p.id) },
              { label: otherGroupLabel, playerIds: otherGroupPlayers.map((p) => p.id) },
            ]}
          />
        </StepSection>

        {selectedPlayers.length === 2 && targetsInSelection.length > 0 && (
          <StepSection step={2} label={t.game.selectWhichRoleToShow}>
            <RolePickerGrid
              roles={targetRoleOptions.roles}
              state={state}
              selected={selectedRoleId ? [selectedRoleId] : []}
              onSelect={(roleId) => {
                const pids = targetRoleOptions.roleToPlayers.get(roleId)
                if (pids?.[0]) {
                  handleSelectRole(pids[0], roleId)
                }
              }}
              selectionCount={1}
              colorMode='team'
            />
          </StepSection>
        )}

        {selectedPlayers.length === 2 && targetsInSelection.length === 0 && (
          <AlertBox message={labels.mustIncludeTarget} />
        )}
      </NarratorSetupLayout>
    )
  }

  // ================================================================
  // Phase: Select Players (malfunctioning — free selection)
  // ================================================================
  if (phase === 'select_players' && malfunctioning) {
    return (
      <NarratorSetupLayout
        audience='narrator'
        icon={config.icon}
        roleName={getLocalRoleName(config.roleId)}
        playerName={getPlayerName(player.id)}
        onShowToPlayer={handleCompleteSelectPlayers}
        showToPlayerDisabled={!canCompleteMalfunctionSelect}
        showToPlayerLabel={t.common.confirm}
      >
        {/* Malfunction warning */}
        <div className='mb-4 rounded-xl border border-amber-500/30 bg-amber-900/20 p-3'>
          <div className='flex items-center gap-2'>
            <Icon name='flask' size='md' className='flex-shrink-0 text-amber-400' />
            <p className='text-sm font-medium text-amber-300'>{t.game.malfunctionWarning}</p>
          </div>
          <p className='mt-1 ml-7 text-xs text-amber-400/70'>{t.game.playerIsMalfunctioning}</p>
        </div>

        <StepSection step={1} label={t.game.selectTwoPlayers} count={{ current: selectedPlayers.length, max: 2 }}>
          <PlayerPickerList
            players={allPlayers}
            selected={selectedPlayers}
            onSelect={handlePlayerToggle}
            selectionCount={2}
            variant='blue'
            annotations={currentPlayerAnnotation}
          />
        </StepSection>

        <div className='border-parchment-700/30 mt-4 border-t pt-4 text-center'>
          <button
            type='button'
            onClick={() => setPhase('no_target_view')}
            className='text-sm text-amber-400 underline underline-offset-2 hover:text-amber-300'
          >
            {labels.showNoTargetLink}
          </button>
        </div>
      </NarratorSetupLayout>
    )
  }

  // ================================================================
  // Phase: Configure Malfunction
  // ================================================================
  if (phase === 'configure_malfunction') {
    return (
      <NarratorSetupLayout
        icon={config.icon}
        roleName={getLocalRoleName(config.roleId)}
        playerName={getPlayerName(player.id)}
        onShowToPlayer={handleCompleteMalfunctionConfig}
        showToPlayerDisabled={!canCompleteMalfunctionConfig}
        showToPlayerLabel={t.common.confirm}
      >
        {/* Malfunction warning */}
        <div className='mb-4 rounded-xl border border-amber-500/30 bg-amber-900/20 p-3'>
          <div className='flex items-center gap-2'>
            <Icon name='flask' size='md' className='flex-shrink-0 text-amber-400' />
            <p className='text-sm font-medium text-amber-300'>{t.game.malfunctionWarning}</p>
          </div>
          <p className='mt-1 ml-7 text-xs text-amber-400/70'>{t.game.playerIsMalfunctioning}</p>
        </div>

        <StepSection step={1} label={t.game.chooseFalseRole}>
          <RolePickerGrid
            roles={targetTeamAllRoles}
            state={state}
            selected={selectedRoleId ? [selectedRoleId] : []}
            onSelect={handleMalfunctionSelectRole}
            selectionCount={1}
            colorMode='team'
          />
        </StepSection>
      </NarratorSetupLayout>
    )
  }

  // ================================================================
  // Phase: No Target View (player-facing)
  // ================================================================
  if (phase === 'no_target_view') {
    return (
      <PlayerFacingScreen playerName={player.name}>
        <NightActionLayout player={player} title={labels.infoTitle} description={labels.noTargetMessage}>
          <RoleRevealBadge icon='sparkles' roleName={labels.noTargetTitle} />

          <HandbackButton onClick={handleCompleteNoTarget} fullWidth size='lg' variant='night'>
            <Icon name='check' size='md' className='mr-2' />
            {t.common.iUnderstandMyRole}
          </HandbackButton>
        </NightActionLayout>
      </PlayerFacingScreen>
    )
  }

  // ================================================================
  // Phase: Show Results (player view)
  // ================================================================
  const player1 = state.players.find((p) => p.id === selectedPlayers[0])
  const player2 = state.players.find((p) => p.id === selectedPlayers[1])

  if (!selectedRoleId) {
    return null
  }

  const shownRole = getRole(selectedRoleId)
  const shownTeamId = shownRole?.team ?? 'townsfolk'
  const shownTeam = getTeam(shownTeamId)

  return (
    <PlayerFacingScreen playerName={player.name}>
      <TeamBackground teamId={shownTeamId}>
        <div
          className={`mx-auto mb-5 max-w-sm text-center text-sm ${shownTeam.isEvil ? 'text-red-300/80' : 'text-parchment-300/80'}`}
        >
          <p className='mb-3 font-semibold tracking-widest uppercase'>{t.game.oneOfThemIsThe}</p>
          <div className='flex flex-wrap items-center justify-center gap-2'>
            {player1 && (
              <span className='inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-base'>
                <Icon name='user' size='sm' />
                <span className='font-medium'>{player1.name}</span>
              </span>
            )}
            {player2 && (
              <span className='inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-base'>
                <Icon name='user' size='sm' />
                <span className='font-medium'>{player2.name}</span>
              </span>
            )}
          </div>
        </div>

        <RoleCard roleId={selectedRoleId} />

        <HandbackCardLink onClick={handleComplete} isEvil={shownTeam.isEvil}>
          {t.common.continue}
        </HandbackCardLink>
      </TeamBackground>
    </PlayerFacingScreen>
  )
}
