import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SavedStorageError } from '../saved/savedStorage'
import { VerseActionsSheet } from './VerseActionsSheet'

vi.mock('../../i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))
vi.mock('./ReaderDialog', () => ({ ReaderDialog: ({ children, isOpen }) => isOpen ? <div role="dialog">{children}</div> : null }))

function renderActions(overrides = {}) {
  const props = {
    isBookmarked: false, isHighlighted: false, isOpen: true, onClose: vi.fn(),
    onCopy: vi.fn(), onOpenCommentary: vi.fn(), onRetrySaved: vi.fn().mockResolvedValue(undefined),
    onShare: vi.fn(), onToggleBookmark: vi.fn().mockResolvedValue(true), onToggleHighlight: vi.fn().mockResolvedValue(true),
    reference: 'Juan 3:16', ...overrides,
  }
  const view = render(<VerseActionsSheet {...props} />)
  return { ...props, view }
}

describe('saved verse action failures', () => {
  afterEach(cleanup)

  it.each([['bookmark', 'onToggleBookmark'], ['highlight', 'onToggleHighlight']])('keeps the dialog open after a failed %s and closes only when its retry succeeds', async (name, callback) => {
    const action = vi.fn().mockRejectedValueOnce(new SavedStorageError('write')).mockResolvedValue(true)
    const props = renderActions({ [callback]: action })
    fireEvent.click(screen.getByRole('button', { name: `reader.${name}`, exact: true }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('saved.writeError'))
    expect(props.onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: `reader.${name}`, exact: true }).disabled).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'saved.retry', exact: true }))
    await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1))
    expect(action).toHaveBeenCalledTimes(2)
  })

  it('retries a failed read without implicitly toggling an unknown existing bookmark', async () => {
    const action = vi.fn().mockRejectedValueOnce(new SavedStorageError('read'))
    const props = renderActions({ onToggleBookmark: action })
    fireEvent.click(screen.getByRole('button', { name: 'reader.bookmark', exact: true }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('saved.loadError'))
    fireEvent.click(screen.getByRole('button', { name: 'saved.retry', exact: true }))
    await waitFor(() => expect(props.onRetrySaved).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    expect(action).toHaveBeenCalledTimes(1)
    expect(props.onClose).not.toHaveBeenCalled()
  })

  it('does not carry a previous verse error into a new action sheet', async () => {
    const first = renderActions({ onToggleBookmark: vi.fn().mockRejectedValue(new SavedStorageError('write')) })
    fireEvent.click(screen.getByRole('button', { name: 'reader.bookmark', exact: true }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('saved.writeError'))
    first.view.unmount()
    renderActions({ reference: 'Salmos 23:1' })
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('button', { name: 'reader.bookmark', exact: true }).disabled).toBe(false)
  })

  it('does not close a new sheet when an action from the previous sheet completes', async () => {
    let finish
    const pending = new Promise(resolve => { finish = resolve })
    const onClose = vi.fn()
    const first = renderActions({ onClose, onToggleBookmark: vi.fn().mockReturnValue(pending) })
    fireEvent.click(screen.getByRole('button', { name: 'reader.bookmark', exact: true }))
    first.view.unmount()
    renderActions({ onClose, reference: 'Salmos 23:1' })
    await act(async () => { finish(true); await pending })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog').textContent).toContain('Salmos 23:1')
  })
})
