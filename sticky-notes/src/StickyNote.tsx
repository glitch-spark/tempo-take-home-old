import { useEffect, useRef } from 'react'
import type { Note } from './types'
import { MIN_NOTE_HEIGHT, MIN_NOTE_WIDTH } from './types'

type DragMode = 'move' | 'resize' | null

interface StickyNoteProps {
  note: Note
  boardRef: React.RefObject<HTMLDivElement | null>
  onRaise: (id: string) => void
  onCommit: (id: string, patch: Partial<Note>) => void
  onRemove: (id: string) => void
  isOverTrash: (clientX: number, clientY: number) => boolean
  onTrashHover: (active: boolean) => void
}

export function StickyNote({
  note,
  boardRef,
  onRaise,
  onCommit,
  onRemove,
  isOverTrash,
  onTrashHover,
}: StickyNoteProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const modeRef = useRef<DragMode>(null)
  const startPointer = useRef({ x: 0, y: 0 })
  const startGeom = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const liveGeom = useRef({ x: note.x, y: note.y, w: note.width, h: note.height })

  // Keep DOM in sync when React state commits (e.g. after create / other notes).
  useEffect(() => {
    if (modeRef.current) return
    liveGeom.current = { x: note.x, y: note.y, w: note.width, h: note.height }
    const el = rootRef.current
    if (!el) return
    el.style.left = `${note.x}px`
    el.style.top = `${note.y}px`
    el.style.width = `${note.width}px`
    el.style.height = `${note.height}px`
  }, [note.x, note.y, note.width, note.height])

  const applyLiveStyle = () => {
    const el = rootRef.current
    if (!el) return
    const g = liveGeom.current
    el.style.left = `${g.x}px`
    el.style.top = `${g.y}px`
    el.style.width = `${g.w}px`
    el.style.height = `${g.h}px`
  }

  const clampToBoard = (x: number, y: number, w: number, h: number) => {
    const board = boardRef.current
    if (!board) return { x, y, w, h }
    const bw = board.clientWidth
    const bh = board.clientHeight
    const cw = Math.min(Math.max(w, MIN_NOTE_WIDTH), bw)
    const ch = Math.min(Math.max(h, MIN_NOTE_HEIGHT), bh)
    return {
      x: Math.max(0, Math.min(x, bw - cw)),
      y: Math.max(0, Math.min(y, bh - ch)),
      w: cw,
      h: ch,
    }
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!modeRef.current) return
    const dx = e.clientX - startPointer.current.x
    const dy = e.clientY - startPointer.current.y
    const s = startGeom.current

    if (modeRef.current === 'move') {
      liveGeom.current = clampToBoard(s.x + dx, s.y + dy, s.w, s.h)
      onTrashHover(isOverTrash(e.clientX, e.clientY))
    } else {
      liveGeom.current = clampToBoard(s.x, s.y, s.w + dx, s.h + dy)
    }
    applyLiveStyle()
  }

  const endDrag = (e: PointerEvent) => {
    if (!modeRef.current) return
    const wasMove = modeRef.current === 'move'
    modeRef.current = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)

    onTrashHover(false)

    if (wasMove && isOverTrash(e.clientX, e.clientY)) {
      onRemove(note.id)
      return
    }

    const g = liveGeom.current
    onCommit(note.id, { x: g.x, y: g.y, width: g.w, height: g.h })
  }

  const beginDrag = (mode: DragMode, e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    onRaise(note.id)
    modeRef.current = mode
    startPointer.current = { x: e.clientX, y: e.clientY }
    startGeom.current = {
      x: liveGeom.current.x,
      y: liveGeom.current.y,
      w: liveGeom.current.w,
      h: liveGeom.current.h,
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
  }

  return (
    <div
      ref={rootRef}
      className={`sticky-note sticky-note--${note.color}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
      }}
      onPointerDown={(e) => {
        // Don't start move when interacting with textarea or resize handle.
        const t = e.target as HTMLElement
        if (t.closest('textarea') || t.closest('.resize-handle')) return
        beginDrag('move', e)
      }}
    >
      <div className="sticky-note__header" aria-hidden="true" />
      <textarea
        className="sticky-note__text"
        value={note.text}
        placeholder="Write something…"
        onChange={(e) => onCommit(note.id, { text: e.target.value })}
        onPointerDown={(e) => {
          e.stopPropagation()
          onRaise(note.id)
        }}
      />
      <div
        className="resize-handle"
        onPointerDown={(e) => beginDrag('resize', e)}
        title="Resize"
      />
    </div>
  )
}
