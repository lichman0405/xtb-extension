# Snippets and UX Specification

> File: `docs/07-snippets-and-ux.md`  
> Version: 0.1 (draft for implementation)  
> Audience: VS Code extension developers  

This document defines:

- The **snippets** to provide for xTB xcontrol files.
- A few **UX conventions** (language configuration, settings, and minor polish) for the extension.

The goal is to make editing xcontrol / `xtb.inp` files faster and more pleasant, without adding heavy or intrusive UI.

---

## 1. Snippet Design Principles

Snippets should:

1. **Reflect common patterns** in xcontrol files (not obscure features).
2. Be **short and mnemonic** so they are easy to remember and trigger.
3. Use **tabstops** (`$1`, `$2`, …) and **placeholders** meaningfully, but not excessively.
4. Be **non-destructive**: they should not emit large boilerplate that users constantly delete.
5. Be scoped to the language id: `xtb-xcontrol` only.

All snippets live in:

- `packages/client/snippets/xtb.json`

and are registered in the extension manifest under:

```jsonc
"contributes": {
  "snippets": [
    {
      "language": "xtb-xcontrol",
      "path": "./snippets/xtb.json"
    }
  ]
}
```

---

## 2. Snippet File Format

The snippet file `xtb.json` uses the standard VS Code snippet JSON format:

```jsonc
{
  "Snippet Name": {
    "prefix": "triggerText",
    "body": [
      "line 1",
      "line 2 with ${1:placeholder}",
      "line 3"
    ],
    "description": "Human-readable description"
  }
}
```

Notes:

- `prefix` is what the user types in the editor to trigger the snippet (via suggestion list or Tab completion, depending on VS Code settings).
- `body` is an array of lines, with `\n` implicitly inserted between array elements.
- `${1:placeholder}` defines the first tabstop with a default placeholder value.
- `$0` defines the final cursor position after all tabstops have been cycled through.

---

## 3. Core Snippets (v0.1)

Below is the recommended set of snippets for v0.1. Names and prefixes can be adjusted slightly if needed, but the intention and structure should remain.

### 3.1 `$fix` Block

**Name**: `xtb.fix block`  
**Prefix**: `"xtb.fix"`

**Purpose**: Quickly insert a `$fix` block to freeze atoms by index and/or element.

**Body**:

```jsonc
"xtb.fix block": {
  "prefix": "xtb.fix",
  "body": [
    "$fix",
    "  atoms: ${1:1-10}",
    "  elements: ${2:O}",
    "$end$0"
  ],
  "description": "Insert a $fix block with atoms and elements selections"
}
```

Behavior:

- After expansion, the cursor lands first on the `atoms` selection, then `elements`, then after `$end`.

---

### 3.2 `$constrain` Block

**Name**: `xtb.constrain block`  
**Prefix**: `"xtb.constrain"`

**Purpose**: Insert a `$constrain` block covering typical distance/angle/dihedral constraints.

**Body**:

```jsonc
"xtb.constrain block": {
  "prefix": "xtb.constrain",
  "body": [
    "$constrain",
    "  atoms: ${1:1}",
    "  distance: ${2:1 2 1.5}",
    "  angle: ${3:1 2 3 120.0}",
    "  dihedral: ${4:1 2 3 4 180.0}",
    "$end$0"
  ],
  "description": "Insert a $constrain block with atoms, distance, angle, and dihedral constraints"
}
```

Notes:

- The placeholders are illustrative; users will typically override them immediately.

---

### 3.3 `$wall` Block

**Name**: `xtb.wall block`  
**Prefix**: `"xtb.wall"`

**Purpose**: Insert a `$wall` block for simple confining potentials.

**Body**:

```jsonc
"xtb.wall block": {
  "prefix": "xtb.wall",
  "body": [
    "$wall",
    "  potential = ${1:polynomial}",
    "  alpha     = ${2:0.5}",
    "  beta      = ${3:0.0}",
    "  temp      = ${4:300.0}",
    "  sphere: ${5:10.0 0.0 0.0 0.0}",
    "$end$0"
  ],
  "description": "Insert a $wall block with potential, alpha/beta/temp and a spherical wall"
}
```

---

### 3.4 `$write` Block (Optional Skeleton)

**Name**: `xtb.write block`  
**Prefix**: `"xtb.write"`

**Purpose**: Provide a basic `$write` block skeleton, which users can customize.

**Body** (example; keys are placeholders and should be updated to actual common usage if known):

```jsonc
"xtb.write block": {
  "prefix": "xtb.write",
  "body": [
    "$write",
    "  ${1:what}: ${2:values}",
    "$end$0"
  ],
  "description": "Insert a minimal $write block (customize options as needed)"
}
```

This is intentionally minimal; it gives a starting structure without guessing too many details.

---

### 3.5 Charge & Spin Setup

**Name**: `xtb.chrgspin`  
**Prefix**: `"xtb.chrgspin"`

**Purpose**: Insert a common pair of `$chrg` and `$spin` instructions at once.

**Body**:

```jsonc
"xtb.charge and spin": {
  "prefix": "xtb.chrgspin",
  "body": [
    "$chrg ${1:0}",
    "$spin ${2:1}$0"
  ],
  "description": "Insert $chrg and $spin instructions"
}
```

Users can quickly adjust total charge and spin multiplicity.

---

### 3.6 `$cmd` Instruction

**Name**: `xtb.cmd`  
**Prefix**: `"xtb.cmd"`

**Purpose**: Insert a `$cmd` instruction line, often used to run shell commands before or after xTB.

**Body**:

```jsonc
"xtb.cmd instruction": {
  "prefix": "xtb.cmd",
  "body": [
    "$cmd ${1:echo "Running xTB"}$0"
  ],
  "description": "Insert a $cmd instruction with a shell command"
}
```

---

### 3.7 Minimal File Skeleton (Optional)

**Name**: `xtb.template`  
**Prefix**: `"xtb.template"`

**Purpose**: Provide a minimal starting template for a new xcontrol file.

**Body**:

```jsonc
"xtb.minimal template": {
  "prefix": "xtb.template",
  "body": [
    "# xTB xcontrol file",
    "$chrg ${1:0}",
    "$spin ${2:1}",
    "",
    "$fix",
    "  atoms: ${3:1-10}",
    "$end$0"
  ],
  "description": "Insert a minimal xcontrol template with charge, spin and a $fix block"
}
```

This is optional, but can be very helpful when starting a new file from scratch.

---

## 4. UX Conventions and Polishing

Beyond snippets, a few small UX details improve the overall editing experience.

### 4.1 Language Configuration (`language-configuration.json`)

File: `packages/client/language-configuration.json`

Recommended settings:

```jsonc
{
  "comments": {
    "lineComment": "#"
  },
  "brackets": [
    ["[", "]"],
    ["(", ")"],
    ["{", "}"]
  ],
  "autoClosingPairs": [
    { "open": "[", "close": "]" },
    { "open": "(", "close": ")" },
    { "open": "{", "close": "}" },
    { "open": """, "close": """, "notIn": ["string"] },
    { "open": "'", "close": "'", "notIn": ["string"] }
  ],
  "surroundingPairs": [
    ["[", "]"],
    ["(", ")"],
    ["{", "}"],
    [""", """],
    ["'", "'"]
  ],
  "indentationRules": {
    "increaseIndentPattern": "^(\s*)\$(fix|constrain|wall|write)\b",
    "decreaseIndentPattern": "^(\s*)\$end\b"
  }
}
```

Rationale:

- `lineComment: "#"` allows toggle comment (`Ctrl+/`) to use `#` lines.
- `indentationRules` increases indent after `$fix`, `$constrain`, `$wall`, `$write` and decreases at `$end`.
- Bracket configuration is generic; xcontrol itself does not rely heavily on brackets, but this keeps default VS Code behavior reasonable.

### 4.2 Diagnostics Presentation

The diagnostic rules are defined in `06-diagnostics-rules.md`. UX considerations:

- Set `Diagnostic.source` to `"xtb-xcontrol"` for all diagnostics, so users can filter them easily.
- Use concise, actionable messages:
  - Mention the offending instruction/option name.
  - When possible, suggest the likely fix (e.g. expected operator).
- Keep default severities conservative (mostly warnings and information), to avoid overwhelming users.

Example from a diagnostic:

```ts
{
  range,
  severity,
  source: "xtb-xcontrol",
  code: "xtb.unknownOption",
  message: "Unknown option key 'atomz' for instruction '$fix'."
}
```

### 4.3 Settings and Discoverability

Expose a small set of settings in `package.json` under `contributes.configuration`:

```jsonc
"contributes": {
  "configuration": {
    "type": "object",
    "title": "xTB xcontrol",
    "properties": {
      "xtb.diagnostics.unknownInstructionSeverity": {
        "type": "string",
        "enum": ["error", "warning", "information", "hint", "off"],
        "default": "warning",
        "description": "Severity of diagnostics for unknown instructions."
      },
      "xtb.diagnostics.unknownOptionSeverity": {
        "type": "string",
        "enum": ["error", "warning", "information", "hint", "off"],
        "default": "warning",
        "description": "Severity of diagnostics for unknown options."
      },
      "xtb.diagnostics.optionOperatorSeverity": {
        "type": "string",
        "enum": ["error", "warning", "information", "hint", "off"],
        "default": "information",
        "description": "Severity of diagnostics for suspicious option operators (: vs =)."
      },
      "xtb.diagnostics.duplicateOptionSeverity": {
        "type": "string",
        "enum": ["error", "warning", "information", "hint", "off"],
        "default": "information",
        "description": "Severity of diagnostics for duplicate single-assignment options."
      },
      "xtb.diagnostics.orphanOptionSeverity": {
        "type": "string",
        "enum": ["error", "warning", "information", "hint", "off"],
        "default": "warning",
        "description": "Severity of diagnostics for options outside any instruction block."
      },
      "xtb.diagnostics.missingEndSeverity": {
        "type": "string",
        "enum": ["error", "warning", "information", "hint", "off"],
        "default": "hint",
        "description": "Severity of diagnostics for group instructions without a matching $end."
      }
    }
  }
}
```

This makes diagnostics behavior discoverable via VS Code’s Settings UI.

### 4.4 README UX Notes

In `packages/client/README.md`, include a short “Usage” section for users:

- How to associate file types:
  - `xtb.inp`, `xcontrol`, `.xtbrc` are automatically recognized.
- How to use snippets:
  - “Type `xtb.` and trigger suggestions to see available snippets (e.g. `xtb.fix`, `xtb.constrain`).”
- How to control diagnostics:
  - Mention the `xtb.diagnostics.*` settings and how to change them.

Example snippet from README:

```md
## Snippets

Type `xtb.` in an xcontrol file and accept a suggestion to insert a snippet, for example:

- `xtb.fix` – `$fix` block with `atoms` and `elements` options.
- `xtb.constrain` – `$constrain` block with `atoms`, `distance`, `angle`, and `dihedral` entries.
- `xtb.wall` – `$wall` block with `potential`, `alpha`, `beta`, `temp` and `sphere` options.
- `xtb.chrgspin` – `$chrg` and `$spin` instructions.

You can customize snippet content by editing `snippets/xtb.json` in the extension source.
```

---

## 5. Summary

- `xtb.json` defines a small set of high-value snippets targeting common xcontrol patterns.
- Language configuration adds:
  - `#` as line comments.
  - Simple indentation rules around `$fix` / `$constrain` / `$wall` / `$write` / `$end`.
- Diagnostics are clearly branded (`source: "xtb-xcontrol"`) and configurable via `xtb.diagnostics.*` settings.
- README should briefly explain how to trigger snippets and adjust diagnostics, completing the basic UX story for v0.1.
