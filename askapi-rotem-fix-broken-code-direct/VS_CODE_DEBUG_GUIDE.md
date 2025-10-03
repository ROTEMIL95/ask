# VS Code Debugging Guide for Flask Backend

## Step 1: Open VS Code
1. Open VS Code
2. Open the folder: `C:\Projects\askapi\askapi-main`

## Step 2: Set Breakpoints
Open `Backend\routes\api_routes.py` and click in the left margin (left of line numbers) to set breakpoints at these key lines:

### Recommended Breakpoint Locations:
- **Line 58-59**: Start of `/ask` function (to see when endpoint is called)
- **Line 62**: After receiving data from request
- **Line 68**: After extracting the question
- **Line 94-96**: Before calling OpenAI API
- **Line 107-108**: After OpenAI API response
- **Line 111**: After extracting the answer
- **Line 121**: Before returning the response

Breakpoints will appear as red dots in the margin.

## Step 3: Start Debugging

### Method 1: Using Debug Panel
1. Press `Ctrl+Shift+D` to open Debug panel (or click Debug icon in sidebar)
2. At the top, select "Debug Flask Backend" from dropdown
3. Click green play button (or press `F5`)

### Method 2: Using Command Palette
1. Press `Ctrl+Shift+P`
2. Type "Debug: Start Debugging"
3. Select "Debug Flask Backend"

## Step 4: Server Will Start
- The terminal will show the Flask server starting
- Server will be running at http://localhost:5000
- VS Code is now waiting for requests

## Step 5: Start Frontend (in a new terminal)
1. Open new terminal in VS Code: `Ctrl+Shift+` ` (backtick)
2. Run:
   ```
   cd Frontend
   npm run dev
   ```
3. Frontend will start at http://localhost:5173

## Step 6: Trigger a Breakpoint
1. Open browser: http://localhost:5173
2. Enter API documentation
3. Enter a query
4. Click "Ask Your API Assistant"
5. VS Code will pause at your first breakpoint!

## Step 7: Debug Controls

### Top Debug Toolbar:
- **Continue (F5)**: Run to next breakpoint
- **Step Over (F10)**: Execute current line, don't enter functions
- **Step Into (F11)**: Enter into function calls
- **Step Out (Shift+F11)**: Exit current function
- **Restart (Ctrl+Shift+F5)**: Restart debugging
- **Stop (Shift+F5)**: Stop debugging

### Debug Panel (Left Side):
- **VARIABLES**: See all local and global variables
- **WATCH**: Add expressions to monitor
- **CALL STACK**: See function call hierarchy
- **BREAKPOINTS**: Manage all breakpoints

## Step 8: Inspect Variables

### Hover Method:
- Hover over any variable in code to see its value

### Debug Console:
1. Click "Debug Console" tab at bottom
2. Type variable names or Python expressions
3. Press Enter to evaluate

### Examples in Debug Console:
```python
# See the question content
question

# Check data structure
data

# Inspect OpenAI response (when at that breakpoint)
response

# Check specific values
len(question)
type(data)

# Execute Python code
print(json.dumps(data, indent=2))
```

## Step 9: Conditional Breakpoints
Right-click on a breakpoint and select "Edit Breakpoint":
- Add condition: `len(question) > 100`
- Add hit count: Break only after 3 hits
- Add log message: Print without stopping

## Step 10: Common Debug Scenarios

### Check OpenAI Request:
Set breakpoint at line 98 (before `client.chat.completions.create`)
Inspect:
- `system_prompt`
- `question`
- `client` object

### Check OpenAI Response:
Set breakpoint at line 107 (after API call)
Inspect:
- `response`
- `response.choices[0].message.content`
- `response.usage`

### Check Final Response:
Set breakpoint at line 121 (return statement)
Inspect the complete JSON being returned

## Keyboard Shortcuts Summary:
- `F5`: Continue/Start debugging
- `F10`: Step over
- `F11`: Step into
- `Shift+F11`: Step out
- `F9`: Toggle breakpoint
- `Ctrl+Shift+D`: Open debug panel
- `Shift+F5`: Stop debugging
- `Ctrl+Shift+F5`: Restart debugging

## Troubleshooting:

### If breakpoints don't hit:
1. Make sure server is running through VS Code debugger
2. Check that breakpoints are on executable lines (not comments/empty lines)
3. Ensure you're making requests to correct port (5000)

### If you see "Unverified Breakpoint":
- Make sure you selected "Debug Flask Backend" configuration
- Try restarting VS Code

### To see print() statements:
- They appear in the "Terminal" tab at bottom
- Or in "Debug Console" if redirectOutput is true

## Tips:
1. Use "Step Over" (F10) most of the time
2. Use "Step Into" (F11) only when you want to debug inside a function
3. Add variables to WATCH panel for continuous monitoring
4. Use Debug Console to test fixes before changing code
5. You can edit code while debugging and restart (Ctrl+Shift+F5)

---

Ready to debug! Press F5 to start!