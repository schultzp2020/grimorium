import { useMemo, useState } from 'react'

import { type NightRoleStatus, getNightActionSummary, getNightRolesStatus } from '../../lib/game'
import { getRoleName, useI18n } from '../../lib/i18n'
import { getAvailableNightFollowUps } from '../../lib/pipeline'
import type { AvailableNightFollowUp } from '../../lib/pipeline/types'
import { getRole } from '../../lib/roles/registry'
import { getTeam } from '../../lib/teams'
import type { Game, GameState, PlayerState, RichMessage } from '../../lib/types'
import { cn } from '../../lib/utils'
import { Button, Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, Icon } from '../atoms'
import type { IconName } from '../atoms/icon'
import { MysticDivider } from '../items'
import { Grimoire } from '../items/Grimoire'
import { RichMessage as RichMessageDisplay } from '../items/RichMessage'
import { ScreenFooter } from '../layouts/ScreenFooter'

// ============================================================================
// UNIFIED NIGHT DASHBOARD ITEM
// ============================================================================

type NightDashboardItem =
  | { type: 'night_action'; data: NightRoleStatus }
  | { type: 'night_follow_up'; data: AvailableNightFollowUp }

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  game: Game
  state: GameState
  onOpenNightAction: (playerId: string, roleId: string) => void
  onOpenNightFollowUp: (followUp: AvailableNightFollowUp) => void
  onStartDay: () => void
  onMainMenu: () => void
  onShowRoleCard?: (player: PlayerState) => void
  onEditEffects?: (player: PlayerState) => void
  onOpenGrimoirePlayer?: (player: PlayerState) => void
}

export function NightDashboard({
  game,
  state,
  onOpenNightAction,
  onOpenNightFollowUp,
  onStartDay,
  onMainMenu,
  onShowRoleCard,
  onEditEffects,
  onOpenGrimoirePlayer,
}: Props) {
  const { t } = useI18n()
  const [grimoireExpanded, setGrimoireExpanded] = useState(false)
  const [reviewPlayerId, setReviewPlayerId] = useState<string | null>(null)

  // Collect night actions and follow-ups separately, then merge
  const items: NightDashboardItem[] = useMemo(() => {
    const nightActions = getNightRolesStatus(game)
    const followUps = getAvailableNightFollowUps(state, game, t)

    const result: NightDashboardItem[] = nightActions.map((data) => ({
      type: 'night_action' as const,
      data,
    }))

    // Append follow-ups after regular night actions
    for (const followUp of followUps) {
      result.push({ type: 'night_follow_up' as const, data: followUp })
    }

    return result
  }, [game, state, t])

  // Derive next pending item and allDone from the unified list
  const nextPendingIndex = items.findIndex((item) => {
    if (item.type === 'night_action') {
      return item.data.status === 'pending'
    }
    // Follow-ups are always pending (they disappear when completed)
    return true
  })
  const allDone = nextPendingIndex === -1

  // Review dialog data
  const reviewMessages: RichMessage[] = useMemo(() => {
    if (!reviewPlayerId) {
      return []
    }
    return getNightActionSummary(game, reviewPlayerId)
  }, [game, reviewPlayerId])

  const reviewPlayer = reviewPlayerId ? state.players.find((p) => p.id === reviewPlayerId) : null

  return (
    <div className='flex min-h-app flex-col bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker'>
      {/* Header */}
      <div className='bg-gradient-to-b from-indigo-900/50 to-transparent px-4 py-4'>
        <div className='mx-auto max-w-lg'>
          {/* Menu button row */}
          <div className='mb-4 flex items-center'>
            <button
              type='button'
              onClick={onMainMenu}
              className='-ml-3 flex min-h-11 min-w-11 items-center justify-center p-3 text-parchment-500 transition-colors hover:text-parchment-200'
            >
              <Icon name='menu' size='md' />
            </button>
          </div>

          {/* Title section */}
          <div className='text-center'>
            <div className='mb-2 flex justify-center'>
              <Icon name='moon' size='3xl' className='text-indigo-400' />
            </div>
            <h1 className='font-tarot text-2xl tracking-widest-xl text-parchment-100 uppercase'>
              {t.game.night} {state.round}
            </h1>
            <p className='text-sm text-parchment-400'>{t.game.nightDashboardDescription}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 pb-4'>
        {/* Night Actions List */}
        <div className='mb-6'>
          <div className='mb-3 flex items-center gap-2 px-1'>
            <Icon name='moon' size='sm' className='text-indigo-400' />
            <span className='font-tarot text-sm tracking-wider text-parchment-100 uppercase'>
              {t.game.nightDashboard}
            </span>
          </div>
          <div className='space-y-2'>
            {items.map((item, index) =>
              item.type === 'night_action' ? (
                <NightActionRow
                  key={`action-${item.data.playerId}`}
                  roleStatus={item.data}
                  index={index + 1}
                  isNext={index === nextPendingIndex}
                  onOpen={() => onOpenNightAction(item.data.playerId, item.data.roleId)}
                  onReview={() => setReviewPlayerId(item.data.playerId)}
                />
              ) : (
                <NightFollowUpRow
                  key={`followup-${item.data.id}`}
                  followUp={item.data}
                  index={index + 1}
                  isNext={index === nextPendingIndex}
                  onOpen={() => onOpenNightFollowUp(item.data)}
                />
              ),
            )}
          </div>

          {allDone && items.length > 0 && (
            <div className='mt-4 text-center'>
              <p className='flex items-center justify-center gap-2 text-sm text-emerald-400'>
                <Icon name='checkCircle' size='sm' />
                {t.game.allActionsComplete}
              </p>
            </div>
          )}
        </div>

        <MysticDivider className='mb-6' />

        {/* Grimoire Section (collapsible, default collapsed) */}
        <div className='mb-6'>
          <button
            type='button'
            onClick={() => setGrimoireExpanded(!grimoireExpanded)}
            className='group mb-2 flex w-full items-center gap-2 px-1'
          >
            <Icon name='scrollText' size='sm' className='text-mystic-gold' />
            <span className='flex-1 text-left font-tarot text-sm tracking-wider text-parchment-100 uppercase'>
              {t.game.grimoire}
            </span>
            <Icon
              name={grimoireExpanded ? 'chevronUp' : 'chevronDown'}
              size='sm'
              className={cn(
                'transition-colors',
                grimoireExpanded ? 'text-parchment-400' : 'text-parchment-500 group-hover:text-parchment-300',
              )}
            />
          </button>
          {grimoireExpanded && (
            <div className='overflow-hidden rounded-xl border border-white/10 bg-white/5'>
              <Grimoire
                state={state}
                compact
                onPlayerSelect={onOpenGrimoirePlayer}
                onShowRoleCard={onShowRoleCard}
                onEditEffects={onEditEffects}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <ScreenFooter borderColor='border-indigo-500/30'>
        <Button onClick={onStartDay} disabled={!allDone} fullWidth size='lg' variant='ember'>
          <Icon name='sun' size='md' className='mr-2' />
          {t.game.proceedToDay}
        </Button>
      </ScreenFooter>

      {/* Review Action Summary Dialog */}
      <Dialog
        open={reviewPlayerId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReviewPlayerId(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.game.actionSummary}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {reviewPlayer && <p className='mb-3 text-sm font-medium text-parchment-300'>{reviewPlayer.name}</p>}
            {reviewMessages.length === 0 ? (
              <p className='text-sm text-parchment-500'>{t.game.noActionRecorded}</p>
            ) : (
              <div className='space-y-2'>
                {reviewMessages.map((msg, i) => (
                  <div key={i} className='rounded-lg bg-white/5 p-3 text-sm text-parchment-300'>
                    <RichMessageDisplay message={msg} state={state} />
                  </div>
                ))}
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// NIGHT ACTION ROW (regular night actions from roles)
// ============================================================================

function NightActionRow({
  roleStatus,
  index,
  isNext,
  onOpen,
  onReview,
}: {
  roleStatus: NightRoleStatus
  index: number
  isNext: boolean
  onOpen: () => void
  onReview: () => void
}) {
  const { language } = useI18n()
  const role = getRole(roleStatus.roleId)
  const team = role ? getTeam(role.team) : null

  const roleName = useMemo(() => getRoleName(roleStatus.roleId, language), [roleStatus.roleId, language])

  const isDone = roleStatus.status === 'done'

  return (
    <DashboardRow
      index={index}
      isNext={isNext}
      isDone={isDone}
      icon={role?.icon ?? 'user'}
      label={roleName}
      sublabel={roleStatus.playerName}
      isEvil={team?.isEvil}
      onOpen={onOpen}
      onReview={onReview}
    />
  )
}

// ============================================================================
// NIGHT FOLLOW-UP ROW (reactive follow-ups from effects)
// ============================================================================

function NightFollowUpRow({
  followUp,
  index,
  isNext,
  onOpen,
}: {
  followUp: AvailableNightFollowUp
  index: number
  isNext: boolean
  onOpen: () => void
}) {
  return (
    <DashboardRow
      index={index}
      isNext={isNext}
      isDone={false}
      icon={followUp.icon}
      label={followUp.label}
      sublabel={followUp.playerName}
      isFollowUp
      onOpen={onOpen}
    />
  )
}

// ============================================================================
// SHARED ROW COMPONENT
// ============================================================================

function DashboardRow({
  index,
  isNext,
  isDone,
  icon,
  label,
  sublabel,
  isEvil,
  isFollowUp,
  onOpen,
  onReview,
}: {
  index: number
  isNext: boolean
  isDone: boolean
  icon: IconName
  label: string
  sublabel: string
  isEvil?: boolean
  isFollowUp?: boolean
  onOpen: () => void
  onReview?: () => void
}) {
  const { t } = useI18n()

  const isClickable = isNext || isDone
  const handleClick = () => {
    if (isNext) {
      onOpen()
    } else if (isDone && onReview) {
      onReview()
    }
  }

  const getStatusBadge = () => {
    if (isDone) {
      return (
        <span className='flex items-center gap-1 text-xs text-emerald-400'>
          <Icon name='checkCircle' size='sm' />
          {t.game.actionDone}
        </span>
      )
    }
    if (isNext) {
      return (
        <span className='flex items-center gap-1 text-xs text-indigo-300'>
          <Icon name='arrowRight' size='sm' />
          {t.game.nextAction}
        </span>
      )
    }
    return <span className='text-parchment-600 flex items-center gap-1 text-xs'>{t.game.actionPending}</span>
  }

  return (
    <button
      type='button'
      onClick={isClickable ? handleClick : undefined}
      disabled={!isClickable}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
        isNext
          ? isFollowUp
            ? 'bg-purple-900/30 border border-purple-500/40 hover:bg-purple-900/50 cursor-pointer'
            : 'bg-indigo-900/30 border border-indigo-500/40 hover:bg-indigo-900/50 cursor-pointer'
          : isDone
            ? 'bg-white/3 opacity-70 hover:opacity-90 cursor-pointer'
            : 'bg-white/2 opacity-50',
      )}
    >
      {/* Order number */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
          isNext
            ? isFollowUp
              ? 'bg-purple-500/30 text-purple-300 border border-purple-400/40'
              : 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/40'
            : isDone
              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
              : 'bg-white/5 text-parchment-600 border border-white/10',
        )}
      >
        {isDone ? <Icon name='check' size='xs' /> : index}
      </div>

      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border',
          isNext
            ? isFollowUp
              ? 'bg-purple-500/20 border-purple-400/30'
              : isEvil
                ? 'bg-red-900/30 border-red-600/30'
                : 'bg-indigo-500/20 border-indigo-400/30'
            : isDone
              ? 'bg-parchment-500/10 border-parchment-500/20'
              : 'bg-white/5 border-white/10',
        )}
      >
        <Icon
          name={icon}
          size='md'
          className={cn(
            isNext
              ? isFollowUp
                ? 'text-purple-300'
                : isEvil
                  ? 'text-red-400'
                  : 'text-indigo-300'
              : 'text-parchment-500',
          )}
        />
      </div>

      {/* Label & Sublabel */}
      <div className='min-w-0 flex-1'>
        <div
          className={cn(
            'font-medium text-sm',
            isNext ? 'text-parchment-100' : isDone ? 'text-parchment-400' : 'text-parchment-600',
          )}
        >
          {label}
        </div>
        <span
          className={cn(
            'text-xs',
            isNext ? (isFollowUp ? 'text-purple-400/80' : 'text-indigo-400/80') : 'text-parchment-600',
          )}
        >
          {sublabel}
        </span>
      </div>

      {/* Status Badge */}
      {getStatusBadge()}
    </button>
  )
}
