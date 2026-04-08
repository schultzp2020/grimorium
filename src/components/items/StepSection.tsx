import type { ReactNode } from 'react'

interface StepSectionProps {
  step: number
  label: string
  count?: { current: number; max: number }
  children: ReactNode
}

export function StepSection({ step, label, count, children }: StepSectionProps) {
  return (
    <div className='mb-6'>
      <div className='mb-3 flex items-center gap-2'>
        <span className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/30 text-xs font-bold text-blue-300'>
          {step}
        </span>
        <span className='text-sm text-parchment-300'>{label}</span>
        {count && (
          <span className='text-xs text-parchment-500'>
            ({count.current}/{count.max})
          </span>
        )}
      </div>
      <div className='space-y-2'>{children}</div>
    </div>
  )
}
