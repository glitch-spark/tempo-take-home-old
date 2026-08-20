import { useCallback, useEffect, useRef, useState } from 'react'
import type { Note, NoteColor } from './types'
import {
  createNoteId,
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  NOTE_COLORS,
} from './types'
import { loadNotes, saveNotes } from './storage'
import { StickyNote } from './StickyNote'
import { TrashZone } from './TrashZone'
import './App.css'

function nextZ(notes: Note[]): number {
  if (notes.length === 0) return 1
  return Math.max(...notes.map((n) => n.zIndex)) + 1
}

function App() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const stored = loadNotes()
    if (stored && stored.length > 0) return stored
    return [
      {
        id: createNoteId(),
        x: 80,
        y: 80,
        width: DEFAULT_NOTE_WIDTH,
        height: DEFAULT_NOTE_HEIGHT,
        zIndex: 1,
        color: 'yellow',
        text: 'Click the board to add a note.\nDrag to move, corner to resize.\nDrop on trash to delete.',
      },
    ]
  })
  const [nextColorIndex, setNextColorIndex] = useState(1)
  const [trashActive, setTrashActive] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const trashRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<number | null>(null)

  useEffect(() => {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current)
    }
    saveTimer.current = window.setTimeout(() => {
      saveNotes(notes)
    }, 250)
    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current)
      }
    }
  }, [notes])

  const raiseNote = useCallback((id: string) => {
    setNotes((prev) => {
      const maxZ = nextZ(prev)
      return prev.map((n) => (n.id === id ? { ...n, zIndex: maxZ } : n))
    })
  }, [])

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))
  }, [])

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const isOverTrash = useCallback((clientX: number, clientY: number): boolean => {
    const el = trashRef.current
    if (!el) return false
    const r = el.getBoundingClientRect()
    return (
      clientX >= r.left &&
      clientX <= r.right &&
      clientY >= r.top &&
      clientY <= r.bottom
    )
  }, [])

  const handleBoardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== boardRef.current) return
    if (e.button !== 0) return

    const board = boardRef.current
    if (!board) return
    const rect = board.getBoundingClientRect()
    const x = e.clientX - rect.left - DEFAULT_NOTE_WIDTH / 2
    const y = e.clientY - rect.top - DEFAULT_NOTE_HEIGHT / 2

    const color: NoteColor = NOTE_COLORS[nextColorIndex % NOTE_COLORS.length]
    setNextColorIndex((i) => i + 1)

    setNotes((prev) => [
      ...prev,
      {
        id: createNoteId(),
        x: Math.max(0, Math.min(x, rect.width - DEFAULT_NOTE_WIDTH)),
        y: Math.max(0, Math.min(y, rect.height - DEFAULT_NOTE_HEIGHT)),
        width: DEFAULT_NOTE_WIDTH,
        height: DEFAULT_NOTE_HEIGHT,
        zIndex: nextZ(prev),
        color,
        text: '',
      },
    ])
  }

  return (
    <div className="app">
      <header className="toolbar">
        <h1>Sticky Notes</h1>
        <p className="hint">
          Click empty board to create · drag note to move · bottom-right corner to
          resize · drop on trash to delete
        </p>
      </header>

      <div
        className="board"
        ref={boardRef}
        onPointerDown={handleBoardPointerDown}
      >
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            boardRef={boardRef}
            onRaise={raiseNote}
            onCommit={updateNote}
            onRemove={removeNote}
            isOverTrash={isOverTrash}
            onTrashHover={setTrashActive}
          />
        ))}

        <TrashZone ref={trashRef} active={trashActive} />
      </div>
    </div>
  )
}

export default App
