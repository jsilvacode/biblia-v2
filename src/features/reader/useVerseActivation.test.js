import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVerseActivation } from './useVerseActivation'

const target = document.createElement('button')
const down = { clientX: 20, clientY: 30, timeStamp: 100, pointerType: 'mouse' }
const up = { ...down, timeStamp: 180 }
const click = { currentTarget: target, detail: 1, button: 0 }

function setup() {
  const onActivate = vi.fn()
  const hook = renderHook(({ activationKey }) => useVerseActivation({ activationKey, onActivate }), {
    initialProps: { activationKey: '43:3' },
  })
  return { ...hook, onActivate }
}

describe('native text actions in the reader', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('keeps a plain mouse click available while giving double-click selection priority', () => {
    const { result, onActivate } = setup()
    result.current.onPointerDown(down)
    result.current.onPointerUp(up)
    result.current.onClick(click, 16)
    expect(onActivate).not.toHaveBeenCalled()
    vi.runOnlyPendingTimers()
    expect(onActivate).toHaveBeenCalledWith({ currentTarget: target, detail: 1 }, 16)

    onActivate.mockClear()
    result.current.onPointerDown(down)
    result.current.onPointerUp(up)
    result.current.onClick(click, 16)
    result.current.onPointerDown(down)
    result.current.onClick({ ...click, detail: 2 }, 16)
    result.current.onDoubleClick()
    vi.runOnlyPendingTimers()
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('does not open actions after a selection drag, long press or native context menu', () => {
    const { result, onActivate } = setup()
    for (const end of [{ ...up, clientX: 80 }, { ...up, timeStamp: 800 }]) {
      result.current.onPointerDown(down)
      result.current.onPointerUp(end)
      result.current.onClick(click, 16)
    }
    result.current.onPointerDown(down)
    const contextMenu = { preventDefault: vi.fn() }
    result.current.onContextMenu(contextMenu)
    result.current.onPointerUp(up)
    result.current.onClick(click, 16)
    vi.runOnlyPendingTimers()
    expect(onActivate).not.toHaveBeenCalled()
    expect(contextMenu.preventDefault).not.toHaveBeenCalled()
  })

  it('cancels a pending click when the browser selects text or the user invokes copy', () => {
    const { result, onActivate } = setup()
    result.current.onPointerDown(down)
    result.current.onClick(click, 16)
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: false, toString: () => 'Texto seleccionado' })
    document.dispatchEvent(new Event('selectionchange'))
    vi.runOnlyPendingTimers()
    expect(onActivate).not.toHaveBeenCalled()

    vi.restoreAllMocks()
    result.current.onPointerDown(down)
    result.current.onClick(click, 16)
    const copyShortcut = new KeyboardEvent('keydown', { key: 'c', metaKey: true, bubbles: true, cancelable: true })
    document.dispatchEvent(copyShortcut)
    vi.runOnlyPendingTimers()
    expect(copyShortcut.defaultPrevented).toBe(false)
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('opens immediately for a short touch or explicit keyboard activation', () => {
    const { result, onActivate } = setup()
    result.current.onPointerDown({ ...down, pointerType: 'touch' })
    result.current.onPointerUp({ ...up, pointerType: 'touch' })
    result.current.onClick(click, 16)
    expect(onActivate).toHaveBeenCalledTimes(1)
    result.current.onClick({ ...click, detail: 0 }, 17)
    expect(onActivate).toHaveBeenLastCalledWith({ currentTarget: target, detail: 0 }, 17)
  })

  it('retains Enter and Space activation while leaving selection and copy shortcuts to the browser', () => {
    const { result, onActivate } = setup()
    for (const key of ['Enter', ' ']) {
      const event = { key, currentTarget: target, preventDefault: vi.fn() }
      result.current.onKeyDown(event, 16)
      expect(event.preventDefault).toHaveBeenCalled()
    }
    expect(onActivate).toHaveBeenCalledTimes(2)
    for (const event of [{ key: 'ArrowRight', shiftKey: true }, { key: 'c', ctrlKey: true }, { key: ' ', ctrlKey: true }]) {
      const preventDefault = vi.fn()
      result.current.onKeyDown({ ...event, preventDefault }, 16)
      expect(preventDefault).not.toHaveBeenCalled()
    }
    expect(onActivate).toHaveBeenCalledTimes(2)
  })

  it('discards pending verse actions when the chapter changes or the reader unmounts', () => {
    const { result, onActivate, rerender, unmount } = setup()
    result.current.onPointerDown(down)
    result.current.onClick(click, 16)
    rerender({ activationKey: '43:4' })
    vi.runOnlyPendingTimers()
    expect(onActivate).not.toHaveBeenCalled()
    result.current.onPointerDown(down)
    result.current.onClick(click, 1)
    unmount()
    vi.runOnlyPendingTimers()
    expect(onActivate).not.toHaveBeenCalled()
  })
})
