export const MAX_PICKER_HEIGHT = 288
const VIEWPORT_MARGIN = 12

function viewportBounds() {
  const viewport = window.visualViewport
  const top = viewport?.offsetTop ?? 0
  const left = viewport?.offsetLeft ?? 0
  const height = viewport?.height ?? window.innerHeight
  const width = viewport?.width ?? window.innerWidth
  let bottom = top + height - VIEWPORT_MARGIN

  for (const navigation of document.querySelectorAll('.mobile-navigation, .reader-bottom-navigation')) {
    const style = getComputedStyle(navigation)
    if (style.display === 'none' || style.visibility === 'hidden') continue
    const rect = navigation.getBoundingClientRect()
    if (rect.bottom > top && rect.top < top + height) bottom = Math.min(bottom, rect.top - VIEWPORT_MARGIN)
  }

  return { top: top + VIEWPORT_MARGIN, bottom, left: left + VIEWPORT_MARGIN, right: left + width - VIEWPORT_MARGIN }
}

// Native focus can leave a field underneath the fixed mobile navigation or
// keyboard. Reveal it before opening a preview, without reacting to user scroll.
export function revealPickerAnchor(anchorElement) {
  if (!anchorElement) return
  const anchor = anchorElement.getBoundingClientRect()
  const bounds = viewportBounds()
  if (anchor.top < bounds.top || anchor.bottom > bounds.bottom) {
    window.scrollBy({ top: (anchor.top + anchor.bottom - bounds.top - bounds.bottom) / 2, behavior: 'instant' })
  }
}

export function positionPickerMenu(list, anchorElement, maxHeight = MAX_PICKER_HEIGHT) {
  if (!list || !anchorElement) return false
  const anchor = anchorElement.getBoundingClientRect()
  const bounds = viewportBounds()
  if (anchor.bottom <= bounds.top || anchor.top >= bounds.bottom || bounds.right <= bounds.left) {
    list.style.visibility = 'hidden'
    return false
  }

  const width = Math.min(anchor.width, bounds.right - bounds.left)
  const left = Math.max(bounds.left, Math.min(anchor.left, bounds.right - width))
  list.style.width = `${width}px`
  list.style.left = `${left - anchor.left}px`
  const style = getComputedStyle(list)
  const borderHeight = (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0)
  const desired = Math.min(maxHeight, list.scrollHeight + borderHeight)
  const below = Math.max(0, bounds.bottom - anchor.bottom)
  const above = Math.max(0, anchor.top - bounds.top)
  const direction = below >= desired ? 'down' : above >= desired ? 'up' : above > below ? 'up' : 'down'
  const available = direction === 'up' ? above : below
  if (available < Math.min(48, desired)) {
    list.style.visibility = 'hidden'
    return false
  }

  list.dataset.direction = direction
  // Absolute offsets use the padding box; counting the border here would
  // detach a fully outlined trigger from its menu.
  list.style.top = direction === 'down' ? `${anchorElement.clientHeight}px` : 'auto'
  list.style.bottom = direction === 'up' ? `${anchorElement.clientHeight}px` : 'auto'
  list.style.maxHeight = `${Math.min(maxHeight, available)}px`
  list.style.setProperty('--picker-menu-height', `${Math.min(maxHeight, available)}px`)
  list.style.visibility = 'visible'
  return true
}

export function revealPickerOption(list, index) {
  list = list?.querySelector('[role="listbox"]') ?? list
  const option = list?.querySelector(`[data-picker-index="${index}"]`)
  if (!list || !option) return
  const listRect = list.getBoundingClientRect()
  const optionRect = option.getBoundingClientRect()
  const style = getComputedStyle(list)
  const top = listRect.top + (parseFloat(style.borderTopWidth) || 0)
  const bottom = listRect.bottom - (parseFloat(style.borderBottomWidth) || 0)
  if (optionRect.top < top) list.scrollTop -= Math.ceil(top - optionRect.top)
  else if (optionRect.bottom > bottom) list.scrollTop += Math.ceil(optionRect.bottom - bottom)
}
