# Diagnostics Rules Specification

> File: `docs/06-diagnostics-rules.md`  
> Version: 0.1 (draft for implementation)  
> Audience: Language Server developers  

This document specifies the **diagnostic rules** (lint checks) that the Language Server will implement for xTB xcontrol files.

Diagnostics consume the `ParsedDocument` produced by the parser described in `05-schema-and-parser-spec.md` and the schema defined in `xtbSchema.ts`.

The focus of v0.1 is on **structural and naming issues**, not deep semantic or numerical checks.

---

## 1. Design Principles

- **Non-intrusive**: diagnostics should catch clear mistakes or highly suspicious patterns, but avoid over-reporting in ambiguous cases.
- **Schema-driven**: rules use the instruction and option schema (`xtbSchema`) for name validation and behavior classification.
- **Configurable severity**: each rule has a default severity but can be adjusted by the user via VS Code settings.
- **Stable codes**: each rule has a stable `code` string for identification and filtering.

Diagnostics are emitted using the LSP `Diagnostic` type (via `vscode-languageserver`).

---

## 2. Diagnostic Rule Overview

For v0.1, we define the following rules:

1. **R1 – Unknown Instruction**  
   Instruction name is not recognized by the schema.

2. **R2 – Unknown Option Key**  
   Option key is not recognized for the current instruction.

3. **R3 – Suspicious Option Operator**  
   Option uses `:` where `=` is expected (or vice versa) according to the schema.

4. **R4 – Duplicate Single-assignment Option**  
   Option marked as `single` appears multiple times within the same instruction.

5. **R5 – Orphan Option**  
   Option appears outside any group instruction.

6. **R6 – Group Instruction Without `$end` (Soft Hint)**  
   Group instruction has no `$end` terminator anywhere after it (soft warning / hint).

Additional rules can be added later in a backward-compatible way.

---

## 3. Configuration and Severity Mapping

### 3.1 VS Code Settings

The extension exposes configuration keys under a namespace, for example: `xtb.diagnostics.*`.

Suggested configuration keys:

- `xtb.diagnostics.unknownInstructionSeverity`
- `xtb.diagnostics.unknownOptionSeverity`
- `xtb.diagnostics.optionOperatorSeverity`
- `xtb.diagnostics.duplicateOptionSeverity`
- `xtb.diagnostics.orphanOptionSeverity`
- `xtb.diagnostics.missingEndSeverity`

Allowed values (string):

- `"error"`
- `"warning"`
- `"information"`
- `"hint"`
- `"off"` (disable the rule)

### 3.2 LSP DiagnosticSeverity Mapping

Internal helper function to map user configuration to `DiagnosticSeverity`:

```ts
import { DiagnosticSeverity } from "vscode-languageserver";

export type SeveritySetting = "error" | "warning" | "information" | "hint" | "off";

export function severityToLsp(sev: SeveritySetting | undefined): DiagnosticSeverity | undefined {
  switch (sev) {
    case "error": return DiagnosticSeverity.Error;
    case "warning": return DiagnosticSeverity.Warning;
    case "information": return DiagnosticSeverity.Information;
    case "hint": return DiagnosticSeverity.Hint;
    case "off": return undefined;
    default: return DiagnosticSeverity.Warning; // default fallback
  }
}
```

If the mapped value is `undefined`, the rule is effectively disabled.

### 3.3 Default Severities (v0.1)

Reasonable defaults:

- `unknownInstructionSeverity`: `"warning"`
- `unknownOptionSeverity`: `"warning"`
- `optionOperatorSeverity`: `"information"`
- `duplicateOptionSeverity`: `"information"`
- `orphanOptionSeverity`: `"warning"`
- `missingEndSeverity`: `"hint"`

These defaults can be refined based on user feedback.

---

## 4. Diagnostic Rule Definitions

Each rule below is described by:

- **Code**: unique string identifier.
- **Trigger**: condition on `ParsedDocument` / `InstructionNode` / `OptionNode`.
- **Location**: where the diagnostic is placed (range).
- **Message**: example message format.
- **Severity**: default, configurable via settings.

The main entry point for applying rules is a function:

```ts
import { ParsedDocument } from "@xtb-xcontrol/shared";
import { Diagnostic } from "vscode-languageserver";

export interface DiagnosticConfig {
  unknownInstructionSeverity: SeveritySetting;
  unknownOptionSeverity: SeveritySetting;
  optionOperatorSeverity: SeveritySetting;
  duplicateOptionSeverity: SeveritySetting;
  orphanOptionSeverity: SeveritySetting;
  missingEndSeverity: SeveritySetting;
}

export function computeDiagnostics(doc: ParsedDocument, config: DiagnosticConfig): Diagnostic[] {
  // Applies R1–R6 and returns a flat list of diagnostics.
}
```

### 4.1 R1 – Unknown Instruction

**Code**: `xtb.unknownInstruction`

**Trigger**:

- For each `instruction` in `doc.instructions`:
  - Let `spec = xtbSchema.instructions[instruction.baseName]`.
  - If `!spec` (no schema entry), the instruction is considered unknown.

**Location**:

- Prefer `instruction.range` if available.
- Else create a range covering the instruction line from character 0 to the length of the line.
- If `nameRange` (from lexer) is available, use that for a precise highlight.

**Message (example)**:

- `"Unknown xTB instruction '$foo'."`

**Severity**:

- Default: `"warning"` (mapped to `DiagnosticSeverity.Warning`).
- Controlled by `config.unknownInstructionSeverity`.

**Notes**:

- Unknown instructions are still allowed structurally; this rule serves as a hint that the user may have a typo or is using an instruction not yet supported by the schema.
- Do not suppress the rule for `$end`; ensure `$end` has an explicit schema entry if needed.

---

### 4.2 R2 – Unknown Option Key

**Code**: `xtb.unknownOption`

**Trigger**:

- For each `instruction` in `doc.instructions`:
  - Determine `spec = xtbSchema.instructions[instruction.baseName]`.
  - If !spec → skip (R1 already reports unknown instruction; we avoid cascading errors).
  - For each `option` in `instruction.options`:
    - Let `normalizedKey = normalizeOptionKey(option.key)`.
    - Let `optionSpec = spec.options?.[normalizedKey]`.
    - If `!optionSpec`, then the option key is unknown for this instruction.

**Location**:

- If `option.keyRange` is set, use it.
- Else create a range covering the entire option line.

**Message (example)**:

- `"Unknown option key 'atomsx' for instruction '$fix'."`

**Severity**:

- Default: `"warning"`.
- Controlled by `config.unknownOptionSeverity`.

**Notes**:

- This rule is instruction-specific: an option key may be valid under one instruction and invalid under another.

---

### 4.3 R3 – Suspicious Option Operator

**Code**: `xtb.optionOperator`

**Trigger**:

- For each `instruction` with a known schema (`spec`):
  - For each `option` in `instruction.options` with a known `optionSpec` (from R2 logic):
    - Some options are conceptually “assignment-like” and are expected to use either `=` or `:` predominately.
    - For v0.1, we use a **simple heuristic**:
      - If `optionSpec.kind === "single"` → expect `=`.
      - If `optionSpec.kind === "list"` → expect `:`.
    - If the actual `option.operator` does not match the expected operator, flag it as suspicious.

**Location**:

- Prefer `option.operatorRange`.
- Else use a small range around the operator character (e.g. column index of `:` or `=`).

**Message (example)**:

- For `single` options using `:` instead of `=`:  
  `"Option 'potential' is usually written with '=' (e.g. 'potential = polynomial')."`

- For `list` options using `=` instead of `:`:  
  `"Option 'atoms' is usually written with ':' (e.g. 'atoms: 1-10')."`

**Severity**:

- Default: `"information"`.
- Controlled by `config.optionOperatorSeverity`.

**Notes**:

- This rule is intentionally soft; user might have valid reasons to deviate in rare cases.
- Use schema hints only; if there is no `optionSpec`, R2 may already warn, and R3 should skip.

---

### 4.4 R4 – Duplicate Single-assignment Option

**Code**: `xtb.duplicateOption`

**Trigger**:

- For each `instruction` with a known schema:
  - For each `option` with known `optionSpec` and `optionSpec.kind === "single"`:
    - Track occurrences per `normalizedKey`.
    - If a given `normalizedKey` appears more than once in `instruction.options`, mark all additional occurrences (beyond the first) as duplicates.

Pseudo:

```ts
for (const instruction of doc.instructions) {
  const spec = schema.instructions[instruction.baseName];
  if (!spec || !spec.options) continue;

  const seen: Record<string, OptionNode | undefined> = {};
  for (const opt of instruction.options) {
    const key = normalizeOptionKey(opt.key);
    const optionSpec = spec.options[key];
    if (!optionSpec || optionSpec.kind !== "single") continue;

    if (!seen[key]) {
      seen[key] = opt; // first occurrence
    } else {
      // duplicate occurrence: trigger diagnostic on this opt
    }
  }
}
```

**Location**:

- Prefer `option.keyRange` of the **duplicate** options.
- If missing, use the full option line.

**Message (example)**:

- `"Option 'potential' is specified multiple times; only the first value is typically used."`

**Severity**:

- Default: `"information"`.
- Controlled by `config.duplicateOptionSeverity`.

**Notes**:

- Do not flag the first occurrence; only subsequent ones.
- This rule is meant to catch likely mistakes such as copy-paste duplication.

---

### 4.5 R5 – Orphan Option

**Code**: `xtb.orphanOption`

**Trigger**:

- For each `option` in `doc.orphanOptions`:
  - The option has no parent instruction (per parser grouping).

These usually arise when:

- User forgot to add a `$fix` / `$constrain` / `$wall` line above.
- User mis-indented or mis-structured the file.

**Location**:

- Prefer `option.keyRange`.
- Else highlight the full option line.

**Message (example)**:

- `"Option 'atoms' is not inside any instruction block. Did you forget a '$fix' or '$constrain'?"`

**Severity**:

- Default: `"warning"`.
- Controlled by `config.orphanOptionSeverity`.

**Notes**:

- This rule operates solely on `orphanOptions` compiled by the parser, without schema lookup.
- Optionally, we can attempt to guess likely intended instruction (e.g. `atoms` suggests `$fix` / `$constrain`), but v0.1 message can stay generic.

---

### 4.6 R6 – Group Instruction Without `$end` (Soft Hint)

**Code**: `xtb.missingEnd`

**Trigger**:

- For each group instruction `I` (`spec.kind === "group"`) in `doc.instructions`:
  - Inspect the sequence of instructions **after** `I` in `doc.instructions`.
  - If any subsequent instruction has `baseName === "end"` → consider `$end` present and skip.
  - If **no** such `$end` exists anywhere after `I`, emit a hint.

Pseudo:

```ts
const instructions = doc.instructions;

for (let i = 0; i < instructions.length; i++) {
  const instr = instructions[i];
  const spec = schema.instructions[instr.baseName];
  if (!spec || spec.kind !== "group") continue;

  let hasEnd = false;
  for (let j = i + 1; j < instructions.length; j++) {
    const next = instructions[j];
    if (next.baseName === "end") {
      hasEnd = true;
      break;
    }
  }

  if (!hasEnd) {
    // emit hint on instr
  }
}
```

**Location**:

- Highlight the instruction name (`instruction.range` or `nameRange`).

**Message (example)**:

- `"Group instruction '$fix' has no '$end' terminator in this file. Consider adding '$end' for clarity."`

**Severity**:

- Default: `"hint"`.
- Controlled by `config.missingEndSeverity`.

**Notes**:

- This is a **soft** rule because xcontrol semantics do not strictly require `$end` for all setups.
- We deliberately do not attempt to track nested `$end` / block depths; this is a simple global presence check.

---

## 5. Implementation Skeleton

In `packages/server/src/diagnostics/rules.ts` we can structure the rules as separate functions for clarity.

```ts
import {
  Diagnostic,
  DiagnosticSeverity,
  Range
} from "vscode-languageserver";

import { ParsedDocument, InstructionNode, OptionNode } from "@xtb-xcontrol/shared";
import { xtbSchema } from "@xtb-xcontrol/shared";
import { severityToLsp, DiagnosticConfig } from "./config"; // config helpers

export function computeDiagnostics(doc: ParsedDocument, config: DiagnosticConfig): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  diagnostics.push(
    ...ruleUnknownInstructions(doc, config),
    ...ruleUnknownOptions(doc, config),
    ...ruleOptionOperator(doc, config),
    ...ruleDuplicateOptions(doc, config),
    ...ruleOrphanOptions(doc, config),
    ...ruleMissingEnd(doc, config)
  );

  return diagnostics;
}
```

Each rule function returns an array of `Diagnostic` objects and is responsible for:

- Checking configuration severity.
- Creating diagnostics with correct `range`, `message`, `code`, and `severity`.

Example for R1 (simplified):

```ts
function ruleUnknownInstructions(doc: ParsedDocument, config: DiagnosticConfig): Diagnostic[] {
  const severity = severityToLsp(config.unknownInstructionSeverity);
  if (!severity) return [];

  const diags: Diagnostic[] = [];

  for (const instr of doc.instructions) {
    const spec = xtbSchema.instructions[instr.baseName];
    if (spec) continue;

    const range = instr.range ?? {
      start: { line: instr.line, character: 0 },
      end: { line: instr.line, character: 1000 } // approximate
    };

    diags.push({
      range,
      severity,
      source: "xtb-xcontrol",
      code: "xtb.unknownInstruction",
      message: `Unknown xTB instruction '${instr.name}'.`
    });
  }

  return diags;
}
```

Other rules follow the same pattern.

---

## 6. Testing Diagnostics

Diagnostics should be tested with **fixture inputs** and expected outputs.

### 6.1 Test Harness

- For each test fixture (small xcontrol snippet):
  - Call `parseXtbDocument(text)` → `doc`.
  - Call `computeDiagnostics(doc, testConfig)` with a known config (e.g. all severities set to `"warning"`).
  - Assert:
    - The number of diagnostics.
    - The `code` values.
    - Optionally, parts of `message` and `range` line numbers.

### 6.2 Example Cases

- **Unknown instruction**:
  - Input: `$fxx
`
  - Expect: one `xtb.unknownInstruction` diagnostic on line 0.

- **Unknown option key**:
  - Input: `$fix
  atomz: 1-10
`
  - Expect: one `xtb.unknownOption` diagnostic on `atomz` line.

- **Suspicious operator**:
  - Input: `$fix
  atoms = 1-10
`
  - Expect: one `xtb.optionOperator` diagnostic on the `=` operator.

- **Duplicate single option**:
  - Input: `$wall
  potential = polynomial
  potential = logfermi
`
  - Expect: one `xtb.duplicateOption` on the second `potential`.

- **Orphan option**:
  - Input: `atoms: 1-10
`
  - Expect: one `xtb.orphanOption` on that line.

- **Missing $end**:
  - Input: `$fix
  atoms: 1-10
`
  - Expect: one `xtb.missingEnd` hint on `$fix`.

These tests confirm that the rule implementations match this specification.

---

## 7. Summary

- Diagnostics are **schema-aware**, but intentionally shallow for v0.1.
- Configuration keys allow users to tune severity or disable rules entirely.
- Rules R1–R6 together catch many common mistakes when editing xcontrol files, without overcomplicating the implementation.
- The design is extensible: new rules (e.g. value count checks for `distance`, `angle`, etc.) can be added in future versions without breaking existing clients.
