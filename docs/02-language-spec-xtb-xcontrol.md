# xTB xcontrol Language Specification (for VS Code Extension)

> Version: 0.1 (draft for implementation)  
> Audience: extension / LSP developers (not end‑users)  

This document describes the subset of xTB “detailed input” (xcontrol) syntax that the VS Code extension must support for **syntax highlighting** and **basic format checking**.  
It is intentionally pragmatic: it focuses on how to parse and understand files well enough for editor tooling, not on reproducing the full, formal xTB grammar.

---

## 1. Conceptual Model

An xcontrol file (also often called `xtb.inp` or `.xtbrc`) is modeled as a sequence of **lines**. Each line may be one of:

- An **instruction line** starting with `$` (e.g. `$fix`, `$constrain`, `$chrg`),
- An **option line** inside an instruction body (e.g. `atoms: 1-10,12` or `potential = polynomial`),
- A **comment line** starting with `#` (possibly preceded by whitespace),
- A **blank** or **other** line (ignored by the extension).

For editor tooling we care primarily about:

- **Instructions**: which ones appear, where their bodies start and end, and whether the names are recognized.
- **Options inside instructions**: option keys, whether they are recognized under the current instruction, and their basic syntactic form (`key=value` vs `key: value`).
- **Comments**: to highlight and to ignore content after `#` on a line.

We **do not** attempt to fully understand values or check physical realism in v0.1.

---

## 2. Lexical Conventions

### 2.1 Lines and End-of-Line

- Input is processed line by line.
- End-of-line can be `\n` or `\r\n`. The parser can treat both as line breaks without distinction.
- There is no line-continuation character in xcontrol syntax in scope for this extension (we treat each physical line as independent).

### 2.2 Whitespace

- Whitespace (`space`, `tab`) may appear:
  - Before an instruction (e.g. `   $fix`),
  - Between tokens (e.g. `atoms : 1-10`),
  - Before `#` comments.
- For our parsing purposes, leading whitespace and spacing around `=` or `:` is ignored when identifying instructions and options.

### 2.3 Case Sensitivity

- **Instruction names** (e.g. `$fix`, `$constrain`, `$wall`, `$chrg`) are **case‑insensitive** for semantic purposes.  
  - In practice, users typically write lowercase; we match instructions using a case-insensitive comparison.
- **Option keys** (e.g. `atoms`, `elements`, `distance`) are also treated as **case‑insensitive**.
- For syntax highlighting:
  - The TextMate grammar will be case-sensitive at the regex level, but we can choose to match both `A-Z` and `a-z` explicitly, or simply highlight any `$[A-Za-z0-9_]+` as an instruction and let the LSP decide semantic validity.

### 2.4 Comments

- A comment starts with `#` and extends to the end of the line.
- `#` may appear after code:

  ```text
  $fix   # fix some atoms
  atoms: 1-10  # frozen atoms
  ```

- For parsing options, any `#` and text after it should be ignored.

### 2.5 Strings and Numbers

The extension does **minimal** understanding of values:

- **Numbers**:  
  - We treat sequences like `-1`, `3.14`, `2.0d+00`, etc. as “number-looking” strings for highlighting.  
  - The parser keeps values as raw strings; diagnostics do not interpret numeric ranges in v0.1.

- **Strings**:  
  - Values may be bare words, quoted strings (`"foo"` or `'bar'`), keywords like `auto`, etc.  
  - For the parser, the entire “value part” of an option is captured as a raw string (after stripping the key, operator, and trailing comment).

The Language Server does not need to parse value internals for v0.1.

---

## 3. Instructions

### 3.1 Instruction Line Detection

A line is considered an **instruction line** if, after trimming leading whitespace, it begins with the `$` character:

```text
$fix
$constrain
$wall
$chrg 0
   $spin 1
```

Formally:

- Let `trimmed` be the line with leading whitespace removed.
- If `trimmed` starts with `$`, it is an **instruction**.
- The instruction name is the token starting at `$` up to the first whitespace or end-of-line.  
  - Example: in `"$constrain  # some comment"`, name is `$constrain`.

### 3.2 Instruction Name and Arguments

- The **instruction name** is the first token starting with `$` (e.g. `$fix`, `$constrain`, `$wall`, `$chrg`, `$spin`, `$cmd`, `$date`, `$end`).
- Any remaining text on the line (before `#`) is treated as **instruction arguments** (a free-form string).  
  - Example: `$chrg 0` has name `$chrg` and argument `0`.  
  - For v0.1, arguments are not interpreted; they may be used in more advanced diagnostics later.

### 3.3 Instruction Kinds

For tooling we categorize instructions into three kinds:

1. **Logical instructions** (single line, no body in our model):  
   - Example: `$chrg`, `$spin`, `$cmd`, `$date`, and possibly others.  
   - Logical instructions may still be followed by arguments (`$chrg 0`), but in our structural model they do not define a multi-line block.

2. **Group instructions** (have an instruction body):  
   - Example: `$fix`, `$constrain`, `$wall`, `$write`, and others where subsequent lines provide options.  
   - Group instructions have:
     - A **header line** (the instruction line with `$name`),
     - A **body region** consisting of subsequent non-instruction lines (options, comments, blanks) until the next instruction line or EOF.
   - Optionally, the body may contain a special `$end` instruction (see below).

3. **Terminator instruction**: `$end`  
   - `$end` is treated as a special instruction that semantically terminates the “current block” in xTB semantics.
   - For our parser, `$end` is a standalone instruction; it is also used in diagnostics to detect whether group instructions were explicitly closed.

The list of which instructions are “group” vs “logical” is defined in the schema (see `xtbSchema` in later docs).

### 3.4 Instruction Bodies and Block Boundaries

For **parsing** we use this pragmatic rule to determine bodies:

- When a **group instruction** appears at line `L`:
  - Its body starts immediately after line `L`.
  - Its body ends right **before** the next instruction line (a line whose trimmed version starts with `$`), or at EOF if no next instruction exists.
- `$end` is treated as a standalone instruction line within the body:
  - It may be used as a “soft terminator” in diagnostics (e.g. we can check if a group instruction has at least one `$end` after it).
  - It does not stop parsing of the current body in the structural model; the body still ends at the next instruction line or EOF.

This simple model is enough to:

- Attach option lines to their parent group instruction,
- Check for options outside any instruction,
- Provide useful diagnostic ranges for instructions and their bodies.

---

## 4. Options Inside Instruction Bodies

### 4.1 Option Line Detection

A line is considered an **option line** if all of the following hold:

1. It is **not** an instruction line (does not start with `$` after trimming leading whitespace).
2. It is **not** a pure comment line (after trimming whitespace, the first non-whitespace character is not `#`).
3. After removing any trailing inline comment, the remaining text contains either `=` or `:` separating a prospective **key** and **value**.

Examples (valid option lines):

```text
atoms: 1-10,12
elements: O
force constant = 0.5
potential = polynomial
sphere: 1.0 0.0 0.0 0.0
```

The parser should:

- Strip trailing comments starting with `#`.
- Treat the first `=` or `:` (whichever comes first) as the **operator**.
- Anything before the operator (trimmed) is the **key**.
- Anything after the operator (trimmed) is the **raw value**.

### 4.2 Key, Operator and Value

Given an option line (with comments removed):

```text
[leading whitespace] key [spaces] OPERATOR [spaces] value
```

- `OPERATOR` is either `=` or `:`.
- `key` is taken as-is (minus surrounding whitespace).  
  - Keys may contain spaces, e.g. `force constant`.
- `value` is the remainder of the line after the operator, with leading/trailing whitespace removed.

Example parsing:

- `atoms: 1-10,12`
  - key: `atoms`
  - operator: `:`
  - value: `1-10,12`

- `force constant = 0.5`
  - key: `force constant`
  - operator: `=`
  - value: `0.5`

### 4.3 Option Kinds (for Schema)

For diagnostics we categorize options, per instruction, in the schema as one of:

- `single` – a **single-assignment** option:
  - At most one occurrence is meaningful (later ones are typically ignored).
  - Example: `potential = polynomial`, `alpha = 1.0`.

- `list` – a **multi-assignment / list** option:
  - May appear multiple times.
  - Often used for atom selections or multiple entities.
  - Example: `atoms: 1-10`, `atoms: 12-15,20`.

The language spec itself does not enforce these semantics; they are enforced by diagnostic rules using the schema.

### 4.4 Orphan Options

An option line is considered an **orphan** if it belongs to no instruction body under our structural model:

- Concretely: if the parser has not seen any instruction yet, or the line lies between instruction bodies because the previous instruction is logical-only and the next is not yet started, etc.

Orphan options are legal xTB syntax in some contexts, but for linting we will issue a warning to help catch common mistakes (e.g. forgetting `$fix` before writing `atoms:`).

---

## 5. Comments and Blank Lines

- A **comment line** is any line where, after trimming whitespace, the first character is `#`.  
  - Comment lines are not part of instruction bodies for the purposes of option parsing (but they do belong within the instruction’s range for outlining purposes).
- Inline comments can occur on instruction or option lines:

  ```text
  $fix            # instruction with comment
  atoms: 1-10     # option with comment
  ```

- **Blank lines** (empty or only whitespace) are allowed anywhere and ignored by the parser for structure. They may still be considered part of an instruction’s “range” for UI features like folding.

---

## 6. Grammar Sketch (Informal BNF)

This is an informal grammar describing how the extension views the file. It is **not** a full formal grammar of xTB, but enough for the parser and diagnostics.

```bnf
file              ::= line* EOF

line              ::= instruction-line
                    | option-line
                    | comment-line
                    | blank-line
                    | other-line

instruction-line  ::= [whitespace] "$" identifier [rest-of-line]
comment-line      ::= [whitespace] "#" [rest-of-line]
blank-line        ::= [whitespace] (EOL | EOF)
option-line       ::= [whitespace] option-key whitespace? option-op whitespace? option-value [whitespace] [comment?]
other-line        ::= any line not matching above categories

option-key        ::= non-empty sequence of non-operator, non-comment characters
option-op         ::= ":" | "="
option-value      ::= any text until "#" or end-of-line

identifier        ::= sequence of letters, digits, underscore (e.g. "fix", "constrain")

rest-of-line      ::= any characters until EOL or EOF
```

Structural model (for parsing bodies):

```bnf
file-structure    ::= instruction-block*

instruction-block ::= instruction
                       option-or-comment-line*

instruction       ::= instruction-line

option-or-comment-line
                   ::= option-line
                    | comment-line
                    | blank-line
```

Where:

- A **group instruction block** is an `instruction-block` whose instruction kind is `group` in the schema.
- A **logical instruction block** is an `instruction-block` whose instruction kind is `logical` (no meaningful body).
- `$end` is a special instruction whose semantic role is “terminator”; it is still represented as a regular instruction in the model.

---

## 7. Common Instruction Examples (Non‑Normative)

The following examples are **illustrative**, not exhaustive.

### 7.1 `$fix`

```text
$fix
  atoms: 1-10,12
  elements: O
$end
```

- Group instruction.
- Typical options:
  - `atoms` (list): atom index ranges.
  - `elements` (list): element symbols.

### 7.2 `$constrain`

```text
$constrain
  atoms: 11
  distance: 1 2 1.5
  angle: 1 2 3 120.0
  dihedral: 1 2 3 4 180.0
$end
```

- Group instruction.
- Typical options:
  - `atoms` (list)
  - `distance` (list)
  - `angle` (list)
  - `dihedral` (list)

### 7.3 `$wall`

```text
$wall
  potential = polynomial
  alpha     = 0.5
  sphere: 10.0 0.0 0.0 0.0
$end
```

- Group instruction.
- Typical options:
  - `potential` (single)
  - `alpha` (single)
  - `beta` (single)
  - `temp` (single)
  - `sphere` (list)
  - `ellipsoid` (list)

### 7.4 Logical Instructions

```text
$chrg 0
$spin 1
$cmd echo "Running xTB"
$date
```

- Logical instructions, modeled as single-line without a body.
- They may appear anywhere in the file.

### 7.5 `$end`

```text
$fix
  atoms: 1-10
  elements: O
$end
$chrg 0
```

- `$end` is treated as a standalone instruction line.
- For diagnostics we may warn if a group instruction has no `$end` within its body.

---

## 8. Error Tolerance & Robustness

The parser and language server should be **tolerant** of imperfect input:

- If an instruction name is unknown:
  - It is still treated as an instruction for structural purposes, but a diagnostic is emitted indicating “unknown instruction name”.
- If an option line has no recognizable operator (`=` or `:`):
  - It is not treated as an option; it may be classified as an “other” line or reported as a formatting issue by diagnostics.
- If keys or values contain strange characters:
  - They are kept as raw strings; diagnostics only check name recognition and basic form, not content validity.

This design ensures the editor remains usable even for advanced users who exploit less common features or for future xTB versions with new options.

---

## 9. Implementation Notes (for LSP & Grammar Authors)

- **TextMate grammar** should focus on:
  - Highlighting instruction names (lines starting with `$`).
  - Highlighting option keys before `:` or `=`.
  - Highlighting numeric-looking sequences and comments.
- **Language Server** should rely on this language spec for:
  - Splitting instructions and bodies.
  - Extracting option key/operator/value triples.
  - Mapping instructions and options to schema entries for diagnostics.

Further details about the schema structure and diagnostic rules are defined in:

- `05-schema-and-parser-spec.md`
- `06-diagnostics-rules.md`
