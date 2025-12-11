# xTB xcontrol VS Code Extension

> Syntax highlighting and language support for xTB xcontrol files

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- **Syntax Highlighting**: Rich color coding for xTB xcontrol syntax
  - Instructions (`$fix`, `$constrain`, `$wall`, etc.)
  - Options (key-value pairs)
  - Comments, numbers, and strings
  
- **Language Server Protocol (LSP)**: Real-time diagnostics and error checking
  - Unknown instruction detection
  - Unknown option validation
  - Operator usage warnings
  - Duplicate option detection
  - Orphan option warnings
  - Missing `$end` hints

- **Code Snippets**: Quick insertion of common instruction blocks

## 📦 Installation

### From VS Code Marketplace (Coming Soon)

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "xTB xcontrol"
4. Click Install

### From VSIX Package

1. Download the `.vsix` file from [Releases](https://github.com/lichman0405/xtb-extension/releases)
2. Open VS Code
3. Go to Extensions
4. Click "..." → "Install from VSIX..."
5. Select the downloaded file

## 🔧 Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/lichman0405/xtb-extension.git
cd xtb-extension

# Install dependencies
npm install

# Build all packages
npm run build

# Watch mode for development
npm run watch
```

### Project Structure

```
xtb-xcontrol-vscode/
├── packages/
│   ├── client/          # VS Code extension
│   ├── server/          # Language Server
│   └── shared/          # Shared types and schema
├── docs/                # Technical documentation
└── package.json         # Workspace root
```

### Testing

```bash
# Run all tests
npm test

# Test specific package
npm run test:client
npm run test:server
npm run test:shared
```

### Packaging

```bash
# Create .vsix package
npm run package
```

## 📚 Documentation

- [Project Overview](docs/01-project-overview.md)
- [Language Specification](docs/02-language-spec-xtb-xcontrol.md)
- [Architecture](docs/03-architecture-and-repo-structure.md)
- [Development Plan](docs/09-development-plan.md)

## ⚙️ Configuration

Configure diagnostic severity levels in VS Code settings:

```json
{
  "xtbXcontrol.diagnostics.unknownInstruction": "error",
  "xtbXcontrol.diagnostics.unknownOption": "warning",
  "xtbXcontrol.diagnostics.suspiciousOperator": "warning",
  "xtbXcontrol.diagnostics.duplicateOption": "warning",
  "xtbXcontrol.diagnostics.orphanOption": "error",
  "xtbXcontrol.diagnostics.missingEnd": "hint"
}
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## 📄 License

MIT © 2025 lichman0405

## 🙏 Acknowledgments

This extension supports [xTB](https://github.com/grimme-lab/xtb) - Extended Tight Binding program for computational chemistry.
