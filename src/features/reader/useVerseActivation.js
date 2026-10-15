import { useCallback, useEffect, useRef } from 'react'

const MOUSE_CLICK_DELAY_MS = 300
const LONG_PRESS_MS = 400
const TAP_MOVEMENT_PX = 8

function hasTextSelection() {
  const selection = window.getSelection?.()
  return Boolean(selection && !selection.isCollapsed && selection.toString())
}

/** Keep verse shortcuts from interrupting native selection and context menus. */
export function useVerseActivation({ activationKey, onActivate }) {
  const activateRef = useRef(onActivate)
  const pendingRef = useRef(null)
  const pointerRef = useRef(null)
  const nativeGestureRef = useRef(false)

  const cancelPending = useCallback(() => {
    window.clearTimeout(pendingRef.current)
    pendingRef.current = null
  }, [])

  useEffect(() => { activateRef.current = onActivate }, [onActivate])

  useEffect(() => {
    const preserveSelection = () => { if (hasTextSelection()) cancelPending() }
    const preserveKeyboardAction = (event) => {
      if (event.key === 'Escape' || event.ctrlKey || event.metaKey || event.shiftKey) cancelPending()
    }
    document.addEventListener('selectionchange', preserveSelection)
    document.addEventListener('pointerdown', cancelPending)
    document.addEventListener('keydown', preserveKeyboardAction)
    return () => {
      cancelPending()
      pointerRef.current = null
      document.removeEventListener('selectionchange', preserveSelection)
      document.removeEventListener('pointerdown', cancelPending)
      document.removeEventListener('keydown', preserveKeyboardAction)
    }
  }, [activationKey, cancelPending])

  function onPointerDown(event) {
    cancelPending()
    nativeGestureRef.current = false
    pointerRef.current = {
      x: event.clientX, y: event.clientY, at: event.timeStamp, type: event.pointerType,
    }
  }

  function onPointerUp(event) {
    const start = pointerRef.current
    if (!start) return
    nativeGestureRef.current ||= event.timeStamp - start.at >= LONG_PRESS_MS
      || Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_MOVEMENT_PX
      || hasTextSelection()
  }

  function preserveNativeGesture(event) {
    nativeGestureRef.current = true
    cancelPending()
    // Touch readers use the explicit Copy verse action, avoiding a second
    // system menu competing with the familiar verse actions.
    if (event?.type === 'contextmenu' && (
      pointerRef.current?.type === 'touch'
      || window.matchMedia?.('(hover: none) and (pointer: coarse)').matches
    )) event.preventDefault()
  }

  function onClick(event, verse) {
    cancelPending()
    if (event.button > 0 || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return
    const keyboard = event.detail === 0
    if (!keyboard && (event.detail > 1 || nativeGestureRef.current || hasTextSelection())) return

    // Snapshot currentTarget before React finishes dispatching the event.
    const activation = { currentTarget: event.currentTarget, detail: event.detail }
    if (keyboard || pointerRef.current?.type === 'touch') {
      activateRef.current(activation, verse)
    } else {
      // A second click or a selection cancels the first click, leaving the
      // browser free to select a word without opening a modal over it.
      pendingRef.current = window.setTimeout(() => {
        pendingRef.current = null
        if (!hasTextSelection()) activateRef.current(activation, verse)
      }, MOUSE_CLICK_DELAY_MS)
    }
  }

  function onKeyDown(event, verse) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return
    event.preventDefault()
    onClick({ currentTarget: event.currentTarget, detail: 0, button: 0 }, verse)
  }

  return {
    onClick, onKeyDown, onPointerDown, onPointerUp,
    onPointerCancel: preserveNativeGesture,
    onContextMenu: preserveNativeGesture,
    onDoubleClick: preserveNativeGesture,
  }
}
