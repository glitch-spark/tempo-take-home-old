import { forwardRef } from 'react'

interface TrashZoneProps {
  active: boolean
}

export const TrashZone = forwardRef<HTMLDivElement, TrashZoneProps>(
  function TrashZone({ active }, ref) {
    return (
      <div
        ref={ref}
        className={`trash-zone${active ? ' trash-zone--active' : ''}`}
        aria-label="Trash"
      >
        <span className="trash-icon" aria-hidden="true">
          ⌫
        </span>
        <span className="trash-label">Drop here to delete</span>
      </div>
    )
  }
)
