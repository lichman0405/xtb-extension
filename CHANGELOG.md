# Changelog

All notable changes to the "xTB xcontrol" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-12-11

### Added

#### Core Features

- **Syntax Highlighting**: TextMate grammar supporting all xTB xcontrol syntax elements
  - Instructions (`$fix`, `$constrain`, `$wall`, `$opt`, `$scan`, etc.)
  - Options with `:` and `=` operators
  - Comments, numbers, strings, booleans, ranges
  - Proper scoping for semantic highlighting

#### Language Server Protocol (LSP)

- **6 Diagnostic Rules** with configurable severity levels:
  - R1: Unknown Instruction Detection (error)
  - R2: Unknown Option Validation (warning)
  - R3: Suspicious Operator Usage (warning)
  - R4: Duplicate Option Detection (warning)
  - R5: Orphan Option Detection (error)
  - R6: Missing `$end` Terminator (hint)
- Real-time document validation
- Configuration support via VS Code settings

#### Code Snippets

- **19 pre-built snippets** for rapid development:
  - `xtb.fix` - Atomic position fixing
  - `xtb.constrain` - Geometry constraints
  - `xtb.wall` - Potential walls
  - `xtb.opt` - Optimization settings
  - `xtb.scan` - Coordinate scanning
  - `xtb.hess` - Hessian calculation
  - `xtb.metadyn` - Metadynamics
  - `xtb.scc` - SCC settings
  - `xtb.split` - Fragment splitting
  - `xtb.cube` - Cube file generation
  - `xtb.gfn` - GFN method selection
  - `xtb.siman` - Simulated annealing
  - `xtb.path` - Path finder
  - `xtb.reactor` - Reactor settings
  - `xtb.md` - Molecular dynamics
  - `xtb.write` - Output control
  - `xtb.template` - Complete file template
  - `xtb.comment` - Comment blocks
  - `xtb.end` - End terminator

#### Schema and Parser

- Comprehensive xTB instruction schema covering 15+ instructions:
  - `$fix`, `$constrain`, `$wall`, `$metadyn`, `$md`
  - `$siman`, `$path`, `$reactor`, `$cube`, `$split`
  - `$opt`, `$scan`, `$hess`, `$gfn`, `$scc`, `$write`
- Full lexer and parser implementation
  - Token-based lexical analysis
  - AST (Abstract Syntax Tree) generation
  - Error-tolerant parsing

#### Language Configuration

- Auto-completion triggers for `$`
- Bracket auto-closing and matching
- Comment toggling with `Ctrl+/` / `Cmd+/`
- Word pattern recognition for options and values

#### Project Infrastructure

- **Monorepo structure** with npm workspaces:
  - `@xtb-xcontrol/client` - VS Code extension client
  - `@xtb-xcontrol/server` - Language Server implementation
  - `@xtb-xcontrol/shared` - Shared types and schema
- TypeScript 5.3.2 with strict mode
- Project references for incremental builds
- ESLint + Prettier for code quality

#### Documentation and Testing

- Comprehensive documentation in `docs/` folder
- Testing guide with example files
- 8 test cases validating parser and diagnostics
- Example xcontrol files demonstrating features

### Fixed

- Added missing instructions to schema: `$opt`, `$scan`, `$hess`, `$gfn`, `$metadyn`, `$scc`
- Added missing options for `$write` instruction
- Fixed file extension recognition for syntax highlighting

### Technical Details

- **VS Code Engine**: ^1.85.0
- **Language Server Protocol**: vscode-languageserver 9.0.1
- **Language Client**: vscode-languageclient 9.0.1
- **Supported File Types**: `.xcontrol`, `.xtbrc`, `xtb.inp`
- **License**: MIT
