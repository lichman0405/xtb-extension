# Roadmap and Future Work

> File: `docs/08-roadmap-and-future-work.md`  
> Version: 0.1 (draft roadmap)  
> Audience: project maintainer(s), contributors, agentic coders  

This document describes a **proposed roadmap** for the xTB xcontrol VS Code extension beyond v0.1.

It is intentionally pragmatic and modular: each stage can be tackled independently (by you or by agentic coders) without blocking the rest of the project.

---

## 1. Current Baseline (v0.1)

Target state for **v0.1** (as defined in previous specs):

- Syntax highlighting:
  - TextMate grammar for xcontrol files (`xtb.tmLanguage.json`).
- Language Server (LSP):
  - Line-based lexer and simple parser that build a `ParsedDocument`.
  - Schema-driven diagnostics:
    - Unknown instructions / option keys.
    - Suspicious option operators (`:` vs `=`).
    - Duplicate single-assignment options.
    - Orphan options.
    - Group instructions without `$end` (hint).
- Snippets and UX:
  - A small set of useful `$fix`, `$constrain`, `$wall`, `$write`, `$chrg/$spin`, `$cmd`, and template snippets.
  - Language configuration (comments, basic indentation).
  - Configurable diagnostic severities.

Everything else in this document is **future work**.

---

## 2. Roadmap Overview

Proposed roadmap by version “levels” (subject to change):

- **v0.2 – Schema Expansion & Auto-generation**
- **v0.3 – Richer Diagnostics & Semantic Validation**
- **v0.4 – Language Intelligence (Completion, Hover, Outline)**
- **v0.5 – Ecosystem Integration (CREST, multi-file workflows)**
- **v0.6+ – Performance, Testing, and Cross-Code Extensions**

You can treat each version as a rough milestone rather than a strict release plan.

---

## 3. v0.2 – Schema Expansion & Auto-generation

### 3.1 Expand Instruction/Option Coverage

**Goal**: support a much larger subset of xTB’s detailed input, based on official documentation and defaults.

Tasks:

- Survey xTB documentation and `default.inp` examples to identify:
  - Additional instructions (`$opt`, `$restart`, etc., depending on actual xcontrol features).
  - Additional options for existing instructions (`$wall`, `$constrain`, `$write`, etc.).
- Update `xtbSchema`:
  - Add new instructions with `InstructionKind` and option maps.
  - Mark option kinds (`single` vs `list`) and basic `valueType`s.

Outcome:

- Better coverage means fewer spurious “unknown option” warnings for real-world input files.

### 3.2 Auto-generation of Schema from xTB Resources

**Goal**: reduce manual maintenance of schema by leveraging xTB’s own resources.

Ideas:

- Write a **small utility script** (could live in `packages/tools` or similar) that:
  - Consumes a canonical `default.inp` or similar reference file.
  - Scans for `$instruction` lines.
  - Extracts keys used under each instruction.
  - Generates a TypeScript or JSON schema fragment.

- Optionally, parse official man pages or documentation if they are structured enough.

Workflow:

1. Raw input: `default.inp` (checked into `tools/resources` or generated via an external command).
2. Generator script: `node generateSchemaFromDefaultInp.js` → writes `xtbSchema.generated.ts`.
3. `xtbSchema.ts` imports from or merges with `xtbSchema.generated.ts`.

Benefits:

- When xTB adds new options, updating the schema becomes a one-command process.
- Minimizes drift between documentation and tooling.

### 3.3 Internal Versioning

- Tag the schema with an approximate xTB version (e.g. `schemaVersion: "xTB 6.6 (approx)"`).
- Document which xTB version(s) the extension schema is known to work best with.

---

## 4. v0.3 – Richer Diagnostics & Semantic Validation

### 4.1 Parameter Count and Structure Checks

**Goal**: understand the expected structure for some critical options and validate them lightly.

Examples:

- `distance: i j r` – expect 3 or 4 tokens.
- `angle: i j k theta` – expect 4 or 5 tokens.
- `dihedral: i j k l phi` – expect 5 or 6 tokens.
- `sphere: R x y z` – expect (at least) 4 numeric values.

Approach:

- Extend `XtbOptionSpec` to include a `valueArity` or `valuePattern` hint.
- In diagnostics, parse the value into tokens and compare length counts.
- Emit soft warnings if a clearly wrong number of tokens is detected.

### 4.2 Basic Type Checking (Numbers vs Keywords)

**Goal**: sanity-check obvious type mismatches.

Examples:

- Option expects a numeric value but gets something clearly non-numeric (`alpha = foo`).
- Option expects one of a small set of enumerated values (`potential = bar` when only `polynomial` and `logfermi` are supported).

Approach:

- Use existing `valueType` and `allowedValues` fields from `xtbSchema`.
- Implement simple checks:
  - `valueType === "number"` → verify the first token parses as a number.
  - `valueType === "enum"` → verify the first token is in `allowedValues`.

Diagnostics should remain **non-blocking** and tolerant of advanced usage; consider using `"information"` severity by default for most of these.

### 4.3 Cross-option Validation (Lightweight)

Possible examples:

- Warn if a `constrain` block has `distance` lines but no `atoms` specification (if such usage is known to be suspicious).
- Detect obviously conflicting options (if any) within the same block.

This requires more domain knowledge and should be introduced gradually, with tests on real files.

---

## 5. v0.4 – Language Intelligence (Completion, Hover, Outline)

### 5.1 Completion (IntelliSense)

**Goal**: provide basic tab-completion for instructions and options.

Features:

- At the start of a line (after whitespace), when the user types `$`:
  - Offer a completion list of known instructions from `xtbSchema.instructions`.
- Within the body of a group instruction:
  - Offer completion for option keys defined for that instruction.
  - Optionally, insert the appropriate operator (`:` vs `=`) automatically.

Implementation:

- Extend the Language Server to implement `textDocument/completion`:
  - Use the parser to identify the current instruction context and position.
  - Generate `CompletionItem`s with labels and simple documentation.

### 5.2 Hover Documentation

**Goal**: show short help text when hovering over an instruction or option key.

Features:

- When hovering on an instruction name (e.g. `$constrain`):
  - Show a brief description derived from the schema or embedded docs.
- When hovering on an option key (e.g. `potential` under `$wall`):
  - Show allowed value types and example usage.

Implementation:

- Add optional `description` and `examples` fields to `XtbInstructionSpec` and `XtbOptionSpec`.
- Implement `textDocument/hover` in the Language Server:
  - Use cursor position to find the underlying node (instruction / option).
  - Render Markdown content as hover text.

### 5.3 Document Symbols / Outline

**Goal**: provide an outline view of xcontrol files in VS Code’s “Outline” panel.

Features:

- Each instruction becomes a symbol:
  - Name: `$fix`, `$constrain`, `$wall`, `$chrg`, etc.
  - Range: from instruction line to body end (for `group` instructions).
- Group instructions may appear as “containers” of options (if desired).

Implementation:

- Implement `textDocument/documentSymbol` in the Language Server.
- Derive symbol list from `ParsedDocument.instructions`.

This significantly improves navigation in large xcontrol files.

### 5.4 Semantic Tokens (Optional)

If finer granularity is desired beyond TextMate highlighting, implement **semantic tokens** for:

- Instruction names.
- Option keys and operators.
- Numeric literals.

This is optional and only needed if the TextMate grammar is too limited for certain themes/requests.

---

## 6. v0.5 – Ecosystem Integration

### 6.1 CREST and Other Tools

**Goal**: reuse the same language support for tools that share or embed xTB input syntax (e.g., CREST’s `constraints.inp`).

Tasks:

- Add **language associations** for files like `constraints.inp` or other CREST-related files that use xcontrol-like syntax.
- Optionally, expose separate language IDs if the semantics diverge enough.

Diagnostics and snippets can be shared or tuned with minimal changes.

### 6.2 Multi-file Awareness (Include-like Semantics)

If xcontrol supports splitting configuration into multiple files, or if project layouts become common (e.g., one file per constraint set):

- Introduce **workspace-level** configuration and multi-file parsing:
  - Understand `@include`-like directives if they exist in xTB detailed input.
  - Provide diagnostics that follow links across files (e.g., missing included file).

This is more advanced and can be deferred until clear demand exists.

### 6.3 Command Palette Helpers

Add non-invasive commands, e.g.:

- “Insert xTB xcontrol template” – inserts the `xtb.template` snippet at the cursor.
- “Wrap selection in $fix block” – takes selected lines and wraps them in a `$fix`/`$end` block.

These are nice-to-have, optional enhancements.

---

## 7. v0.6+ – Performance, Testing, and Cross-Code Extensions

### 7.1 Performance and Robustness

- Optimize parsing for large xcontrol files:
  - Ensure `parseXtbDocument` is linear in file size and minimizes allocations.
  - Debounce diagnostics for very frequent edits.
- Handle large projects with many open files gracefully.

### 7.2 Testing and CI Enhancements

- Add more extensive unit and integration tests:
  - Real-world xcontrol samples (anonymized / generic).
  - Regression tests for previously reported issues.
- Improve CI:
  - Run tests on multiple Node versions.
  - Optionally add pre-release build and marketplace publishing automation.

### 7.3 Extending to Other Codes (Long-term)

If desired, the architecture can be generalized to support **other computational chemistry / materials codes**:

- LAMMPS input scripts.
- CP2K input files.
- Other semiempirical/DFT codes (depending on demand).

Approach:

- Create a shared **core** library that handles generic concepts (lexer, parser framework, diagnostics helpers).
- Add new language modules (e.g., `xtb-xcontrol`, `lammps`, `cp2k`) that plug into the framework.

This would turn the project into a broader “computational chemistry VS Code toolkit”.

---

## 8. Prioritization Suggestions

For practical development (including agentic coders), the following order is recommended:

1. **v0.2 – Schema Expansion & Auto-generation**  
   Directly improves correctness and reduces maintenance burden.

2. **v0.3 – Richer Diagnostics**  
   Adds a lot of value for users by catching subtle mistakes.

3. **v0.4 – Completion, Hover, Outline**  
   Improves UX significantly and makes the extension feel “intelligent”.

4. **v0.5 – Ecosystem Integration**  
   Connects the extension to how xTB is actually used in workflows (CREST, multi-file setups).

5. **v0.6+ – Generalization & Performance**  
   Future-proofing and expansion beyond xTB.

Each step should be treated as a **set of small, independent issues** in the tracker, so they can be assigned to different contributors or agents.

---

## 9. How to Use This Roadmap

- Treat this document as a **living plan**:
  - Update it when new xTB features appear.
  - Mark completed items with a version/tag reference.
- When using agentic coders:
  - Point them to a specific section (e.g., “v0.3 – Parameter Count Checks”) and translate that section into a set of GitHub issues.
  - Include links to the relevant spec docs (01–07) so they have full context.

This ensures the project can evolve incrementally while remaining structured and maintainable.
