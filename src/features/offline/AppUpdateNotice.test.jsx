import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import es from '../../i18n/locales/es'
import { AppUpdateNotice } from './AppUpdateNotice'

const updateStore = vi.hoisted(() => ({
  state: { available: false, applying: false, dismissed: false, error: false },
  listeners: new Set(),
  apply: vi.fn(),
  dismiss: vi.fn(),
}))

vi.mock('./appUpdates', () => ({
  getAppUpdateState: () => updateStore.state,
  subscribeAppUpdates: (listener) => {
    updateStore.listeners.add(listener)
    return () => updateStore.listeners.delete(listener)
  },
  requestAppReload: updateStore.apply,
  dismissAppUpdate: updateStore.dismiss,
}))

vi.mock('../../i18n', () => ({
  useI18n: () => ({ t: key => key.split('.').reduce((value, part) => value?.[part], es) }),
}))

function publish(patch) {
  act(() => {
    updateStore.state = { ...updateStore.state, ...patch }
    updateStore.listeners.forEach(listener => listener())
  })
}

beforeEach(() => {
  updateStore.state = { available: false, applying: false, dismissed: false, error: false }
  updateStore.apply.mockReset()
  updateStore.dismiss.mockReset()
})

afterEach(cleanup)

describe('AppUpdateNotice', () => {
  it('appears only for a discovered update and never takes the reader’s focus', () => {
    render(<><input aria-label="Consulta" /><AppUpdateNotice /></>)
    expect(screen.queryByRole('complementary')).toBeNull()
    const input = screen.getByRole('textbox', { name: 'Consulta' })
    input.focus()
    publish({ available: true })
    expect(screen.getByRole('status').textContent).toContain(es.appRecovery.updateReady)
    expect(document.activeElement).toBe(input)
    expect(updateStore.apply).not.toHaveBeenCalled()
  })

  it('applies only after the button is pressed and offers dismissal with its close action', () => {
    updateStore.state = { ...updateStore.state, available: true }
    render(<AppUpdateNotice />)
    fireEvent.click(screen.getByRole('button', { name: es.appRecovery.update }))
    expect(updateStore.apply).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: es.appRecovery.later }))
    expect(updateStore.dismiss).toHaveBeenCalledOnce()
    publish({ dismissed: true })
    expect(screen.queryByRole('complementary')).toBeNull()
  })

  it('disables duplicate application while busy and exposes a recoverable error', () => {
    updateStore.state = { ...updateStore.state, available: true, applying: true }
    render(<AppUpdateNotice />)
    expect(screen.getByRole('button', { name: es.appRecovery.updating }).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: es.appRecovery.later })).toBeNull()
    publish({ applying: false, error: true })
    expect(screen.getByRole('alert').textContent).toContain(es.appRecovery.updateError)
    expect(screen.getByRole('button', { name: es.appRecovery.update }).disabled).toBe(false)
    expect(updateStore.apply).not.toHaveBeenCalled()
  })
})
