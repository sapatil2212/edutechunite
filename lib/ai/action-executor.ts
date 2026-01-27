/**
 * AI Action Executor
 * Handles DOM manipulation based on AI commands
 */

export interface ActionResult {
  success: boolean
  message: string
  data?: any
}

export interface ExecutableAction {
  type: 'click' | 'fill' | 'select' | 'navigate' | 'scroll' | 'focus' | 'clear' | 'check' | 'wait'
  target?: string
  value?: string
  selector?: string
}

/**
 * Find element by various strategies
 */
function findElement(target: string): HTMLElement | null {
  // Try multiple strategies to find the element
  
  // 1. Try by exact text content in buttons
  const buttons = Array.from(document.querySelectorAll('button'))
  const buttonMatch = buttons.find(btn => 
    btn.textContent?.toLowerCase().includes(target.toLowerCase())
  )
  if (buttonMatch) return buttonMatch as HTMLElement

  // 2. Try by aria-label
  const ariaMatch = document.querySelector(`[aria-label*="${target}" i]`)
  if (ariaMatch) return ariaMatch as HTMLElement

  // 3. Try by placeholder
  const placeholderMatch = document.querySelector(`[placeholder*="${target}" i]`)
  if (placeholderMatch) return placeholderMatch as HTMLElement

  // 4. Try by label text
  const labels = Array.from(document.querySelectorAll('label'))
  for (const label of labels) {
    if (label.textContent?.toLowerCase().includes(target.toLowerCase())) {
      const forId = label.getAttribute('for')
      if (forId) {
        const inputElement = document.getElementById(forId)
        if (inputElement) return inputElement as HTMLElement
      }
      // Check for nested input
      const nestedInput = label.querySelector('input, select, textarea')
      if (nestedInput) return nestedInput as HTMLElement
    }
  }

  // 5. Try by input name
  const nameMatch = document.querySelector(`[name*="${target}" i]`)
  if (nameMatch) return nameMatch as HTMLElement

  // 6. Try by ID
  const idMatch = document.querySelector(`#${target.replace(/\s+/g, '')}`)
  if (idMatch) return idMatch as HTMLElement

  // 7. Try by data attributes
  const dataMatch = document.querySelector(`[data-testid*="${target}" i], [data-name*="${target}" i]`)
  if (dataMatch) return dataMatch as HTMLElement

  // 8. Try links by text
  const links = Array.from(document.querySelectorAll('a'))
  const linkMatch = links.find(link => 
    link.textContent?.toLowerCase().includes(target.toLowerCase())
  )
  if (linkMatch) return linkMatch as HTMLElement

  // 9. Try any clickable element with matching text
  const allElements = document.querySelectorAll('*')
  for (const el of allElements) {
    const element = el as HTMLElement
    if (
      element.textContent?.toLowerCase().trim() === target.toLowerCase() ||
      element.textContent?.toLowerCase().includes(target.toLowerCase())
    ) {
      if (
        element.tagName === 'BUTTON' ||
        element.tagName === 'A' ||
        element.onclick ||
        element.getAttribute('role') === 'button' ||
        element.classList.contains('cursor-pointer')
      ) {
        return element
      }
    }
  }

  // 10. Try CSS selector directly
  try {
    const selectorMatch = document.querySelector(target)
    if (selectorMatch) return selectorMatch as HTMLElement
  } catch (e) {
    // Invalid selector, ignore
  }

  return null
}

/**
 * Find input element by label or placeholder
 */
function findInputByLabel(label: string): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null {
  // 1. Try label with for attribute
  const labels = Array.from(document.querySelectorAll('label'))
  for (const labelEl of labels) {
    if (labelEl.textContent?.toLowerCase().includes(label.toLowerCase())) {
      const forId = labelEl.getAttribute('for')
      if (forId) {
        const input = document.getElementById(forId)
        if (input && (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT')) {
          return input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        }
      }
      // Check nested input
      const nestedInput = labelEl.querySelector('input, textarea, select')
      if (nestedInput) return nestedInput as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      
      // Check sibling input
      const sibling = labelEl.nextElementSibling
      if (sibling && (sibling.tagName === 'INPUT' || sibling.tagName === 'TEXTAREA' || sibling.tagName === 'SELECT')) {
        return sibling as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      }
    }
  }

  // 2. Try by placeholder
  const placeholderMatch = document.querySelector(`input[placeholder*="${label}" i], textarea[placeholder*="${label}" i]`)
  if (placeholderMatch) return placeholderMatch as HTMLInputElement | HTMLTextAreaElement

  // 3. Try by name attribute
  const nameMatch = document.querySelector(`input[name*="${label}" i], textarea[name*="${label}" i], select[name*="${label}" i]`)
  if (nameMatch) return nameMatch as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

  // 4. Try by id
  const idMatch = document.querySelector(`input[id*="${label}" i], textarea[id*="${label}" i], select[id*="${label}" i]`)
  if (idMatch) return idMatch as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

  return null
}

/**
 * Execute a click action
 */
async function executeClick(target: string): Promise<ActionResult> {
  const element = findElement(target)
  
  if (!element) {
    return {
      success: false,
      message: `Could not find element: "${target}". Try being more specific or use the exact button text.`
    }
  }

  // Scroll element into view
  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  await new Promise(resolve => setTimeout(resolve, 300))

  // Highlight element briefly
  const originalBorder = element.style.border
  const originalBoxShadow = element.style.boxShadow
  element.style.border = '2px solid #3B82F6'
  element.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)'

  // Click the element
  element.click()

  // Remove highlight after delay
  setTimeout(() => {
    element.style.border = originalBorder
    element.style.boxShadow = originalBoxShadow
  }, 1000)

  return {
    success: true,
    message: `Clicked on "${target}"`
  }
}

/**
 * Execute a fill action
 */
async function executeFill(target: string, value: string): Promise<ActionResult> {
  const input = findInputByLabel(target)
  
  if (!input) {
    return {
      success: false,
      message: `Could not find input field: "${target}". Try using the exact label or placeholder text.`
    }
  }

  // Scroll into view
  input.scrollIntoView({ behavior: 'smooth', block: 'center' })
  await new Promise(resolve => setTimeout(resolve, 300))

  // Focus the input
  input.focus()

  // Clear existing value
  input.value = ''

  // Highlight element
  const originalBorder = input.style.border
  input.style.border = '2px solid #3B82F6'

  // Type the value with animation effect
  for (let i = 0; i < value.length; i++) {
    input.value = value.substring(0, i + 1)
    // Trigger input event
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise(resolve => setTimeout(resolve, 30))
  }

  // Trigger change event
  input.dispatchEvent(new Event('change', { bubbles: true }))

  // Remove highlight
  setTimeout(() => {
    input.style.border = originalBorder
  }, 1000)

  return {
    success: true,
    message: `Filled "${target}" with "${value}"`
  }
}

/**
 * Execute a select action (for dropdowns)
 */
async function executeSelect(target: string, value: string): Promise<ActionResult> {
  const select = findInputByLabel(target) as HTMLSelectElement
  
  if (!select || select.tagName !== 'SELECT') {
    // Try to find dropdown button and click it
    const dropdownButton = findElement(target)
    if (dropdownButton) {
      dropdownButton.click()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Try to find and click the option
      const options = document.querySelectorAll('[role="option"], [role="menuitem"], .dropdown-item, li')
      for (const option of options) {
        if (option.textContent?.toLowerCase().includes(value.toLowerCase())) {
          (option as HTMLElement).click()
          return {
            success: true,
            message: `Selected "${value}" from "${target}"`
          }
        }
      }
    }
    
    return {
      success: false,
      message: `Could not find select field: "${target}"`
    }
  }

  // Find matching option
  const options = Array.from(select.options)
  const matchingOption = options.find(opt => 
    opt.text.toLowerCase().includes(value.toLowerCase()) ||
    opt.value.toLowerCase().includes(value.toLowerCase())
  )

  if (!matchingOption) {
    return {
      success: false,
      message: `Could not find option "${value}" in "${target}"`
    }
  }

  select.value = matchingOption.value
  select.dispatchEvent(new Event('change', { bubbles: true }))

  return {
    success: true,
    message: `Selected "${value}" in "${target}"`
  }
}

/**
 * Execute navigation
 */
async function executeNavigate(path: string): Promise<ActionResult> {
  // Handle relative paths
  if (path.startsWith('/')) {
    window.location.href = path
    return {
      success: true,
      message: `Navigating to ${path}`
    }
  }

  // Handle page names
  const pageMap: Record<string, string> = {
    'dashboard': '/dashboard',
    'home': '/dashboard',
    'timetable': '/dashboard/timetable',
    'timetable management': '/dashboard/academic/timetable',
    'templates': '/dashboard/academic/timetable/templates',
    'classes': '/dashboard/academic/classes',
    'subjects': '/dashboard/academic/subjects',
    'teachers': '/dashboard/academic/teachers',
    'academic years': '/dashboard/academic/years',
    'settings': '/dashboard/settings',
  }

  const targetPath = pageMap[path.toLowerCase()] || `/dashboard/${path.toLowerCase().replace(/\s+/g, '-')}`
  window.location.href = targetPath

  return {
    success: true,
    message: `Navigating to ${path}`
  }
}

/**
 * Execute scroll action
 */
async function executeScroll(direction: string): Promise<ActionResult> {
  const scrollAmount = 300
  
  if (direction.toLowerCase().includes('top') || direction.toLowerCase().includes('up')) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else if (direction.toLowerCase().includes('bottom') || direction.toLowerCase().includes('down')) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  } else {
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' })
  }

  return {
    success: true,
    message: `Scrolled ${direction}`
  }
}

/**
 * Execute checkbox/toggle action
 */
async function executeCheck(target: string, checked?: boolean): Promise<ActionResult> {
  const input = findInputByLabel(target) as HTMLInputElement
  
  if (!input || input.type !== 'checkbox') {
    // Try to find toggle/switch
    const toggle = findElement(target)
    if (toggle) {
      toggle.click()
      return {
        success: true,
        message: `Toggled "${target}"`
      }
    }
    
    return {
      success: false,
      message: `Could not find checkbox: "${target}"`
    }
  }

  const shouldCheck = checked ?? !input.checked
  if (input.checked !== shouldCheck) {
    input.click()
  }

  return {
    success: true,
    message: `${shouldCheck ? 'Checked' : 'Unchecked'} "${target}"`
  }
}

/**
 * Wait for a duration
 */
async function executeWait(duration: number): Promise<ActionResult> {
  await new Promise(resolve => setTimeout(resolve, duration))
  return {
    success: true,
    message: `Waited ${duration}ms`
  }
}

/**
 * Main action executor
 */
export async function executeAction(action: ExecutableAction): Promise<ActionResult> {
  try {
    switch (action.type) {
      case 'click':
        return await executeClick(action.target || '')
      
      case 'fill':
        return await executeFill(action.target || '', action.value || '')
      
      case 'select':
        return await executeSelect(action.target || '', action.value || '')
      
      case 'navigate':
        return await executeNavigate(action.target || action.value || '')
      
      case 'scroll':
        return await executeScroll(action.value || 'down')
      
      case 'focus':
        const element = findElement(action.target || '')
        if (element) {
          element.focus()
          return { success: true, message: `Focused on "${action.target}"` }
        }
        return { success: false, message: `Could not find element to focus: "${action.target}"` }
      
      case 'clear':
        const input = findInputByLabel(action.target || '')
        if (input) {
          input.value = ''
          input.dispatchEvent(new Event('input', { bubbles: true }))
          return { success: true, message: `Cleared "${action.target}"` }
        }
        return { success: false, message: `Could not find input to clear: "${action.target}"` }
      
      case 'check':
        return await executeCheck(action.target || '', action.value === 'true')
      
      case 'wait':
        return await executeWait(parseInt(action.value || '1000'))
      
      default:
        return { success: false, message: `Unknown action type: ${action.type}` }
    }
  } catch (error) {
    console.error('Action execution error:', error)
    return {
      success: false,
      message: `Error executing action: ${(error as Error).message}`
    }
  }
}

/**
 * Execute multiple actions in sequence
 */
export async function executeActions(actions: ExecutableAction[]): Promise<ActionResult[]> {
  const results: ActionResult[] = []
  
  for (const action of actions) {
    const result = await executeAction(action)
    results.push(result)
    
    // Stop if an action fails
    if (!result.success) {
      break
    }
    
    // Small delay between actions
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  return results
}

/**
 * Get page context for AI understanding
 */
export function getPageContext(): string {
  const buttons = Array.from(document.querySelectorAll('button'))
    .map(btn => btn.textContent?.trim())
    .filter(Boolean)
    .slice(0, 20)

  const inputs = Array.from(document.querySelectorAll('input, textarea, select'))
    .map(input => {
      const label = document.querySelector(`label[for="${input.id}"]`)?.textContent?.trim()
      const placeholder = (input as HTMLInputElement).placeholder
      const name = input.getAttribute('name')
      return label || placeholder || name
    })
    .filter(Boolean)
    .slice(0, 20)

  const links = Array.from(document.querySelectorAll('a'))
    .map(link => link.textContent?.trim())
    .filter(Boolean)
    .slice(0, 15)

  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .map(h => h.textContent?.trim())
    .filter(Boolean)
    .slice(0, 10)

  return JSON.stringify({
    currentUrl: window.location.pathname,
    pageTitle: document.title,
    headings,
    buttons,
    inputs,
    links
  }, null, 2)
}
