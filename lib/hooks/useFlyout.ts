// CAN THIS FILE BE DELETED??


'use client'
import { useEffect, useRef, useState } from 'react'

type FlyoutOpts = { closeDelay?: number }

export default function useFlyout(opts: FlyoutOpts = {}) {
  const { closeDelay = 250 } = opts
  const ref = useRef<HTMLDivElement | null>(null)

  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)         // click to pin
  const [hovering, setHovering] = useState(false)     // pointer is over trigger/panel
  const [focusWithin, setFocusWithin] = useState(false) // panel contains focus (inputs, autofill)
  const timer = useRef<number | null>(null)

  const clearTimer = () => { if (timer.current) { window.clearTimeout(timer.current); timer.current = null } }
  const scheduleClose = () => {
    clearTimer()
    timer.current = window.setTimeout(() => {
      if (!hovering && !focusWithin && !pinned) setOpen(false)
    }, closeDelay)
  }

  // Trigger props (icon button wrapper)
  const triggerProps = {
    onPointerEnter: () => { setHovering(true); setOpen(true); clearTimer() },
    onPointerLeave: () => { setHovering(false); scheduleClose() },
    onClick: () => { setPinned(p => { const next = !p; setOpen(next || true); return next }) },
    'aria-expanded': open,
  } as const

  // Panel props
  const panelProps = {
    tabIndex: -1, // allow focus
    onPointerEnter: () => { setHovering(true); setOpen(true); clearTimer() },
    onPointerLeave: () => { setHovering(false); scheduleClose() },
    onFocus: () => { setFocusWithin(true); setOpen(true); clearTimer() },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      const nextTarget = e.relatedTarget as Node | null
      const containsNext = nextTarget && ref.current?.contains(nextTarget)
      if (!containsNext) { setFocusWithin(false); scheduleClose() }
    },
  } as const

  // Close on click outside / Esc
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) {
        setPinned(false)
        setHovering(false)
        if (!focusWithin) setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinned(false)
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [focusWithin])

  // Prevent premature close when Chrome shows autofill UI:
  // The input remains focused → focusWithin=true keeps it open.

  return { ref, open, setOpen, pinned, setPinned, triggerProps, panelProps }
}
