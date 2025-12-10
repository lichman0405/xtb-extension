# xTB xcontrol VS Code Extension – Project Overview

## 1. Project Summary

This project is a Visual Studio Code extension that provides:

1. **Syntax highlighting** for xTB “detailed input” files (xcontrol format).
2. **Basic format checking (linting)** via a Language Server (LSP) for common mistakes in xcontrol files.

The primary goal of **v0.1** is to make editing xcontrol files more pleasant and less error‑prone, without trying to be a full semantic validator of all xTB options.

Target users: computational chemists and materials scientists using xTB / CREST who edit xcontrol / `xtb.inp` files in VS Code.

---

## 2. Scope of v0.1

### 2.1 In Scope

- Recognizing xTB “detailed input” / xcontrol syntax:
  - Lines starting with `$` as **instructions** (e.g. `$fix`, `$constrain`, `$wall`, `$chrg`, `$spin`, `$cmd`, `$date`, `$end`).
  - Instruction bodies containing **options** of the form:
    - `key = value`
    - `key: value`
  - Comments starting with `#`.
- Syntax highlighting:
  - Different token scopes / colors for:
    - Instruction names (`$fix`, `$constrain`, etc.).
    - Option keys (`atoms`, `elements`, `distance`, `potential`, etc.).
    - Numbers.
    - Strings.
    - Comments.
  - Grammar implemented as a TextMate grammar (`syntaxes/xtb.tmLanguage.json`).
- Basic structure and format checks via LSP diagnostics:
  - Unknown instructions (e.g. `$foo` that is not recognized).
  - Unknown option keys within a known instruction.
  - Suspicious option forms (using `:` where `=` is expected and vice versa).
  - Multiple assignments to “single” options that should appear only once.
  - Options that appear outside of any instruction block (“orphan” options).
  - Group instructions that are not explicitly terminated with `$end` (soft warning / hint).
- Basic snippets:
  - Small prefixes that expand into common instruction blocks, e.g.:
    - `xtb.fix` → `$fix … $end`.
    - `xtb.constrain` → `$constrain … $end`.
    - `xtb.wall` → `$wall … $end`.
- Minimum engineering hygiene:
  - Monorepo structure with a **client** (VS Code extension), **server** (LSP), and **shared** (schema and shared types).
  - Compilation, linting, and unit tests.
  - GitHub Actions to run lint + tests + packaging on each push/PR.

### 2.2 Out of Scope (for v0.1)

- Deep numerical validation:
  - Checking numeric ranges, units, or physically reasonable values.
- Full coverage of all xTB options:
  - v0.1 will initially focus on a reasonably small set of common instructions/options.
  - The schema should be designed for easy extension later.
- Direct interaction with the xTB binary:
  - No automatic invocation of `xtb` or parsing of its output in v0.1.
- Complex project management features:
  - No job submission to clusters, no project/workspace management, etc.

---

## 3. Target File Types and Language ID

The extension should define a VS Code language ID, for example: **`xtb-xcontrol`**, and associate it with the following file patterns:

- `xcontrol`
- `xtb.inp`
- `.xtbrc`

Additional patterns can be added later via configuration.

The language ID `xtb-xcontrol` will be used by:

- The TextMate grammar for syntax highlighting.
- The language server for diagnostics and (later) completion.
- Snippets and any other language-specific features.

---

## 4. High-Level Architecture

### 4.1 Monorepo Layout

Use a monorepo with three packages:

```text
xtb-xcontrol-vscode/
├── package.json             # root package (scripts, devDependencies)
├── packages/
│   ├── client/              # VS Code extension (front-end)
│   │   ├── package.json
│   │   ├── src/
│   │   │   └── extension.ts
│   │   ├── syntaxes/
│   │   │   └── xtb.tmLanguage.json
│   │   ├── language-configuration.json
│   │   └── snippets/
│   │       └── xtb.json
│   ├── server/              # Language Server
│   │   ├── package.json
│   │   └── src/
│   │       ├── server.ts
│   │       ├── parser/
│   │       │   ├── xtbLexer.ts
│   │       │   └── xtbParser.ts
│   │       └── diagnostics/
│   │           └── rules.ts
│   └── shared/              # Shared schema & types
│       ├── package.json
│       └── src/
│           ├── xtbSchema.ts
│           └── types.ts
└── .github/
    └── workflows/
        └── ci.yml
```

Responsibilities:

- **client**:
  - Implements the VS Code extension entry point.
  - Registers the language, grammar, and snippets.
  - Starts and communicates with the language server.
- **server**:
  - Implements the LSP server using `vscode-languageserver`.
  - Parses documents, runs diagnostics, and can later provide completion and document symbols.
- **shared**:
  - Contains the xTB instruction/option schema and TypeScript types.
  - Imported by both client and server.

### 4.2 Language Server Responsibilities (v0.1)

- Maintain document text via `TextDocuments`.
- On document change:
  - Tokenize and parse the document into a simple in-memory representation:
    - A list of instructions, each with:
      - Name (`$fix`, `$constrain`, etc.).
      - Range (start line, end line).
      - A list of options (`key`, `form` = `=` or `:`, `value`, line number).
  - Run a set of diagnostic rules over this representation.
  - Send diagnostics back to the client.

Detailed schema and parser specs will be defined in separate documents
(`05-schema-and-parser-spec.md` and `06-diagnostics-rules.md`).

---

## 5. Technology Choices

- **Language**: TypeScript for both client and server.
- **VS Code Extension API**: Use the official VS Code extension APIs.
- **Language Server Protocol (LSP)**:
  - Use the official `vscode-languageserver` and `vscode-languageclient` libraries.
- **Syntax Highlighting**:
  - TextMate grammar in JSON (`xtb.tmLanguage.json`).
- **Package Manager**:
  - `pnpm` or `npm` workspaces (to keep client/server/shared in sync).
- **Linting & Formatting**:
  - `eslint` + `prettier` (or similar).
- **Testing**:
  - Any common JS test framework (e.g. `vitest`, `jest`, or `mocha`).
  - Tests should cover:
    - Parsing of representative xcontrol files.
    - Diagnostic rule behavior on small fixtures.

---

## 6. Milestones (v0.1)

### Milestone 0 – Scaffold

- Initialize monorepo with `client`, `server`, `shared` packages.
- Set up build, lint, and test scripts.
- Create minimal extension activation that recognizes the `xtb-xcontrol` language.

### Milestone 1 – Syntax Highlighting

- Implement `xtb.tmLanguage.json` for basic highlighting:
  - Instruction lines.
  - Option lines (`key=` and `key:`).
  - Numbers, strings, comments.
- Implement `language-configuration.json`:
  - Comment pattern (`#`).
  - Basic indentation rules (optional).

### Milestone 2 – Schema & Parser

- Define TypeScript types and initial schema for:
  - Common instructions (`$fix`, `$constrain`, `$wall`, `$write`, `$chrg`, `$spin`, `$cmd`, `$date`, `$end`).
  - Common options for those instructions.
- Implement a simple line-based lexer and parser that produce:
  - An instruction list.
  - An option list per instruction.

### Milestone 3 – Diagnostics

- Implement a first set of diagnostic rules:
  - Unknown instruction.
  - Unknown option key.
  - Suspicious option form (`:` vs `=`).
  - Duplicate single-assignment options.
  - Options outside of any instruction.
  - Group instructions without `$end` (soft warning).
- Wire diagnostics into the language server and test them end-to-end.

### Milestone 4 – Snippets & UX Polish

- Add snippets for common instruction blocks.
- Improve README and basic documentation.
- Add a few screenshots/gifs (optional).

### Milestone 5 – CI & Packaging

- Set up GitHub Actions to run lint + tests + `vsce package` on each push/PR.
- Prepare a `.vsix` package for local installation.
- Optionally publish to VS Code Marketplace (requires publisher account).

---

## 7. Definition of “Done” for v0.1

- Opening an xcontrol / `xtb.inp` file in VS Code:
  - Uses the `xtb-xcontrol` language mode.
  - Shows clear syntax highlighting for instructions, options, numbers, and comments.
- Intentional mistakes in instructions/options produce diagnostics in the “Problems” panel with clear messages.
- Common instruction blocks can be inserted via snippets.
- Repository builds, lints, and runs tests cleanly.
- CI pipeline passes on the main branch.
