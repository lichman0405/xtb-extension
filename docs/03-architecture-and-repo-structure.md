# Architecture and Repository Structure

> File: `docs/03-architecture-and-repo-structure.md`  
> Version: 0.1 (draft for implementation)  
> Audience: extension / LSP developers

This document describes the **overall architecture** and **repository layout** for the xTB xcontrol VS Code extension project.  
It is intended to be a practical blueprint for implementing the monorepo, wiring the Language Server, and organizing shared code.

---

## 1. Goals

- Provide a **clear, opinionated** structure for the repository so that multiple contributors (or agents) can work in parallel.
- Separate concerns cleanly:
  - **client**: VS Code extension (UI side, activation, wiring).
  - **server**: Language Server (LSP implementation, parsing, diagnostics).
  - **shared**: Types and schema definitions used by both client and server.
- Make it easy to:
  - Run builds, tests, and linting from the root.
  - Package and publish the extension.
  - Extend the project later (additional features, more diagnostics, etc.).

---

## 2. Repository Layout Overview

Top-level structure:

```text
xtb-xcontrol-vscode/
├── package.json
├── pnpm-workspace.yaml        # or equivalent npm/yarn workspaces config
├── tsconfig.base.json         # base TS config shared by packages (optional)
├── docs/
│   ├── 01-project-overview.md
│   ├── 02-language-spec-xtb-xcontrol.md
│   ├── 03-architecture-and-repo-structure.md
│   └── ...
├── packages/
│   ├── client/
│   ├── server/
│   └── shared/
└── .github/
    └── workflows/
        └── ci.yml
```

Each sub-package under `packages/` is a separate Node package, wired together via a workspace setup (pnpm / npm / yarn).

> Note: The choice of `pnpm` vs `npm` vs `yarn` is flexible. This spec assumes **workspaces** are used; details can be adjusted to your preferred tool, as long as the structure remains similar.

---

## 3. Root Package (Workspace Manager)

### 3.1 Root `package.json`

Responsibilities:

- Define workspace packages (`packages/client`, `packages/server`, `packages/shared`).
- Provide root-level scripts for developer ergonomics.
- Hold common devDependencies (TypeScript, ESLint, Jest/Vitest, vsce, etc.).

Example skeleton (illustrative):

```jsonc
{
  "name": "xtb-xcontrol-vscode-monorepo",
  "private": true,
  "version": "0.1.0",
  "workspaces": [
    "packages/client",
    "packages/server",
    "packages/shared"
  ],
  "scripts": {
    "build": "npm run build -w client && npm run build -w server && npm run build -w shared",
    "build:client": "npm run build -w client",
    "build:server": "npm run build -w server",
    "build:shared": "npm run build -w shared",
    "lint": "eslint .",
    "test": "npm test -w client && npm test -w server && npm test -w shared",
    "package": "npm run package -w client"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "eslint": "^8.x",
    "prettier": "^3.x",
    "@types/node": "^20.x",
    "vsce": "^2.x"
  }
}
```

You may refine versions and add test frameworks according to the chosen stack.

### 3.2 Workspace Tooling

- **TypeScript base config**: place shared compiler options in `tsconfig.base.json` in the root and have each package extend it.
- **ESLint / Prettier**: optionally managed from the root, with package-level overrides as needed.

---

## 4. `packages/client` – VS Code Extension

### 4.1 Purpose

The **client** package implements the VS Code extension itself. Its responsibilities are:

- Declare the extension’s contributions via `package.json` (languages, grammars, snippets, configuration).
- Register and activate the language (`xtb-xcontrol`).
- Launch and communicate with the Language Server (LSP) in `packages/server`.
- Optionally handle client-side features (commands, status bar items, etc.) in future versions.

### 4.2 Directory Structure

```text
packages/client/
├── package.json
├── tsconfig.json
├── src/
│   └── extension.ts
├── syntaxes/
│   └── xtb.tmLanguage.json
├── language-configuration.json
├── snippets/
│   └── xtb.json
└── README.md
```

- `src/extension.ts` – extension entry point. This is where the LSP client is created and started.
- `syntaxes/xtb.tmLanguage.json` – TextMate grammar for xTB xcontrol syntax highlighting.
- `language-configuration.json` – language-specific editor settings (comments, bracket pairing, indentation rules, etc.).
- `snippets/xtb.json` – snippets for common instruction blocks.
- `README.md` – user-facing documentation on the Marketplace / GitHub.

### 4.3 Client `package.json` (Extension Manifest)

Key fields for a VS Code extension (simplified):

```jsonc
{
  "name": "xtb-xcontrol",
  "displayName": "xTB xcontrol Support",
  "description": "Syntax highlighting and basic linting for xTB detailed input (xcontrol) files.",
  "version": "0.1.0",
  "publisher": "YOUR_PUBLISHER_ID",
  "engines": {
    "vscode": "^1.90.0"
  },
  "categories": ["Programming Languages"],
  "main": "./out/extension.js",
  "activationEvents": ["onLanguage:xtb-xcontrol"],
  "contributes": {
    "languages": [
      {
        "id": "xtb-xcontrol",
        "aliases": ["xTB xcontrol", "xtb-xcontrol"],
        "extensions": ["xtb.inp", "xcontrol", ".xtbrc"],
        "configuration": "./language-configuration.json"
      }
    ],
    "grammars": [
      {
        "language": "xtb-xcontrol",
        "scopeName": "source.xtb-xcontrol",
        "path": "./syntaxes/xtb.tmLanguage.json"
      }
    ],
    "snippets": [
      {
        "language": "xtb-xcontrol",
        "path": "./snippets/xtb.json"
      }
    ]
  },
  "scripts": {
    "build": "tsc -p ./",
    "watch": "tsc -p ./ -w",
    "test": "echo "No client tests yet"",
    "package": "vsce package"
  },
  "dependencies": {
    "vscode-languageclient": "^9.x"
  },
  "devDependencies": {
    "vscode": "^1.1.37",
    "typescript": "^5.x"
  }
}
```

Notes:

- `main` points to the compiled JS file (`out/extension.js`), generated by TypeScript according to `tsconfig.json`.
- `activationEvents` ensures the extension activates when a file of language `xtb-xcontrol` is opened.

### 4.4 `extension.ts` – Language Client Wiring

The core logic of the client is to start an LSP client and connect to the server module in `packages/server`.

Typical steps:

1. Resolve the server module path (e.g. `../server/out/server.js`).
2. Define `ServerOptions` (run vs debug modes).
3. Define `LanguageClientOptions`:
   - `documentSelector`: `[{ language: "xtb-xcontrol" }]`.
   - `synchronize`: file watchers if needed.
4. Create a `LanguageClient` and `start()` it in `activate()`.

Pseudocode:

```ts
import * as path from "path";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export function activate(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(
    path.join("..", "server", "out", "server.js")
  );

  const serverOptions: ServerOptions = {
    run:   { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: { execArgv: ["--nolazy", "--inspect=6009"] } }
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: "xtb-xcontrol" }],
    synchronize: {
      // Add file watchers if needed
    }
  };

  client = new LanguageClient(
    "xtbXcontrolLanguageServer",
    "xTB xcontrol Language Server",
    serverOptions,
    clientOptions
  );

  context.subscriptions.push(client.start());
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
```

The exact paths and options may vary according to build setup.

---

## 5. `packages/server` – Language Server (LSP)

### 5.1 Purpose

The **server** package implements the Language Server Protocol (LSP) for xtb-xcontrol:

- Maintain text documents and their contents.
- Parse documents into a structured model (instructions + options).
- Run diagnostics (linting) based on the schema and parser output.
- Return diagnostics, and later possibly provide completion and document symbols.

### 5.2 Directory Structure

```text
packages/server/
├── package.json
├── tsconfig.json
└── src/
    ├── server.ts
    ├── parser/
    │   ├── xtbLexer.ts
    │   └── xtbParser.ts
    └── diagnostics/
        └── rules.ts
```

- `server.ts` – main entrypoint for the language server process.
- `parser/` – tokenization and structural parsing of xcontrol files.
- `diagnostics/` – diagnostic rules that operate on parser output.

### 5.3 Server `package.json`

Example:

```jsonc
{
  "name": "@xtb-xcontrol/server",
  "version": "0.1.0",
  "main": "./out/server.js",
  "scripts": {
    "build": "tsc -p ./",
    "watch": "tsc -p ./ -w",
    "test": "jest"  // or other framework
  },
  "dependencies": {
    "vscode-languageserver": "^9.x",
    "@xtb-xcontrol/shared": "0.1.0"
  },
  "devDependencies": {
    "typescript": "^5.x"
  }
}
```

The exact versions are flexible; names can be adjusted (e.g. scoped under your namespace).

### 5.4 `server.ts` – LSP Entry Point

Typical responsibilities:

1. Create an LSP connection (`createConnection`).
2. Create a `TextDocuments<TextDocument>` manager.
3. Handle `onInitialize` and `onInitialized` events.
4. Listen for document changes and compute diagnostics.
5. Optionally handle configuration changes.

High-level pseudocode:

```ts
import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  Diagnostic,
  InitializeParams,
  DidChangeConfigurationNotification,
  TextDocumentSyncKind,
  InitializeResult
} from "vscode-languageserver/node";

import {
  TextDocument
} from "vscode-languageserver-textdocument";

import { parseXtbDocument } from "./parser/xtbParser";
import { computeDiagnostics } from "./diagnostics/rules";

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;

connection.onInitialize((params: InitializeParams): InitializeResult => {
  const capabilities = params.capabilities;
  hasConfigurationCapability = !!capabilities.workspace?.configuration;

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // completionProvider, documentSymbolProvider, etc. can be added later
    }
  };
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
});

documents.onDidChangeContent(change => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const parsed = parseXtbDocument(text);
  const diagnostics: Diagnostic[] = computeDiagnostics(parsed);
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

documents.listen(connection);
connection.listen();
```

The functions `parseXtbDocument` and `computeDiagnostics` are implemented in dedicated modules and use **shared** types/schemas.

---

## 6. `packages/shared` – Shared Types and Schema

### 6.1 Purpose

The **shared** package contains cross-cutting TypeScript definitions and data:

- Instruction and option schema (`xtbSchema`).
- Core types for parser output:
  - Instruction representation (name, range, options).
  - Option representation (key, operator, value, line, etc.).
- Enums / type aliases for instruction kinds, option kinds, operator types, etc.

### 6.2 Directory Structure

```text
packages/shared/
├── package.json
├── tsconfig.json
└── src/
    ├── xtbSchema.ts
    └── types.ts
```

### 6.3 Shared `package.json`

Example:

```jsonc
{
  "name": "@xtb-xcontrol/shared",
  "version": "0.1.0",
  "main": "./out/index.js",
  "scripts": {
    "build": "tsc -p ./",
    "watch": "tsc -p ./ -w",
    "test": "jest"
  },
  "devDependencies": {
    "typescript": "^5.x"
  }
}
```

`src/index.ts` (not shown above) can re-export from `xtbSchema.ts` and `types.ts` for convenience.

### 6.4 Core Types

The exact definitions are specified in `05-schema-and-parser-spec.md`, but at a high level you can expect:

```ts
// Example sketches, not final

export type InstructionKind = "logical" | "group" | "end";

export type OptionKind = "single" | "list";

export type OptionOperator = "=" | ":";

export interface OptionNode {
  key: string;
  operator: OptionOperator;
  value: string;
  line: number;
}

export interface InstructionNode {
  name: string;            // e.g. "$fix"
  kind: InstructionKind;
  startLine: number;
  endLine: number;         // inclusive or exclusive, depending on convention
  options: OptionNode[];
}

export interface ParsedDocument {
  instructions: InstructionNode[];
  // may include other helper collections if needed
}
```

The `xtbSchema.ts` file will define:

- Which instruction names exist.
- Their kinds (`logical` / `group` / `end`).
- Which options each instruction accepts, including their `OptionKind`.

The server’s parser and diagnostics will import these types and schema definitions.

---

## 7. Build and Development Workflow

### 7.1 Typical Developer Commands

From the repository root:

- `npm install` – install all dependencies in all workspaces.
- `npm run build` – build `client`, `server`, and `shared` packages.
- `npm run build:client` / `build:server` / `build:shared` – build individual packages.
- `npm run test` – run tests in all packages.
- `npm run package` – build the extension package (e.g. `.vsix`) via the client.

From within `packages/client`:

- `npm run watch` – watch & rebuild extension client during development.

From within `packages/server` / `packages/shared`:

- `npm run watch` – watch & rebuild server / shared code.

### 7.2 Debugging in VS Code

Recommended (not mandatory) `.vscode/launch.json` (in the repo root or `packages/client`) to:

- Launch an “Extension Development Host” session.
- Attach debugger to the Language Server (if desired).

Example (high-level description):

- One configuration of type `extensionHost` that launches VS Code with the current extension.
- Optional “Attach to Server” configuration that attaches to the Node process started with `--inspect` (as configured in `extension.ts`).

---

## 8. Future Extensions and Conventions

- **New packages** can be added under `packages/` (e.g. testing utilities, schemas for other codes) as needed.
- **Code organization conventions**:
  - Keep parsing, diagnostics, and schema logic modular and pure where possible.
  - Avoid importing VS Code APIs into the server or shared packages; only the client should depend on `vscode`.
  - Prefer declarative configuration (JSON / TS objects) over hard-coded logic for instructions/options (to make updates easier when xTB evolves).

By following this architecture and structure, contributors and automated agents should be able to:

- Understand where to add new features.
- Quickly find the relevant code paths for syntax highlighting, parsing, and diagnostics.
- Confidently extend the project while keeping the codebase maintainable.
