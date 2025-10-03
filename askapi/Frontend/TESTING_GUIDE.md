# Testing Guide

## Setup Complete ✅

Your Vitest testing setup is now configured with:
- **Vitest** for test runner
- **React Testing Library** for component testing
- **jsdom** for DOM environment
- **jest-dom** for additional matchers

## Available Scripts

```bash
# Run tests in watch mode (development)
npm test

# Run tests once
npm run test:run

# Run tests with UI (if @vitest/ui is installed)
npm run test:ui
```

## Test File Structure

### Naming Convention
- `*.test.jsx` - Test files
- `*.spec.jsx` - Alternative naming
- `__tests__/` - Test directories

### Example Structure
```
src/
├── components/
│   ├── Button.jsx
│   └── Button.test.jsx
├── pages/
│   ├── Home.jsx
│   └── Home.test.jsx
├── App.jsx
├── App.test.jsx
└── setupTests.js
```

## Writing Tests

### Basic Component Test
```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

### Testing API Calls
```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useAskApi } from './api/askApi'

// Mock the API hook
vi.mock('./api/askApi', () => ({
  useAskApi: vi.fn()
}))

describe('API Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  it('displays loading state', () => {
    useAskApi.mockReturnValue({
      loading: true,
      error: null,
      askQuestion: vi.fn()
    })

    render(<YourComponent />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
```

### Testing Router Components
```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import HomePage from './pages/Home'

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('HomePage', () => {
  it('renders home page content', () => {
    renderWithRouter(<HomePage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
```

## Testing Utilities

### Custom Render Function
```jsx
// src/test-utils.jsx
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Mock Data
```jsx
// src/__mocks__/api.js
export const mockApiResponse = {
  answer: "This is a test answer",
  model: "gpt-5",
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30
  }
}
```

## Common Testing Patterns

### Testing User Interactions
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Form', () => {
  it('submits form data', async () => {
    const user = userEvent.setup()
    render(<Form />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /submit/i }))
    
    expect(screen.getByText(/submitted/i)).toBeInTheDocument()
  })
})
```

### Testing Async Operations
```jsx
import { render, screen, waitFor } from '@testing-library/react'

describe('Async Component', () => {
  it('loads data and displays it', async () => {
    render(<AsyncComponent />)
    
    // Wait for loading to disappear
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
    
    // Check for loaded data
    expect(screen.getByText(/loaded data/i)).toBeInTheDocument()
  })
})
```

## Available Matchers

### jest-dom Matchers
```jsx
expect(element).toBeInTheDocument()
expect(element).toHaveClass('className')
expect(element).toHaveAttribute('data-testid', 'value')
expect(element).toHaveTextContent('text')
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toBeChecked()
```

### Custom Matchers
```jsx
// Add custom matchers in setupTests.js
expect.extend({
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pass = emailRegex.test(received)
    return {
      pass,
      message: () => `expected ${received} to be a valid email`
    }
  }
})
```

## Best Practices

1. **Test behavior, not implementation**
2. **Use semantic queries** (getByRole, getByLabelText)
3. **Avoid test-id attributes** when possible
4. **Test user interactions**, not internal state
5. **Keep tests simple and focused**
6. **Use descriptive test names**
7. **Mock external dependencies**
8. **Test error states and edge cases**

## Debugging Tests

### Debug Mode
```bash
# Run tests with debug output
npm test -- --reporter=verbose

# Run specific test file
npm test App.test.jsx

# Run tests matching pattern
npm test -- -t "button"
```

### Screen Debug
```jsx
import { screen } from '@testing-library/react'

// Print current DOM
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))
```

## Coverage

Add coverage to your test script:
```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:run
``` 