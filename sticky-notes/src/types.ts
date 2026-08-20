export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green'

export interface Note {
  id: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  color: NoteColor
  text: string
}

export const NOTE_COLORS: NoteColor[] = ['yellow', 'pink', 'blue', 'green']

export const MIN_NOTE_WIDTH = 140
export const MIN_NOTE_HEIGHT = 120
export const DEFAULT_NOTE_WIDTH = 200
export const DEFAULT_NOTE_HEIGHT = 180

export function createNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
