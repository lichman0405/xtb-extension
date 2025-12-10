# TextMate Grammar Specification for xTB xcontrol

> File: `docs/04-tmLanguage-spec.md`  
> Version: 0.1 (draft for implementation)  
> Audience: grammar authors / extension developers  

This document specifies how to implement the **TextMate grammar** used for syntax highlighting of xTB xcontrol files in VS Code.

The goals are:

- Provide clear, consistent highlighting for:
  - Instruction lines starting with `$`.
  - Option keys and values in instruction bodies.
  - Comments, numbers, and strings.
- Keep the grammar **simple and robust**, avoiding excessive complexity or brittle regexes.
- Make it easy to extend later with more fine‑grained scopes if needed.

---

## 1. General Design

### 1.1 Scope Name

We define a single root scope for this language:

- `scopeName`: **`source.xtb-xcontrol`**

This scope will be associated with the language id `xtb-xcontrol` in the extension manifest.

### 1.2 Token Categories and Scopes

We will use the following TextMate scopes to align with common themes and maximize compatibility:

- **Instructions** (lines starting with `$`):
  - Instruction sigil + name (e.g. `$fix`, `$constrain`):
    - `keyword.control.directive.xtb-xcontrol`

- **Option keys** (before `:` or `=`):
  - `keyword.other.option.xtb-xcontrol`

- **Option operators** (`:` or `=`):
  - `keyword.operator.assignment.xtb-xcontrol`

- **Option values**:
  - The value region is typically not specially scoped beyond numbers/strings, but we can use:
    - `meta.option.value.xtb-xcontrol` (meta scope), within which numbers/strings/comments inherit usual scopes.

- **Comments**:
  - Leading or inline `# ...`:
    - `comment.line.number-sign.xtb-xcontrol`

- **Numbers**:
  - Integer / floating / scientific forms:
    - `constant.numeric.xtb-xcontrol`

- **Strings**:
  - Single or double quoted strings:
    - `string.quoted.double.xtb-xcontrol`
    - `string.quoted.single.xtb-xcontrol`

The grammar is **line-based** and does not attempt to enforce block structure (`$fix` vs `$constrain` vs `$end`) – that responsibility lies in the Language Server.

---

## 2. File Layout: `xtb.tmLanguage.json`

The grammar file lives in `packages/client/syntaxes/xtb.tmLanguage.json` and follows the standard TextMate JSON format.

High-level structure:

```jsonc
{
  "name": "xTB xcontrol",
  "scopeName": "source.xtb-xcontrol",
  "fileTypes": [
    "xtb.inp",
    "xcontrol",
    "xtbrc"
  ],
  "patterns": [
    { "include": "#instruction-line" },
    { "include": "#comment" },
    { "include": "#option-line" },
    { "include": "#numbers" },
    { "include": "#strings" }
  ],
  "repository": {
    "instruction-line": { /* ... */ },
    "comment": { /* ... */ },
    "option-line": { /* ... */ },
    "numbers": { /* ... */ },
    "strings": { /* ... */ }
  }
}
```

Notes:

- `fileTypes` is optional in VS Code (mapping is also done via `contributes.grammars`), but including it can help other editors.
- The order of `patterns` matters:
  - We want to match instruction lines before generic option/number rules.
  - Comments should be recognized reliably on any line.

---

## 3. Instruction Lines

### 3.1 Requirements

An **instruction line** is any line whose first non‑whitespace character is `$`. Examples:

```text
$fix
$constrain
$wall
$chrg 0      # with argument and comment
   $spin 1   # leading whitespace
```

We want to:

- Highlight the prefix and instruction name (e.g. `$fix`) as `keyword.control.directive.xtb-xcontrol`.
- Leave the rest of the line (arguments) unscoped, apart from numbers/strings/comments which are handled separately.

### 3.2 Pattern Design

We can define an `instruction-line` pattern in the repository that matches the beginning of the line up to the first whitespace or comment.

Example pattern:

```jsonc
"instruction-line": {
  "patterns": [
    {
      "name": "meta.instruction.xtb-xcontrol",
      "match": "^(\s*)(\$[A-Za-z0-9_]+)",
      "captures": {
        "1": { "name": "punctuation.whitespace.leading.xtb-xcontrol" },
        "2": { "name": "keyword.control.directive.xtb-xcontrol" }
      }
    }
  ]
}
```

Notes:

- `match` anchors at the start of the line (`^`) and permits leading whitespace.
- The instruction token is captured as group 2 and given the `keyword.control.directive.xtb-xcontrol` scope.
- We do not attempt to capture trailing arguments; they will be highlighted by number/string patterns if applicable.

If needed later, we can add a separate pattern to highlight `$end` differently, but for v0.1 it is acceptable to treat it like any other instruction.

---

## 4. Comments

### 4.1 Requirements

- A comment is any `#` and the rest of the line.
- Comments may appear on their own line or after code.

Examples:

```text
# pure comment
$fix       # instruction with comment
atoms: 1-10  # option with comment
```

### 4.2 Pattern Design

We define a general `comment` pattern that can be applied on any line.

```jsonc
"comment": {
  "patterns": [
    {
      "name": "comment.line.number-sign.xtb-xcontrol",
      "match": "#.*$"
    }
  ]
}
```

This simply captures `#` to end-of-line.  
Ordering in the top-level `patterns` ensures comments are applied in addition to other scopes.

If more control is desired, we can refine to capture leading whitespace, but for most themes the simple form is sufficient.

---

## 5. Option Lines (Keys and Operators)

### 5.1 Requirements

An **option line** typically takes the form:

- `key: value`
- `key = value`

We want to:

- Highlight `key` as `keyword.other.option.xtb-xcontrol`.
- Highlight `:` or `=` as `keyword.operator.assignment.xtb-xcontrol`.
- Optionally wrap the `value` region in `meta.option.value.xtb-xcontrol` to help themes.

Important: The TextMate grammar cannot robustly distinguish “real” option lines from arbitrary text, but we assume that lines containing a colon or equals sign in a “key operator value” layout are meant to be options.

### 5.2 Pattern Design

We define an `option-line` pattern that matches a broad set of option-like structures.

```jsonc
"option-line": {
  "patterns": [
    {
      "name": "meta.option.line.xtb-xcontrol",
      "match": "^(\s*)([^#:=]+?)(\s*)([:=])(\s*)([^#]+)?",
      "captures": {
        "1": { "name": "punctuation.whitespace.leading.xtb-xcontrol" },
        "2": { "name": "keyword.other.option.xtb-xcontrol" },
        "3": { "name": "punctuation.whitespace.xtb-xcontrol" },
        "4": { "name": "keyword.operator.assignment.xtb-xcontrol" },
        "5": { "name": "punctuation.whitespace.xtb-xcontrol" },
        "6": { "name": "meta.option.value.xtb-xcontrol" }
      }
    }
  ]
}
```

Explanation:

- Group 1: leading whitespace.
- Group 2: `key` – any non-empty sequence of characters up to (but not including) `:` or `=` or `#`.
- Group 4: the operator (`:` or `=`).
- Group 6: the raw value portion, up to (but not including) `#` (if present).

Caveats:

- This regex is intentionally permissive; it may also match non-option lines that contain `:` or `=` in a similar layout. This is acceptable for highlighting in most cases.
- Comments are handled separately via the `comment` rule, so we do not attempt to capture comment text here.

---

## 6. Numbers

### 6.1 Requirements

xcontrol values frequently contain numeric literals, which we'd like to highlight consistently:

- Integers (e.g. `1`, `10`, `-5`)
- Floating point (e.g. `1.0`, `-0.25`, `3.14e-2`, `2.0d+00`, etc.)

### 6.2 Pattern Design

We add a `numbers` pattern that matches numeric-looking tokens anywhere in code/value regions. We do **not** try to be perfect; a reasonable approximation is enough.

```jsonc
"numbers": {
  "patterns": [
    {
      "name": "constant.numeric.xtb-xcontrol",
      "match": "(?<![A-Za-z0-9_])[-+]?(?:\d+\.\d*|\d*\.\d+|\d+)(?:[eEdD][+-]?\d+)?(?![A-Za-z0-9_])"
    }
  ]
}
```

Notes:

- The pattern uses negative/positive look-arounds to avoid catching substrings inside words.
- It supports both `e`/`E` and `d`/`D` notation for exponents (common in some quantum chemistry formats).

---

## 7. Strings

### 7.1 Requirements

Some values (e.g. in `$cmd`, `$date`, or other options) may be strings, single or double quoted. We want to give them a standard string scope.

### 7.2 Pattern Design

We define a `strings` pattern with two subpatterns: single and double quotes.

```jsonc
"strings": {
  "patterns": [
    {
      "name": "string.quoted.double.xtb-xcontrol",
      "begin": """,
      "end": """,
      "patterns": [
        {
          "name": "constant.character.escape.xtb-xcontrol",
          "match": "\\."
        }
      ]
    },
    {
      "name": "string.quoted.single.xtb-xcontrol",
      "begin": "'",
      "end": "'",
      "patterns": [
        {
          "name": "constant.character.escape.xtb-xcontrol",
          "match": "\\."
        }
      ]
    }
  ]
}
```

Notes:

- This is a simple string matcher; it does not handle multi-line strings (not expected in xcontrol files).
- Escape sequences are highlighted minimally as `constant.character.escape.xtb-xcontrol`.

---

## 8. Putting It All Together – Full Skeleton

Below is a consolidated skeleton of `xtb.tmLanguage.json` showing how the repository and patterns interact. This is **not** necessarily the final implementation but should be a very close starting point.

```jsonc
{
  "name": "xTB xcontrol",
  "scopeName": "source.xtb-xcontrol",
  "fileTypes": [
    "xtb.inp",
    "xcontrol",
    "xtbrc"
  ],
  "patterns": [
    { "include": "#instruction-line" },
    { "include": "#comment" },
    { "include": "#option-line" },
    { "include": "#strings" },
    { "include": "#numbers" }
  ],
  "repository": {
    "instruction-line": {
      "patterns": [
        {
          "name": "meta.instruction.xtb-xcontrol",
          "match": "^(\s*)(\$[A-Za-z0-9_]+)",
          "captures": {
            "1": { "name": "punctuation.whitespace.leading.xtb-xcontrol" },
            "2": { "name": "keyword.control.directive.xtb-xcontrol" }
          }
        }
      ]
    },
    "comment": {
      "patterns": [
        {
          "name": "comment.line.number-sign.xtb-xcontrol",
          "match": "#.*$"
        }
      ]
    },
    "option-line": {
      "patterns": [
        {
          "name": "meta.option.line.xtb-xcontrol",
          "match": "^(\s*)([^#:=]+?)(\s*)([:=])(\s*)([^#]+)?",
          "captures": {
            "1": { "name": "punctuation.whitespace.leading.xtb-xcontrol" },
            "2": { "name": "keyword.other.option.xtb-xcontrol" },
            "3": { "name": "punctuation.whitespace.xtb-xcontrol" },
            "4": { "name": "keyword.operator.assignment.xtb-xcontrol" },
            "5": { "name": "punctuation.whitespace.xtb-xcontrol" },
            "6": { "name": "meta.option.value.xtb-xcontrol" }
          }
        }
      ]
    },
    "numbers": {
      "patterns": [
        {
          "name": "constant.numeric.xtb-xcontrol",
          "match": "(?<![A-Za-z0-9_])[-+]?(?:\d+\.\d*|\d*\.\d+|\d+)(?:[eEdD][+-]?\d+)?(?![A-Za-z0-9_])"
        }
      ]
    },
    "strings": {
      "patterns": [
        {
          "name": "string.quoted.double.xtb-xcontrol",
          "begin": """,
          "end": """,
          "patterns": [
            {
              "name": "constant.character.escape.xtb-xcontrol",
              "match": "\\."
            }
          ]
        },
        {
          "name": "string.quoted.single.xtb-xcontrol",
          "begin": "'",
          "end": "'",
          "patterns": [
            {
              "name": "constant.character.escape.xtb-xcontrol",
              "match": "\\."
            }
          ]
        }
      ]
    }
  }
}
```

This skeleton covers all high‑priority highlighting elements for v0.1.

---

## 9. Testing Strategy

After implementing `xtb.tmLanguage.json`, verify highlighting using:

1. A small suite of sample xcontrol files (or snippets) that include:
   - Instruction lines (`$fix`, `$constrain`, `$wall`, `$chrg`, `$spin`, `$cmd`, `$date`, `$end`).
   - Option lines with both `:` and `=`.
   - Numeric values, including exponent notations.
   - Strings (single and double quoted).
   - Standalone comments and inline comments.

2. Open these files in an Extension Development Host and visually confirm:
   - Instructions are clearly distinct from options.
   - Option keys and operators are highlighted as intended.
   - Numbers and strings inside values are highlighted.
   - Comments are consistently greyed-out or styled per theme.

3. If needed, adjust regexes to reduce over‑matching or under‑matching, but keep them simple and robust. Perfect semantic discrimination is not required from the grammar; deeper logic belongs in the Language Server.
