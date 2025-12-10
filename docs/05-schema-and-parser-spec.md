# xTB xcontrol Schema and Parser Specification

> File: `docs/05-schema-and-parser-spec.md`  
> Version: 0.1 (draft for implementation)  
> Audience: Language Server / shared library developers  

This document defines:

1. The **shared data model** (TypeScript types) representing xTB xcontrol documents.
2. The **schema format** used to describe valid instructions and options.
3. The design of the **lexer / parser** that converts plain text into a structured `ParsedDocument` suitable for diagnostics.

It builds on the language description in `02-language-spec-xtb-xcontrol.md` and the architecture in `03-architecture-and-repo-structure.md`.

---

## 1. Goals and Non-goals

### 1.1 Goals

- Provide a **simple, robust** representation of xcontrol files for tooling:
  - Identify instructions (`$fix`, `$constrain`, `$wall`, `$chrg`, `$spin`, `$cmd`, `$date`, `$end`, etc.).
  - Attach option lines (`key: value` or `key = value`) to their parent instruction.
  - Preserve line numbers and basic structural information for diagnostics.
- Use a **schema-driven** approach to:
  - Decide which instruction names are known.
  - Classify instructions as `logical`, `group`, or `end`.
  - Classify options as `single` or `list` for each instruction.

### 1.2 Non-goals (v0.1)

- Fully validating option values (numeric ranges, units, physical semantics).
- Understanding all possible xTB instructions/options in all modes.
- Implementing a full-blown formal grammar / AST; we use a lightweight model geared to linting.

The design should be easy to extend when we want more instructions, options, or deeper checks.

---

## 2. Shared Types (`packages/shared/src/types.ts`)

All core types are defined in `packages/shared/src/types.ts` (or equivalent) and re-exported from the package entry point.

### 2.1 Basic Enums / Type Aliases

```ts
/** Classification of an instruction line. */
export type InstructionKind = "logical" | "group" | "end";

/** Classification of how an option behaves semantically. */
export type OptionKind = "single" | "list";

/** Operator used in options. */
export type OptionOperator = "=" | ":";
```

### 2.2 Position and Range Types

The Language Server uses zero-based line and character indices. For our internal model, we track at least line numbers (zero-based). Character offsets are optional but can be added later if needed.

```ts
export interface Position {
  /** Zero-based line index. */
  line: number;
  /** Zero-based character index within the line. */
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}
```

For v0.1, it is acceptable to approximate `character` indices (e.g. computed from `lineText.indexOf(...)`).

### 2.3 Option Node

An **option** represents a single `key OPERATOR value` line associated with an instruction.

```ts
export interface OptionNode {
  /** Option key, trimmed and normalized (case-insensitive in schema). */
  key: string;

  /** Operator used: "=" or ":". */
  operator: OptionOperator;

  /** Raw value string (with trailing comments removed, leading/trailing spaces trimmed). */
  value: string;

  /** 0-based line index of this option. */
  line: number;

  /** Range of the key part (for diagnostics). */
  keyRange?: Range;

  /** Range of the operator (for diagnostics). */
  operatorRange?: Range;

  /** Range of the value (for diagnostics). */
  valueRange?: Range;
}
```

Notes:

- Ranges are optional; v0.1 diagnostics can rely only on line-level locations if needed.
- Keys are compared against the schema in a case-insensitive manner; we may store them in lowercase.

### 2.4 Instruction Node

An **instruction** represents a single line starting with `$` and its attached options (if any).

```ts
export interface InstructionNode {
  /** Instruction name including the "$" prefix, e.g. "$fix", "$constrain". */
  name: string;

  /** The normalized base name, e.g. "fix", "constrain". */
  baseName: string;

  /** Kind of instruction according to schema. */
  kind: InstructionKind;

  /** 0-based line index of the instruction line. */
  line: number;

  /** Range of the instruction line or name (optional but useful). */
  range?: Range;

  /**
   * 0-based index of the last line considered part of this instruction's "body"
   * (inclusive). For logical instructions this may equal `line`.
   */
  bodyEndLine: number;

  /** Options belonging to this instruction, in source order. */
  options: OptionNode[];
}
```

Notes:

- `baseName` is derived from `name` by stripping the leading `$` and normalizing to lowercase.
- `kind` is determined from the schema; unknown instructions may be given a default kind (e.g. `logical`) and marked separately in diagnostics.

### 2.5 Parsed Document

A **parsed document** contains all instructions found in the file, plus any additional info needed for diagnostics.

```ts
export interface ParsedDocument {
  /** All instructions discovered in the document, in source order. */
  instructions: InstructionNode[];

  /**
   * Lines that looked like options (key/value) but were not associated with any instruction.
   * These can be used for "orphan option" diagnostics.
   */
  orphanOptions: OptionNode[];

  /**
   * Original document text, optionally split into lines.
   * This can be omitted if not needed, but is convenient for some rules.
   */
  text: string;
  lines: string[];
}
```

The parser is responsible for building `ParsedDocument` from raw text.

---

## 3. Schema Structure (`packages/shared/src/xtbSchema.ts`)

The **schema** describes which instructions and options we know about and how they behave.

### 3.1 Option Specification

Each option is described with:

- Its `kind` (`single` vs `list`).
- Optional `valueType` (a hint, not enforced in v0.1).
- Optional `allowedValues` (for enum-like options).

```ts
export type OptionValueType = "string" | "number" | "boolean" | "enum" | "any";

export interface XtbOptionSpec {
  /** Option kind: single assignment or multi-assignment (list). */
  kind: OptionKind;

  /** Optional type hint for future validation (not enforced in v0.1). */
  valueType?: OptionValueType;

  /** If valueType === "enum", the list of allowed string values. */
  allowedValues?: string[];
}
```

### 3.2 Instruction Specification

Each instruction is described with:

- Its `kind` (`logical`, `group`, `end`).
- The set of allowed options (by key).

```ts
export interface XtbInstructionSpec {
  /** Kind of instruction. */
  kind: InstructionKind;

  /**
   * Map from normalized option key (lowercase) to its spec.
   * Only relevant for group instructions.
   */
  options?: Record<string, XtbOptionSpec>;
}
```

`options` can be omitted for logical instructions like `$chrg` that do not have a body in our model.

### 3.3 Schema Root

The root schema is a map from normalized instruction base name to its spec. Instruction names always include `$` at the text level, but in the schema we use the base name.

```ts
export interface XtbSchema {
  /** Map from normalized instruction base name (e.g. "fix") to spec. */
  instructions: Record<string, XtbInstructionSpec>;
}
```

### 3.4 Example Initial Schema (v0.1)

The initial schema does not need to be exhaustive. It should cover the most common instructions; more can be added incrementally.

```ts
export const xtbSchema: XtbSchema = {
  instructions: {
    // $fix block
    fix: {
      kind: "group",
      options: {
        atoms:   { kind: "list", valueType: "any" },
        elements:{ kind: "list", valueType: "any" }
      }
    },

    // $constrain block
    constrain: {
      kind: "group",
      options: {
        atoms:    { kind: "list", valueType: "any" },
        distance: { kind: "list", valueType: "any" },
        angle:    { kind: "list", valueType: "any" },
        dihedral: { kind: "list", valueType: "any" }
      }
    },

    // $wall block
    wall: {
      kind: "group",
      options: {
        potential: { kind: "single", valueType: "enum", allowedValues: ["polynomial", "logfermi"] },
        alpha:     { kind: "single", valueType: "number" },
        beta:      { kind: "single", valueType: "number" },
        temp:      { kind: "single", valueType: "number" },
        sphere:    { kind: "list",   valueType: "any" },
        ellipsoid: { kind: "list",   valueType: "any" }
      }
    },

    // $write block (example)
    write: {
      kind: "group",
      options: {
        // options can be refined as needed
      }
    },

    // logical instructions (single-line)
    chrg: {
      kind: "logical"
    },
    spin: {
      kind: "logical"
    },
    cmd: {
      kind: "logical"
    },
    date: {
      kind: "logical"
    },

    // terminator
    end: {
      kind: "end"
    }
  }
};
```

Notes:

- All keys in `instructions` and `options` should be in **lowercase** to simplify case-insensitive matching.
- When parsing, `baseName` and `key` should be normalized to lowercase before lookup.

---

## 4. Lexer Design (`packages/server/src/parser/xtbLexer.ts`)

The lexer operates on raw text and emits a **per-line classification**. Parsing can be done either directly on raw text or via this lexer. Using a lexer improves clarity and testing.

### 4.1 Token Kinds

Define the following token kinds:

```ts
export type LineTokenKind =
  | "instruction"  // starts with "$"
  | "option"       // key OP value
  | "comment"      // full-line comment
  | "blank"        // empty or whitespace-only line
  | "other";       // anything else

export interface LineTokenBase {
  kind: LineTokenKind;
  line: number;   // 0-based
  text: string;   // full original line
}
```

Specialized token interfaces:

```ts
export interface InstructionLineToken extends LineTokenBase {
  kind: "instruction";
  /** Full instruction name with "$", e.g. "$fix". */
  name: string;
  /** Base name (without "$", normalized lower case). */
  baseName: string;
  /** Range for the instruction name (optional). */
  nameRange?: Range;
}

export interface OptionLineToken extends LineTokenBase {
  kind: "option";
  key: string;
  operator: OptionOperator;
  value: string;
  keyRange?: Range;
  operatorRange?: Range;
  valueRange?: Range;
}

export interface CommentLineToken extends LineTokenBase {
  kind: "comment";
}

export interface BlankLineToken extends LineTokenBase {
  kind: "blank";
}

export interface OtherLineToken extends LineTokenBase {
  kind: "other";
}

export type LineToken =
  | InstructionLineToken
  | OptionLineToken
  | CommentLineToken
  | BlankLineToken
  | OtherLineToken;
```

### 4.2 Lexing Algorithm

Given the document text:

1. Split into lines: `const lines = text.split(/\r?\n/);`
2. For each line `i` (0-based):
   - If line is empty or only whitespace → `blank` token.
   - Else trim leading whitespace for classification, but keep original line for ranges.

#### 4.2.1 Comments

- If the first non-whitespace character is `#`, classify as `comment`:

```ts
const trimmed = line.trimStart();
if (trimmed.startsWith("#")) {
  // CommentLineToken
}
```

#### 4.2.2 Instructions

- If (after trimming leading whitespace) line starts with `$`, treat as instruction:

```ts
if (trimmed.startsWith("$")) {
  // Extract name up to first whitespace or end-of-line
  // e.g. "$fix", "$constrain", "$wall"
}
```

Detailed steps:

- `const nameMatch = trimmed.match(/^(\$[A-Za-z0-9_]+)/);`
- If match present:
  - `name = nameMatch[1];`
  - `baseName = name.slice(1).toLowerCase();`
  - Determine `nameRange`:
    - `start.character` = index of `$` in original line.
    - `end.character` = `start.character + name.length`.

#### 4.2.3 Option Lines

If not instruction/comment/blank, attempt to parse as **option**:

- First, strip inline comment:

```ts
const commentIndex = line.indexOf("#");
const codePart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
```

- If `codePart` contains neither `=` nor `:`, fall through to `other`.
- Otherwise, find the **first occurrence** of either `=` or `:` as the operator boundary.

Pseudo:

```ts
const eqIndex = codePart.indexOf("=");
const colonIndex = codePart.indexOf(":");

let opIndex = -1;
let op: OptionOperator | null = null;

if (eqIndex === -1 && colonIndex === -1) {
  // not an option
} else if (eqIndex === -1 || (colonIndex !== -1 && colonIndex < eqIndex)) {
  opIndex = colonIndex;
  op = ":";
} else {
  opIndex = eqIndex;
  op = "=";
}

if (op !== null) {
  const keyPart = codePart.slice(0, opIndex);
  const valuePart = codePart.slice(opIndex + 1);

  const key = keyPart.trim();
  const value = valuePart.trim();

  if (key.length > 0) {
    // OptionLineToken
  } else {
    // No key: classify as "other" or leave for diagnostics
  }
}
```

Range computation:

- `keyRange.start.character` = index of first non-whitespace in `keyPart` (relative to original line).  
- `keyRange.end.character` = `keyRange.start.character + key.length`.
- `operatorRange` is at `opIndex`.  
- `valueRange` starts after the operator and runs to the last non-whitespace character in `codePart`.

#### 4.2.4 Other Lines

Any remaining line is classified as `other` (could be free text or something not currently understood).

### 4.3 Lexer Output

The primary lexer function signature:

```ts
export interface LexResult {
  text: string;
  lines: string[];
  tokens: LineToken[];
}

export function lexXtbDocument(text: string): LexResult {
  // Implemented as described above
}
```

---

## 5. Parser Design (`packages/server/src/parser/xtbParser.ts`)

The parser consumes the `LexResult` and produces `ParsedDocument`:

```ts
import { ParsedDocument, InstructionNode, OptionNode } from "@xtb-xcontrol/shared";
import { lexXtbDocument } from "./xtbLexer";
import { xtbSchema } from "@xtb-xcontrol/shared";

export function parseXtbDocument(text: string): ParsedDocument {
  const lexResult = lexXtbDocument(text);
  // ... build ParsedDocument
}
```

### 5.1 Core Parsing Ideas

- The parser iterates **line tokens in order**.
- Instructions are collected into `InstructionNode[]`.
- For each group instruction, subsequent option tokens are attached until the next instruction token or EOF.
- Option tokens that are not inside any group instruction become **orphanOptions**.

### 5.2 Determining Instruction Kind

Given an `InstructionLineToken` with `baseName` (normalized to lowercase):

```ts
function getInstructionKind(baseName: string): InstructionKind {
  const spec = xtbSchema.instructions[baseName];
  if (!spec) {
    // Unknown instruction – we treat it as logical by default for structure.
    return "logical";
  }
  return spec.kind;
}
```

The parser sets `instruction.kind` accordingly. Unknown instructions can later be flagged by diagnostics via a separate rule.

### 5.3 Parsing Algorithm – High Level

1. Call `lexXtbDocument(text)` to get `tokens` and `lines`.
2. Maintain:
   - `const instructions: InstructionNode[] = [];`
   - `const orphanOptions: OptionNode[] = [];`
   - `let currentInstruction: InstructionNode | undefined = undefined;`

3. Iterate over `tokens` in source order:

   - If token.kind is `"instruction"`:
     - Finalize previous `currentInstruction`:
       - Set `bodyEndLine` to the last line index that belonged to it (see below).
       - Push it into `instructions`.
     - Create a new `InstructionNode`:
       - Determine `kind` via schema.
       - Initialize `options` as empty array.
       - Set `line` and `range` from token information.
       - Set `bodyEndLine` initially to `line` (to be updated).
     - Set `currentInstruction` to the new node.

   - If token.kind is `"option"`:
     - Create an `OptionNode` from token.
     - If `currentInstruction` exists **and** `currentInstruction.kind === "group"`:
       - Push option into `currentInstruction.options`.
       - Update `currentInstruction.bodyEndLine` to at least `token.line`.
     - Else:
       - Push option into `orphanOptions`.

   - If token.kind is `"comment"` or `"blank"` or `"other"`:
     - If `currentInstruction` is a group instruction and we want the body range to include such lines (for outline / folding), update `bodyEndLine` accordingly.
     - Otherwise, ignore for structural purposes.

4. After the loop:
   - If `currentInstruction` exists, finalize and push it into `instructions`.

5. Return:

```ts
return {
  instructions,
  orphanOptions,
  text,
  lines: lexResult.lines
};
```

### 5.4 Body Line Ranges

For **group instructions**:

- `line` is the instruction line index.
- `bodyEndLine` is the maximum of:
  - The last option token associated with this instruction.
  - Any trailing comment/blank/other lines we decide to include in its body.

For **logical instructions**:

- We can set `bodyEndLine = line` (no body).

For `$end`:

- It is an instruction of kind `"end"`. We **do not** automatically attach options to it.
- It may show up in `instructions` and can be used by diagnostics to decide whether a group instruction has an `$end` somewhere after it (if we decide to implement such logic).

### 5.5 Example Walkthrough

Given the following xcontrol snippet:

```text
$fix
  atoms: 1-10,12
  elements: O
$end
$chrg 0
atoms: 20
```

Token sequence (informal):

- line 0: `instruction` name=`$fix`
- line 1: `option` key=`atoms` ...
- line 2: `option` key=`elements` ...
- line 3: `instruction` name=`$end`
- line 4: `instruction` name=`$chrg`
- line 5: `option` key=`atoms` ...

Parser behavior:

- `currentInstruction = $fix` (kind `group`)
  - line 1 & 2 options attached to `$fix`
  - `bodyEndLine` updated to 2
- At line 3: instruction `$end`
  - Finalize `$fix` with `bodyEndLine = 2` and push to `instructions`
  - `currentInstruction` becomes `$end` (kind `end`)
- At line 4: instruction `$chrg` (logical)
  - Finalize `$end` (no options)
  - `currentInstruction = $chrg`
- At line 5: option `atoms: 20`
  - `currentInstruction.kind === "logical"`, so option is not attached to `$chrg`
  - Option is recorded in `orphanOptions`

Diagnostics can later decide:

- `$fix` is valid, has options, and optionally check for `$end` presence.
- `$chrg` is fine.
- `atoms: 20` is likely an orphan option and should trigger a warning.

---

## 6. Normalization and Case Handling

To keep comparison simple and robust:

- **Instruction base names** (`baseName`) should always be stored in lowercase.
- **Option keys** should also be normalized to lowercase for schema lookup.
- The original spelling (as in the source) is preserved in `name` and `OptionNode.key` for display / diagnostics messages.

Utility functions (can live in `shared` or `parser` module):

```ts
export function normalizeInstructionName(name: string): string {
  // "$Fix" -> "fix"
  return name.replace(/^\$/, "").toLowerCase();
}

export function normalizeOptionKey(key: string): string {
  return key.trim().toLowerCase();
}
```

Diagnostics should use normalized forms for matching, but surface the original text in messages.

---

## 7. Error Tolerance and Edge Cases

The parser should be **resilient** to malformed input:

- Unknown instructions (`$foo`):
  - Still create `InstructionNode` with `kind = "logical"` by default.
  - Record them in `instructions`. Diagnostics can handle “unknown instruction” reporting.

- Incomplete options (no key, or no operator):
  - If `key` is empty after trimming → classify line as `other` in the lexer.
  - Diagnostics may later detect suspicious lines if desired.

- Lines with both `=` and `:`:
  - The lexer uses the **first** occurrence of either as the operator. This is usually good enough.

- Lines with only a key and a colon or equal and no value:
  - `value` will be the empty string. Diagnostics may warn but parser should not fail.

The guiding principle is: **never throw** on malformed input; always produce a `ParsedDocument` that covers as much as possible.

---

## 8. Testing Strategy

Unit tests should be created for both the lexer and the parser.

### 8.1 Lexer Tests (`xtbLexer.test.ts`)

- Simple cases:
  - Instruction line only.
  - Option line with `:` and `=`.
  - Full-line comments and inline comments.
  - Blank lines.
- Edge cases:
  - Lines with both `:` and `=`.
  - Lines with no key (e.g. `: value` or `= value`).
  - Lines starting with whitespace before `$` or `#`.

Assertions:

- Correct token kind per line.
- Correct extraction of `name`, `baseName`, `key`, `operator`, `value`.
- Ranges roughly align with the source.

### 8.2 Parser Tests (`xtbParser.test.ts`)

- Files with multiple group and logical instructions.
- Files with orphan options.
- Files with unknown instructions.
- Files with `$end` and without `$end`.

Assertions:

- Correct number and order of `InstructionNode`s.
- Correct association of `OptionNode`s to instructions.
- `bodyEndLine` behavior for group vs logical instructions.
- Population of `orphanOptions` as expected.

These tests form the foundation for later diagnostics tests (which will import `ParsedDocument` and apply rules).

---

## 9. Summary

- `types.ts` defines a small, clear set of types (`InstructionNode`, `OptionNode`, `ParsedDocument`).
- `xtbSchema.ts` provides a schema-driven way to describe instructions and options.
- `xtbLexer.ts` classifies each line into instruction / option / comment / blank / other tokens.
- `xtbParser.ts` builds a `ParsedDocument` by grouping options under instructions and tracking orphan options.

With this in place, diagnostics logic (defined in `06-diagnostics-rules.md`) can be implemented cleanly on top of the parsed structure, without worrying about raw text parsing details.
