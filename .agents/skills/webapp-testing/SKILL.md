---
name: webapp-testing
description: Toolkit for testing and automating local web applications using Playwright. Use this skill when the user asks to test a web app, automate browser interactions, capture screenshots, check console logs, or verify UI behavior programmatically.
---

# Webapp Testing — Playwright Automation Toolkit

Use Playwright (Python) to test and automate local web applications. This skill provides a server lifecycle manager and example patterns for common testing scenarios.

## Prerequisites

Install Playwright:
```bash
pip install playwright
playwright install chromium
```

## Server Management

Use the `with_server.py` helper to start servers, wait for them to be ready, run tests, then clean up:

```bash
# Single server
python .agents/skills/webapp-testing/scripts/with_server.py --server "npm run dev" --port 5173 -- python automation.py

# Multiple servers (frontend + backend)
python .agents/skills/webapp-testing/scripts/with_server.py \
  --server "cd backend && python server.py" --port 3000 \
  --server "cd frontend && npm run dev" --port 5173 \
  -- python test.py
```

## Workflow

### 1. Reconnaissance First
Before automating, always discover the page structure:

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')

    # Discover buttons
    buttons = page.locator('button').all()
    print(f"Found {len(buttons)} buttons:")
    for i, btn in enumerate(buttons):
        text = btn.inner_text() if btn.is_visible() else "[hidden]"
        print(f"  [{i}] {text}")

    # Discover links
    links = page.locator('a[href]').all()
    print(f"Found {len(links)} links:")
    for link in links[:10]:
        text = link.inner_text().strip()
        href = link.get_attribute('href')
        print(f"  - {text} -> {href}")

    # Discover inputs
    inputs = page.locator('input, textarea, select').all()
    print(f"Found {len(inputs)} input fields")

    # Take screenshot
    page.screenshot(path='/tmp/page_discovery.png', full_page=True)
    browser.close()
```

### 2. Interaction Testing

```python
# Fill forms and interact
page.fill('#email', 'test@example.com')
page.fill('#password', 'password123')
page.click('button[type="submit"]')
page.wait_for_timeout(1000)
page.screenshot(path='/tmp/after_submit.png')
```

### 3. Console Log Capture

```python
console_logs = []

def handle_console_message(msg):
    console_logs.append(f"[{msg.type}] {msg.text}")
    print(f"Console: [{msg.type}] {msg.text}")

page.on("console", handle_console_message)
page.goto(url)
page.wait_for_load_state('networkidle')
```

### 4. Static HTML Files

```python
import os
html_path = os.path.abspath('path/to/file.html')
page.goto(f'file://{html_path}')
```

## Key Patterns

| Pattern | When to Use |
|---------|-------------|
| `page.wait_for_load_state('networkidle')` | After navigation, wait for page to fully load |
| `page.wait_for_selector('.element')` | Wait for a specific element to appear |
| `page.wait_for_timeout(1000)` | Wait for animations/transitions |
| `page.screenshot(path='...', full_page=True)` | Capture full-page screenshots |
| `page.locator('selector').all()` | Get all matching elements |
| `page.evaluate('expression')` | Execute JavaScript in the page |

## Best Practices

1. **Always use `headless=True`** for automated testing
2. **Set viewport size** explicitly: `page.new_page(viewport={'width': 1920, 'height': 1080})`
3. **Wait for load states** before interacting with elements
4. **Capture screenshots** at key checkpoints for debugging
5. **Use `with_server.py`** for managing dev server lifecycles
6. **Clean up** by closing the browser in a `finally` block
