# Development Plan for xTB xcontrol VS Code Extension

> File: `docs/09-development-plan.md`  
> Version: 0.1 (Implementation Roadmap)  
> Audience: Developers, Contributors, Project Manager  
> Last Updated: December 10, 2025

This document outlines the comprehensive development plan for implementing the xTB xcontrol VS Code extension from scratch to a publishable v0.1 release.

---

## 📋 Project Overview

This project aims to build a VS Code extension that provides:
- **Syntax highlighting** for xTB xcontrol/detailed input files
- **Language Server Protocol (LSP)** based diagnostics and linting
- **Code snippets** for common instruction blocks
- **Enhanced editing experience** for computational chemistry users

### Technology Stack
- **Language**: TypeScript
- **Architecture**: Monorepo with 3 packages (client, server, shared)
- **Package Manager**: pnpm or npm workspaces
- **Testing**: Vitest/Jest/Mocha
- **CI/CD**: GitHub Actions

---

## 🎯 Development Phases

### Phase 1: Project Scaffolding (Priority: CRITICAL)

**Objective**: Establish the foundation and build infrastructure

**Tasks**:
1. Create monorepo directory structure:
   ```
   xtb-xcontrol-vscode/
   ├── packages/
   │   ├── client/
   │   ├── server/
   │   └── shared/
   ├── package.json (root)
   ├── pnpm-workspace.yaml
   └── tsconfig.base.json
   ```

2. Configure root `package.json`:
   - Define workspace packages
   - Add build/lint/test scripts
   - Install common devDependencies (TypeScript, ESLint, Prettier, vsce)

3. Set up TypeScript configuration:
   - Create `tsconfig.base.json` for shared settings
   - Create per-package `tsconfig.json` files

4. Configure linting and formatting:
   - ESLint configuration (`.eslintrc.js`)
   - Prettier configuration (`.prettierrc`)
   - Add lint scripts

5. Create essential files:
   - `.gitignore` (node_modules, dist, *.vsix, etc.)
   - Root `README.md` with project overview
   - `LICENSE` file

**Deliverables**:
- ✅ Compilable project skeleton
- ✅ Working build scripts
- ✅ Linter configured and passing

**Estimated Effort**: 2-3 hours

---

### Phase 2: Syntax Highlighting Implementation (Priority: HIGH)

**Objective**: Provide immediate visual feedback for xcontrol files

**Tasks**:
1. Create `packages/client/syntaxes/xtb.tmLanguage.json`:
   - Define scope: `source.xtb-xcontrol`
   - Implement patterns for:
     - Instruction lines (`$fix`, `$constrain`, `$wall`, etc.)
     - Option lines with `:` and `=` operators
     - Comments (`#` to end-of-line)
     - Numbers (integers, floats, scientific notation)
     - Strings (single and double quoted)

2. Create `packages/client/language-configuration.json`:
   - Comment configuration (line comment: `#`)
   - Bracket pairs (if applicable)
   - Auto-closing pairs
   - Indentation rules

3. Reference grammar in client manifest

**Deliverables**:
- ✅ Functional syntax highlighting in VS Code
- ✅ Consistent token colors across themes
- ✅ Proper comment handling

**Estimated Effort**: 4-6 hours

---

### Phase 3: Schema and Type System (Priority: HIGH)

**Objective**: Define the semantic model of xcontrol files

**Tasks**:
1. Create `packages/shared/src/types.ts`:
   - `InstructionKind`: `"logical" | "group" | "end"`
   - `OptionKind`: `"single" | "list"`
   - `OptionOperator`: `"=" | ":"`
   - `Position` and `Range` interfaces
   - `OptionNode` interface
   - `InstructionNode` interface
   - `ParsedDocument` interface

2. Create `packages/shared/src/xtbSchema.ts`:
   - Define `XtbOptionSpec` interface
   - Define `XtbInstructionSpec` interface
   - Define `XtbSchema` root structure
   - Implement initial schema covering:
     - `$fix` (group) - with `atoms`, `elements` options
     - `$constrain` (group) - with `atoms`, `distance`, `angle`, `dihedral` options
     - `$wall` (group) - with `potential`, `alpha`, `beta`, `temp`, `sphere`, `ellipsoid` options
     - `$write` (group) - with basic options
     - `$chrg`, `$spin`, `$cmd`, `$date` (logical)
     - `$end` (end)

3. Export all types and schema from package entry point

**Deliverables**:
- ✅ Complete type definitions
- ✅ Schema data structure with initial instruction set
- ✅ Helper functions for schema queries

**Estimated Effort**: 3-4 hours

---

### Phase 4: Lexer and Parser Implementation (Priority: HIGH)

**Objective**: Convert raw text into structured data for diagnostics

**Tasks**:
1. Implement `packages/server/src/parser/xtbLexer.ts`:
   - Define `LineTokenKind` types
   - Define token interfaces (InstructionLineToken, OptionLineToken, etc.)
   - Implement `lexXtbDocument(text: string): LexResult`:
     - Line-by-line classification
     - Extract instruction names and normalize to baseName
     - Parse option lines (key, operator, value)
     - Detect comments and blank lines
     - Compute position ranges for diagnostics

2. Implement `packages/server/src/parser/xtbParser.ts`:
   - Implement `parseXtbDocument(text: string, schema: XtbSchema): ParsedDocument`:
     - Consume LexResult
     - Build InstructionNode array
     - Associate options with parent instructions
     - Detect orphan options (outside any instruction)
     - Determine instruction body boundaries
     - Validate against schema

3. Add unit tests for lexer and parser:
   - Test various instruction types
   - Test option parsing with `:` and `=`
   - Test comment handling
   - Test edge cases (malformed input, etc.)

**Deliverables**:
- ✅ Lexer producing tokens with position info
- ✅ Parser producing ParsedDocument
- ✅ Unit tests with >80% coverage

**Estimated Effort**: 6-8 hours

---

### Phase 5: Language Server Implementation (Priority: HIGH)

**Objective**: Provide real-time diagnostics and error checking

**Tasks**:
1. Set up LSP server infrastructure in `packages/server/src/server.ts`:
   - Initialize connection using `vscode-languageserver`
   - Set up `TextDocuments` manager
   - Handle `onDidChangeContent` events
   - Implement document validation pipeline

2. Implement diagnostic rules in `packages/server/src/diagnostics/rules.ts`:
   - **R1 - Unknown Instruction**: Check instruction names against schema
   - **R2 - Unknown Option Key**: Validate option keys for each instruction
   - **R3 - Suspicious Option Operator**: Detect operator mismatches
   - **R4 - Duplicate Single-assignment Option**: Check for repeated single-value options
   - **R5 - Orphan Option**: Detect options outside instruction blocks
   - **R6 - Missing $end Terminator**: Soft hint for group instructions without `$end`

3. Implement configuration handling:
   - Define settings schema for diagnostic severities
   - Handle `workspace/configuration` requests
   - Map severity strings to LSP DiagnosticSeverity enum
   - Support `"off"` to disable individual rules

4. Implement diagnostic emission:
   - Create `Diagnostic` objects with proper ranges
   - Assign diagnostic codes (e.g., `"xtb.unknownInstruction"`)
   - Include helpful messages and optional related information
   - Send diagnostics via `connection.sendDiagnostics()`

**Deliverables**:
- ✅ Functioning Language Server
- ✅ All 6 diagnostic rules implemented
- ✅ Configurable severity levels
- ✅ Real-time error feedback in VS Code

**Estimated Effort**: 8-10 hours

---

### Phase 6: Client Extension Implementation (Priority: HIGH)

**Objective**: Wire everything together into a VS Code extension

**Tasks**:
1. Configure `packages/client/package.json` (extension manifest):
   - Set extension metadata (name, publisher, version, description)
   - Define `engines.vscode` version requirement
   - Add activation events: `onLanguage:xtb-xcontrol`
   - Contribute language definition:
     - `id`: `"xtb-xcontrol"`
     - `extensions`: `[".inp", ".xcontrol", ".xtbrc"]`
     - `aliases`: `["xTB xcontrol", "xtb"]`
   - Contribute grammars (reference to tmLanguage.json)
   - Contribute language configuration
   - Define configuration schema for diagnostics
   - Set extension categories and keywords

2. Implement `packages/client/src/extension.ts`:
   - Implement `activate()` function:
     - Create server module path
     - Configure server options (run and debug)
     - Create LanguageClient instance
     - Start the client
   - Implement `deactivate()` function:
     - Gracefully stop the client

3. Configure build process:
   - Set up compilation targets
   - Configure bundling (esbuild or webpack)
   - Define output paths

**Deliverables**:
- ✅ Activating extension in VS Code
- ✅ Language Server connection established
- ✅ End-to-end diagnostics working
- ✅ Settings exposed in VS Code UI

**Estimated Effort**: 4-6 hours

---

### Phase 7: Code Snippets (Priority: MEDIUM)

**Objective**: Accelerate editing with common patterns

**Tasks**:
1. Create `packages/client/snippets/xtb.json`:
   - **xtb.fix**: `$fix` block with atoms and elements
   - **xtb.constrain**: `$constrain` block with distance/angle/dihedral
   - **xtb.wall**: `$wall` block with potential configuration
   - **xtb.write**: `$write` block
   - **xtb.chrg**: `$chrg` single-line instruction
   - **xtb.spin**: `$spin` single-line instruction
   - **xtb.cmd**: `$cmd` instruction
   - **xtb.template**: Full file template with common structure

2. Use tabstops (`${1:placeholder}`) for editable regions

3. Register snippets in extension manifest

**Deliverables**:
- ✅ 8+ useful snippets
- ✅ IntelliSense suggestions for snippets
- ✅ Tab navigation through placeholders

**Estimated Effort**: 2-3 hours

---

### Phase 8: Testing and CI/CD (Priority: MEDIUM)

**Objective**: Ensure quality and automate validation

**Tasks**:
1. Write unit tests:
   - Lexer tests (`xtbLexer.test.ts`)
   - Parser tests (`xtbParser.test.ts`)
   - Diagnostic rules tests (`rules.test.ts`)
   - Schema validation tests

2. Create test fixture files:
   - Valid xcontrol files
   - Files with intentional errors
   - Edge cases

3. Configure GitHub Actions (`.github/workflows/ci.yml`):
   - Trigger on push and pull_request
   - Install dependencies (pnpm/npm)
   - Run linter
   - Run tests
   - Build all packages
   - Package extension with `vsce package`
   - Upload .vsix as artifact

4. Add test scripts to root package.json

**Deliverables**:
- ✅ Comprehensive test suite
- ✅ CI pipeline passing on main branch
- ✅ Automated .vsix generation

**Estimated Effort**: 6-8 hours

---

### Phase 9: Documentation and Release Preparation (Priority: MEDIUM)

**Objective**: Prepare for public release

**Tasks**:
1. Write user-facing documentation:
   - `packages/client/README.md`:
     - Feature overview with screenshots
     - Installation instructions
     - Usage guide
     - Configuration reference
     - Troubleshooting section
   - Create example xcontrol files in `examples/`

2. Add project documentation:
   - `CHANGELOG.md` (following Keep a Changelog format)
   - `CONTRIBUTING.md` (for future contributors)
   - Update root README.md

3. Create marketing materials:
   - Extension icon (128x128 PNG)
   - Screenshots demonstrating features
   - Animated GIF showing diagnostics in action

4. Prepare for VS Code Marketplace:
   - Register publisher account (if needed)
   - Configure `vsce` for publishing
   - Write marketplace description

5. Package extension:
   - Run `vsce package` to create .vsix
   - Test installation from .vsix locally

**Deliverables**:
- ✅ Complete user documentation
- ✅ Professional README with visuals
- ✅ Packaged .vsix file ready for distribution

**Estimated Effort**: 6-8 hours

---

### Phase 10: Optimization and Enhancement (Priority: LOW - Post v0.1)

**Objective**: Improve performance and add advanced features

**Tasks** (Future versions):
1. Performance optimization:
   - Incremental parsing for large files
   - Caching parsed results
   - Debouncing validation

2. Extended schema coverage:
   - Add more xTB instructions
   - Support additional options
   - Option value validation

3. Advanced LSP features:
   - Auto-completion (textDocument/completion)
   - Hover information (textDocument/hover)
   - Document symbols/outline (textDocument/documentSymbol)
   - Go to definition for instruction references

4. Integration features:
   - Run xTB from extension
   - Parse xTB output
   - Visualization support

**Note**: These are stretch goals for v0.2 and beyond

---

## 🚀 Recommended Development Sequence

### Round 1: Basic Functionality
**Phases**: 1 → 2 → 6 (simplified)  
**Goal**: Extension activates and provides syntax highlighting  
**Duration**: ~10-15 hours

### Round 2: Data Model
**Phases**: 3 → 4  
**Goal**: Parse xcontrol files into structured data  
**Duration**: ~10-12 hours

### Round 3: Core Features
**Phases**: 5 → 6 (complete)  
**Goal**: Full diagnostic functionality working  
**Duration**: ~12-16 hours

### Round 4: Polish and Release
**Phases**: 7 → 8 → 9  
**Goal**: Publishable v0.1 release  
**Duration**: ~14-19 hours

---

## ⏱️ Time Estimates

| Phase | Estimated Hours | Cumulative |
|-------|----------------|------------|
| Phase 1: Scaffolding | 2-3 | 2-3 |
| Phase 2: Syntax Highlighting | 4-6 | 6-9 |
| Phase 3: Schema & Types | 3-4 | 9-13 |
| Phase 4: Lexer & Parser | 6-8 | 15-21 |
| Phase 5: Language Server | 8-10 | 23-31 |
| Phase 6: Client Extension | 4-6 | 27-37 |
| Phase 7: Snippets | 2-3 | 29-40 |
| Phase 8: Testing & CI | 6-8 | 35-48 |
| Phase 9: Documentation | 6-8 | 41-56 |

**Total for v0.1**: 41-56 hours of focused development

---

## ✅ Definition of Done (v0.1)

The extension is ready for v0.1 release when:

- [ ] Opening `.xcontrol`, `xtb.inp`, or `.xtbrc` files triggers extension activation
- [ ] Syntax highlighting correctly identifies instructions, options, comments, numbers, and strings
- [ ] Language Server provides real-time diagnostics for:
  - [ ] Unknown instructions
  - [ ] Unknown option keys
  - [ ] Suspicious operators
  - [ ] Duplicate options
  - [ ] Orphan options
  - [ ] Missing $end terminators
- [ ] All diagnostic severities are configurable via VS Code settings
- [ ] Code snippets are available and functional
- [ ] All tests pass
- [ ] CI pipeline is green
- [ ] Documentation is complete
- [ ] `.vsix` package installs and works correctly in VS Code
- [ ] No critical bugs or crashes

---

## 📦 Deliverables Summary

### Code Artifacts
- ✅ Monorepo with 3 packages (client, server, shared)
- ✅ TextMate grammar (xtb.tmLanguage.json)
- ✅ Language configuration
- ✅ TypeScript type definitions
- ✅ xTB schema with initial instruction set
- ✅ Lexer and parser
- ✅ Language Server with 6 diagnostic rules
- ✅ VS Code client extension
- ✅ 8+ code snippets
- ✅ Test suite

### Documentation
- ✅ User-facing README
- ✅ Technical specifications (existing docs/)
- ✅ Development plan (this document)
- ✅ CHANGELOG
- ✅ API documentation

### Build Artifacts
- ✅ Compiled JavaScript bundles
- ✅ .vsix extension package
- ✅ CI/CD pipeline configuration

---

## 🎓 Success Metrics

- Extension loads without errors
- Syntax highlighting covers >95% of common xcontrol patterns
- Diagnostics catch common user errors with <5% false positives
- Test coverage >80%
- CI pipeline completes in <5 minutes
- Documentation is clear and sufficient for new users

---

## 📝 Notes for Implementers

1. **Keep It Simple**: v0.1 should focus on core functionality, not perfection
2. **Iterate Fast**: Get something working end-to-end early
3. **Test Incrementally**: Don't wait until the end to test integration
4. **Document as You Go**: Update docs when making design changes
5. **Ask for Feedback**: Share WIP builds with target users early

---

## 🔄 Version Control Strategy

- `main` branch: stable, always buildable
- Feature branches: `feature/phase-X-description`
- Commit frequently with clear messages
- Tag releases: `v0.1.0`, `v0.1.1`, etc.

---

## 🤝 Contribution Guidelines

(For future contributors)

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow existing code style (enforced by ESLint/Prettier)
- Submit PRs with clear descriptions

---

**End of Development Plan**

This plan is a living document and may be updated as development progresses.
