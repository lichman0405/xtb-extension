# Extension Testing Checklist

## Pre-Test Setup

1. ✅ Build completed: `npm run build`
2. ✅ All packages compiled successfully
3. Ready to launch Extension Development Host

## How to Test

### Method 1: Press F5 (Recommended)

1. Open this project folder in VS Code
2. Press `F5` key
3. A new "Extension Development Host" window will open
4. The extension is now active in that window

### Method 2: Debug Panel

1. Go to Run and Debug panel (Ctrl+Shift+D)
2. Select "Launch Extension" from dropdown
3. Click green play button
4. Extension Development Host window opens

---

## Test Cases

### ✅ Test 1: Extension Activation

**File:** Open any `.xcontrol` file

**Expected:**

- Extension activates automatically
- No error messages in Debug Console
- Status bar shows "xTB xcontrol" language

**Status:** [ ]

---

### ✅ Test 2: Syntax Highlighting

**File:** `examples/syntax-test.xcontrol`

**Check:**

- [ ] Instructions ($fix, $constrain, etc.) are highlighted
- [ ] $end has distinct color
- [ ] Option keys (atoms, distance, etc.) are colored
- [ ] Comments (#) are grayed out
- [ ] Numbers are highlighted
- [ ] Strings in quotes are colored
- [ ] Unknown instructions show as errors/different color

**Status:** [ ]

---

### ✅ Test 3: Diagnostics - Unknown Instruction

**File:** `examples/invalid.xcontrol` (line 4)

**Check:**

- [ ] Red/yellow squiggle under `$unknown_instruction`
- [ ] Hover shows error message
- [ ] Problems panel shows error
- [ ] Error code: xtb.unknownInstruction

**Status:** [ ]

---

### ✅ Test 4: Diagnostics - Orphan Option

**File:** `examples/invalid.xcontrol` (line 8)

**Check:**

- [ ] Error squiggle under `orphan_option`
- [ ] Message: "Option ... appears outside of any instruction block"
- [ ] Error code: xtb.orphanOption

**Status:** [ ]

---

### ✅ Test 5: Diagnostics - Missing $end

**File:** `examples/invalid.xcontrol` (line 16)

**Check:**

- [ ] Hint/info squiggle on `$constrain`
- [ ] Message about missing $end
- [ ] Severity: Hint (blue)
- [ ] Error code: xtb.missingEnd

**Status:** [ ]

---

### ✅ Test 6: Diagnostics - Suspicious Operator

**File:** `examples/invalid.xcontrol` (line 27-28)

**Check:**

- [ ] Warning on `potential: logfermi` (should use =)
- [ ] Warning on `sphere = auto,30` (should use :)
- [ ] Error code: xtb.suspiciousOperator

**Status:** [ ]

---

### ✅ Test 7: Valid File - No Diagnostics

**File:** `examples/simple.xcontrol`

**Check:**

- [ ] No errors in Problems panel
- [ ] No squiggles in editor
- [ ] Clean syntax highlighting

**Status:** [ ]

---

### ✅ Test 8: Code Snippets

**Create new file:** `test.xcontrol`

**Test snippets:**

1. Type `xtb.chrg` → Tab
   - [ ] Expands to `$chrg 0`
   - [ ] Cursor on number, ready to edit

2. Type `xtb.fix` → Tab
   - [ ] Full $fix block appears
   - [ ] Tab moves through placeholders
   - [ ] $end is included

3. Type `xtb.template` → Tab
   - [ ] Complete file template appears
   - [ ] Multiple tab stops work

4. Type `xtb.` and wait
   - [ ] IntelliSense shows all 19 snippets
   - [ ] Descriptions are visible

**Status:** [ ]

---

### ✅ Test 9: Configuration Settings

**Steps:**

1. Open VS Code Settings (Ctrl+,)
2. Search for "xtb xcontrol"

**Check:**

- [ ] "xTB xcontrol" section appears
- [ ] 6 diagnostic severity settings visible
- [ ] Dropdown shows: error, warning, info, hint, off
- [ ] Default values are correct

**Test changing settings:**

1. Set "Unknown Instruction" to "off"
2. Open `examples/invalid.xcontrol`
3. [ ] Unknown instruction error disappears
4. Set back to "error"
5. [ ] Error reappears

**Status:** [ ]

---

### ✅ Test 10: Language Configuration

**File:** Create new `.xcontrol` file

**Check:**

1. Type `#` → Space
   - [ ] Comment character works
2. Type `(`
   - [ ] Closing `)` auto-inserted
3. Type `"`
   - [ ] Closing `"` auto-inserted

4. Select text → Type `(`
   - [ ] Text wrapped in parentheses

**Status:** [ ]

---

### ✅ Test 11: Real-World Scenario

**Create:** `my-optimization.xcontrol`

```
# My test optimization
$chrg 0
$spin 0

$fix
   atoms: 1-10
   elements: C
$end

$constrain
   distance: 11,12,2.5
$end

$wall
   potential=logfermi
   sphere: auto,25
   temp=300
$end

$opt
   maxcycle=500
$end
```

**Check:**

- [ ] All syntax highlighted correctly
- [ ] No diagnostics/errors
- [ ] Snippets helped create it quickly
- [ ] Readable and well-formatted

**Status:** [ ]

---

## Common Issues and Solutions

### Issue: Extension doesn't activate

**Solution:** Check Debug Console for errors, rebuild with `npm run build`

### Issue: No syntax highlighting

**Solution:** Check file extension is `.xcontrol`, `.xtbrc`, or filename is `xtb.inp`

### Issue: Diagnostics not appearing

**Solution:**

- Check Language Server is running (see Output panel → xTB xcontrol Language Server)
- Restart Extension Development Host (Ctrl+Shift+F5)

### Issue: Snippets not working

**Solution:** Check file language mode is set to "xTB xcontrol"

---

## Performance Check

**Test with larger files:**

1. Create file with 100+ lines
2. [ ] Syntax highlighting responsive
3. [ ] Diagnostics update quickly on edit
4. [ ] No lag when typing

---

## Final Verification

Before marking complete:

- [ ] All critical tests (1-7) pass
- [ ] At least 5 snippets tested
- [ ] Settings can be changed
- [ ] No crashes or freezes
- [ ] Debug Console shows no errors

---

## Notes

Use this space to record any issues found:

```
Issue:
Expected:
Actual:
Severity: (Critical/Major/Minor)
```

---

## Next Steps After Testing

If all tests pass:

1. Create extension icon
2. Update user README
3. Package extension (.vsix)
4. Final installation test

If issues found:

1. Document issues
2. Fix critical bugs
3. Retest
4. Continue when stable
