import type { Note } from './types'

const STORAGE_KEY = 'sticky-notes-board-v1'

export function loadNotes(): Note[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed as Note[]
  } catch {
    return null
  }
}

export function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {
    // Quota or private mode — ignore; board still works in-memory.
  }
}
