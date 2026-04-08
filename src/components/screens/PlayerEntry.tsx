import { useDrag } from '@use-gesture/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useI18n } from '../../lib/i18n'
import { getLastGamePlayers } from '../../lib/storage'
import { BackButton, Button, Icon } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'

interface Props {
  onNext: (players: string[]) => void
  onBack: () => void
}

interface PlayerItem {
  id: string
  name: string
}

const MIN_PLAYERS = 5
const MAX_PLAYERS = 20

let _nextId = 0
function makePlayerItem(name: string): PlayerItem {
  return { id: `p-${_nextId++}`, name }
}

export function PlayerEntry({ onNext, onBack }: Props) {
  const { t } = useI18n()
  const [players, setPlayers] = useState<PlayerItem[]>(() => {
    _nextId = 0
    const lastPlayers = getLastGamePlayers()
    if (lastPlayers.length >= MIN_PLAYERS) {
      return lastPlayers.map((n) => makePlayerItem(n))
    }
    if (lastPlayers.length > 0) {
      return [
        ...lastPlayers.map((n) => makePlayerItem(n)),
        ...Array(MIN_PLAYERS - lastPlayers.length)
          .fill('')
          .map(() => makePlayerItem('')),
      ]
    }
    return Array(MIN_PLAYERS)
      .fill('')
      .map(() => makePlayerItem(''))
  })
  const [loadedFromLast] = useState(() => getLastGamePlayers().length > 0)
  const lastInputRef = useRef<HTMLInputElement>(null)
  const prevLengthRef = useRef(players.length)

  // ── Drag-to-reorder ──────────────────────────────────────────────

  const [drag, setDrag] = useState<{
    index: number // index of the dragged item in the array
    targetIndex: number // where it would drop
    offsetY: number // raw Y offset of the dragged item
  } | null>(null)

  const rowHeightRef = useRef(0)
  const rowElsRef = useRef<(HTMLDivElement | null)[]>([])

  const measureRowHeight = useCallback(() => {
    for (const el of rowElsRef.current) {
      if (el) {
        // row height + space-y-3 gap (0.75rem = 12px)
        rowHeightRef.current = el.getBoundingClientRect().height + 12
        return rowHeightRef.current
      }
    }
    return 60
  }, [])

  const bindDrag = useDrag(
    ({ args: [rawIndex], active, movement: [, my], first, last }) => {
      const idx = rawIndex as number

      if (first) {
        measureRowHeight()
        setDrag({ index: idx, targetIndex: idx, offsetY: 0 })
        return
      }

      const rowH = rowHeightRef.current || 60
      const target = Math.max(0, Math.min(players.length - 1, idx + Math.round(my / rowH)))

      if (active) {
        setDrag({ index: idx, targetIndex: target, offsetY: my })
      }

      if (last) {
        if (idx !== target) {
          setPlayers((prev) => {
            const next = [...prev]
            const [moved] = next.splice(idx, 1)
            next.splice(target, 0, moved)
            return next
          })
        }
        setDrag(null)
      }
    },
    {
      filterTaps: true,
      threshold: 5,
      axis: 'y',
      pointer: { touch: true },
    },
  )

  // Visual transform for each item during drag
  const getItemStyle = (index: number): React.CSSProperties => {
    if (!drag) {
      return {}
    }

    const { index: dragIdx, targetIndex, offsetY } = drag
    const rowH = rowHeightRef.current || 60

    if (index === dragIdx) {
      return {
        transform: `translateY(${offsetY}px) scale(1.02)`,
        zIndex: 50,
        position: 'relative',
        boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
        transition: 'box-shadow 200ms ease',
      }
    }

    // Items between dragged position and target shift to make room
    let shift = 0
    if (dragIdx < targetIndex) {
      // Dragging down: items in (dragIdx, targetIndex] shift up
      if (index > dragIdx && index <= targetIndex) {
        shift = -rowH
      }
    } else if (dragIdx > targetIndex) {
      // Dragging up: items in [targetIndex, dragIdx) shift down
      if (index >= targetIndex && index < dragIdx) {
        shift = rowH
      }
    }

    return {
      transform: shift ? `translateY(${shift}px)` : undefined,
      transition: 'transform 200ms ease',
    }
  }

  // ── List operations ────────────────────────────────────────────────

  useEffect(() => {
    if (players.length > prevLengthRef.current && lastInputRef.current) {
      lastInputRef.current.focus()
      lastInputRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
    prevLengthRef.current = players.length
  }, [players.length])

  const maxPlayersReached = players.length >= MAX_PLAYERS

  const addPlayer = () => {
    if (maxPlayersReached) {
      return
    }
    setPlayers([...players, makePlayerItem('')])
  }

  const updatePlayer = (index: number, name: string) => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, name } : p)))
  }

  const removePlayer = (index: number) => {
    if (players.length <= MIN_PLAYERS) {
      return
    }
    setPlayers(players.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    const validPlayers = players.filter((p) => p.name.trim().length > 0)
    if (validPlayers.length >= MIN_PLAYERS) {
      onNext(validPlayers.map((p) => p.name))
    }
  }

  const validCount = players.filter((p) => p.name.trim().length > 0).length
  const canProceed = validCount >= MIN_PLAYERS

  return (
    <div className='flex min-h-app flex-col bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker'>
      {/* Header */}
      <div className='sticky top-0 z-10 border-b border-mystic-gold/20 bg-grimoire-dark/95 px-4 py-3 backdrop-blur-xs'>
        <div className='mx-auto flex max-w-lg items-center gap-3'>
          <BackButton onClick={onBack} />
          <div>
            <h1 className='font-tarot text-lg tracking-wider text-parchment-100 uppercase'>{t.newGame.step1Title}</h1>
            <p className='text-xs text-parchment-500'>{t.newGame.step1Subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='mx-auto w-full max-w-lg flex-1 px-4 py-6'>
        {/* Player Count & Loaded indicator */}
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-2 text-parchment-400'>
            <Icon name='users' size='sm' />
            <span className='text-sm tracking-wider'>
              {t.common.players} ({validCount})
            </span>
          </div>
          {loadedFromLast && (
            <span className='flex items-center gap-1 text-xs text-mystic-gold/60'>
              <Icon name='history' size='xs' />
              {t.newGame.loadedFromLastGame}
            </span>
          )}
        </div>

        {/* Player List */}
        <div className='mb-6 space-y-3'>
          {players.map((player, index) => (
            <div
              key={player.id}
              ref={(el) => {
                rowElsRef.current[index] = el
              }}
              className={`flex items-center gap-2 rounded-lg ${
                drag?.index === index ? 'bg-white/5 ring-1 ring-mystic-gold/30' : ''
              }`}
              style={getItemStyle(index)}
            >
              {/* Drag handle */}
              <div
                {...bindDrag(index)}
                className='flex min-h-[44px] w-11 shrink-0 cursor-grab touch-none items-center justify-center py-3 text-parchment-500/40 select-none hover:text-parchment-400 active:cursor-grabbing'
              >
                <Icon name='gripVertical' size='md' />
              </div>

              <input
                ref={index === players.length - 1 ? lastInputRef : undefined}
                type='text'
                value={player.name}
                onChange={(e) => updatePlayer(index, e.target.value)}
                placeholder={`${t.newGame.playerPlaceholder} ${index + 1}`}
                className='flex-1 rounded-lg border border-parchment-500/30 bg-white/5 px-4 py-3 text-parchment-100 transition-colors placeholder:text-parchment-500 focus:border-mystic-gold/50 focus:ring-1 focus:ring-mystic-gold/30 focus:outline-hidden'
              />
              {players.length > MIN_PLAYERS && (
                <button
                  type='button'
                  onClick={() => removePlayer(index)}
                  className='rounded-lg p-3 text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400'
                >
                  <Icon name='trash' size='md' />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Player Button */}
        {!maxPlayersReached && (
          <button
            type='button'
            onClick={addPlayer}
            className='flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-parchment-500/30 py-3 text-parchment-400 transition-colors hover:border-parchment-400/50 hover:text-parchment-300'
          >
            <Icon name='plus' size='md' />
            {t.newGame.addPlayer}
          </button>
        )}

        {!canProceed && <p className='mt-4 text-center text-sm text-mystic-gold/60'>{t.newGame.minPlayersWarning}</p>}

        {!!maxPlayersReached && (
          <p className='mt-4 text-center text-sm text-mystic-gold/60'>{t.newGame.maxPlayersWarning}</p>
        )}
      </div>

      {/* Footer */}
      <ScreenFooter>
        <Button onClick={handleNext} disabled={!canProceed} fullWidth size='lg' variant='gold'>
          {t.newGame.nextSelectRoles}
          <Icon name='arrowRight' size='md' className='ml-2' />
        </Button>
      </ScreenFooter>
    </div>
  )
}
