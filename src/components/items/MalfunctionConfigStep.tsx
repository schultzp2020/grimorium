import { useState } from 'react'

import { useI18n } from '../../lib/i18n'
import { getAllRoles } from '../../lib/roles/registry'
import type { GameState } from '../../lib/types'
import { cn } from '../../lib/utils'
import { Button, Icon } from '../atoms'
import type { IconName } from '../atoms/icon'
import { RolePickerGrid } from '../inputs/RolePickerGrid'
import { NarratorSetupLayout } from '../layouts'

interface NumberProps {
  type: 'number'
  roleIcon: IconName
  roleName: string
  playerName: string
  numberRange: { min: number; max: number }
  onComplete: (result: number) => void
}

interface BooleanProps {
  type: 'boolean'
  roleIcon: IconName
  roleName: string
  playerName: string
  trueLabel: string
  falseLabel: string
  onComplete: (result: boolean) => void
}

interface RoleProps {
  type: 'role'
  roleIcon: IconName
  roleName: string
  playerName: string
  state: GameState
  onComplete: (result: string) => void
}

type Props = NumberProps | BooleanProps | RoleProps

/**
 * A shared narrator-only component for configuring what a malfunctioning
 * player should see. Used when a player is poisoned/drunk.
 *
 * Variants:
 * - "number": Number picker (Chef, Empath)
 * - "boolean": Yes/No toggle (Fortune Teller)
 * - "role": Role picker from full role list (Undertaker, Ravenkeeper)
 */
export function MalfunctionConfigStep(props: Props) {
  const { t } = useI18n()

  return (
    <NarratorSetupLayout icon={props.roleIcon} roleName={props.roleName} playerName={props.playerName}>
      {/* Malfunction warning banner */}
      <div className='mb-4 rounded-xl border border-amber-500/30 bg-amber-900/20 p-3'>
        <div className='flex items-center gap-2'>
          <Icon name='flask' size='md' className='flex-shrink-0 text-amber-400' />
          <p className='text-sm font-medium text-amber-300'>{t.game.malfunctionWarning}</p>
        </div>
        <p className='mt-1 ml-7 text-xs text-amber-400/70'>{t.game.playerIsMalfunctioning}</p>
      </div>

      {props.type === 'number' && <NumberPicker {...props} />}
      {props.type === 'boolean' && <BooleanPicker {...props} />}
      {props.type === 'role' && <RolePicker {...props} />}
    </NarratorSetupLayout>
  )
}

// ============================================================================
// NUMBER PICKER
// ============================================================================

function NumberPicker({ numberRange, onComplete }: NumberProps) {
  const { t } = useI18n()
  const [value, setValue] = useState(numberRange.min)

  return (
    <div>
      <h3 className='mb-4 text-center text-lg font-semibold text-amber-200'>{t.game.chooseFalseNumber}</h3>

      <div className='mb-6 flex items-center justify-center gap-6'>
        <button
          type='button'
          onClick={() => setValue(Math.max(numberRange.min, value - 1))}
          disabled={value <= numberRange.min}
          className='flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-parchment-200 transition-all hover:bg-white/20 active:scale-[0.92] active:bg-white/25 disabled:cursor-not-allowed disabled:opacity-30'
        >
          <Icon name='minus' size='md' />
        </button>

        <div className='w-20 text-center font-tarot text-5xl text-amber-300'>{value}</div>

        <button
          type='button'
          onClick={() => setValue(Math.min(numberRange.max, value + 1))}
          disabled={value >= numberRange.max}
          className='flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-parchment-200 transition-all hover:bg-white/20 active:scale-[0.92] active:bg-white/25 disabled:cursor-not-allowed disabled:opacity-30'
        >
          <Icon name='plus' size='md' />
        </button>
      </div>

      <Button onClick={() => onComplete(value)} fullWidth size='lg' variant='night'>
        <Icon name='check' size='md' className='mr-2' />
        {t.common.confirm}
      </Button>
    </div>
  )
}

// ============================================================================
// BOOLEAN PICKER
// ============================================================================

function BooleanPicker({ trueLabel, falseLabel, onComplete }: BooleanProps) {
  const { t } = useI18n()
  const [selected, setSelected] = useState<boolean | null>(null)

  return (
    <div>
      <h3 className='mb-4 text-center text-lg font-semibold text-amber-200'>{t.game.chooseFalseResult}</h3>

      <div className='mb-6 space-y-2'>
        <button
          type='button'
          onClick={() => setSelected(true)}
          className={cn(
            'w-full p-4 rounded-lg border text-sm font-medium transition-all text-left active:scale-[0.98]',
            selected === true
              ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'
              : 'bg-white/5 border-white/10 text-parchment-400 hover:bg-white/10',
          )}
        >
          <Icon name='check' size='sm' className='mr-2 inline' />
          {trueLabel}
        </button>
        <button
          type='button'
          onClick={() => setSelected(false)}
          className={cn(
            'w-full p-4 rounded-lg border text-sm font-medium transition-all text-left active:scale-[0.98]',
            selected === false
              ? 'bg-red-900/40 border-red-500/50 text-red-300'
              : 'bg-white/5 border-white/10 text-parchment-400 hover:bg-white/10',
          )}
        >
          <Icon name='x' size='sm' className='mr-2 inline' />
          {falseLabel}
        </button>
      </div>

      <Button
        onClick={() => selected !== null && onComplete(selected)}
        disabled={selected === null}
        fullWidth
        size='lg'
        variant='night'
      >
        <Icon name='check' size='md' className='mr-2' />
        {t.common.confirm}
      </Button>
    </div>
  )
}

// ============================================================================
// ROLE PICKER
// ============================================================================

function RolePicker({ state, onComplete }: RoleProps) {
  const { t } = useI18n()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const allRoles = getAllRoles()

  const handleSelect = (roleId: string) => {
    setSelectedRole((prev) => (prev === roleId ? null : roleId))
  }

  return (
    <div>
      <h3 className='mb-4 text-center text-lg font-semibold text-amber-200'>{t.game.chooseFalseRole}</h3>

      <div className='mb-6'>
        <RolePickerGrid
          roles={allRoles}
          state={state}
          selected={selectedRole ? [selectedRole] : []}
          onSelect={handleSelect}
          selectionCount={1}
          colorMode='team'
        />
      </div>

      <Button
        onClick={() => selectedRole && onComplete(selectedRole)}
        disabled={!selectedRole}
        fullWidth
        size='lg'
        variant='night'
      >
        <Icon name='check' size='md' className='mr-2' />
        {t.common.confirm}
      </Button>
    </div>
  )
}
