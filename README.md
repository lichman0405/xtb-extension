# xTB xcontrol Extension for VS Code

[中文文档](README_ZH.md) | English

A comprehensive VS Code extension providing syntax highlighting, intelligent diagnostics, and code snippets for xTB xcontrol files.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.85.0+-blue.svg)](https://code.visualstudio.com/)

## 🌟 Features

### Syntax Highlighting

Rich color coding for all xcontrol syntax elements:

- **Instructions**: `$fix`, `$constrain`, `$wall`, `$opt`, `$scan`, etc.
- **Options**: Key-value pairs with `:` or `=` operators
- **Comments**: `#` line comments
- **Data types**: Numbers, strings, booleans, ranges

### Intelligent Diagnostics (Language Server Protocol)

Real-time error detection with 6 diagnostic rules:

| Rule                        | Severity | Description                                          |
| --------------------------- | -------- | ---------------------------------------------------- |
| **R1: Unknown Instruction** | Error    | Detects unrecognized instructions (e.g., `$unknwon`) |
| **R2: Unknown Option**      | Warning  | Identifies invalid options within known instructions |
| **R3: Suspicious Operator** | Warning  | Suggests correct operator usage (`:` vs `=`)         |
| **R4: Duplicate Option**    | Warning  | Warns about repeated options in the same block       |
| **R5: Orphan Option**       | Error    | Detects options outside any instruction block        |
| **R6: Missing $end**        | Info     | Hints when `$end` terminator is missing              |

### Code Snippets

19 pre-built snippets for rapid coding:

- `xtb.fix` → Atomic position fixing
- `xtb.constrain` → Geometry constraints
- `xtb.wall` → Potential walls
- `xtb.opt` → Optimization settings
- `xtb.scan` → Coordinate scanning
- `xtb.template` → Complete file template
- And more...

### Language Configuration

- **Auto-completion**: Triggers on `$` for instructions
- **Bracket matching**: Auto-closing for quotes and parentheses
- **Comment shortcuts**: `Ctrl+/` (Windows/Linux) or `Cmd+/` (Mac)

## 📦 Installation

### From VSIX File (Manual Installation)

1. Download the `.vsix` file from releases
2. Open VS Code
3. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
4. Type "Install from VSIX" and select the downloaded file

### From VS Code Marketplace (Coming Soon)

Search for "xTB xcontrol" in the Extensions view (`Ctrl+Shift+X`)

## 🚀 Quick Start

1. **Create a new file** with extension `.xcontrol`, `.xtbrc`, or `xtb.inp`
2. **Start typing** `$` to see instruction suggestions
3. **Use snippets**: Type `xtb.` and press `Tab` to expand templates
4. **Check diagnostics**: Errors and warnings appear as squiggly lines

### Example

```xcontrol
# Optimization with constraints
$opt
    maxcycle=200
    engine=lbfgs
$end

$fix
    atoms: 1-5
    elements: C,H
$end

$constrain
    distance: 1,2,2.5
    angle: 3,4,5,120.0
$end
```

## 🎯 Supported File Types

The extension activates for:

- `.xcontrol` - Main xTB control files
- `.xtbrc` - xTB configuration files
- `xtb.inp` - Alternative input format

## 📚 xTB Instructions Reference

### Commonly Used Instructions

| Instruction  | Purpose                       | Common Options                                 |
| ------------ | ----------------------------- | ---------------------------------------------- |
| `$fix`       | Fix atomic positions/elements | `atoms`, `elements`                            |
| `$constrain` | Geometry constraints          | `distance`, `angle`, `dihedral`                |
| `$wall`      | Spherical/ellipsoidal walls   | `potential`, `sphere`, `alpha`, `beta`, `temp` |
| `$opt`       | Optimization settings         | `maxcycle`, `engine`, `optlevel`               |
| `$scan`      | Coordinate scanning           | `mode`, `steps`                                |
| `$hess`      | Hessian calculation           | `sccacc`, `step`                               |
| `$write`     | Output control                | `charges`, `wiberg`, `gbsa`                    |

For complete documentation, see [xTB documentation](https://xtb-docs.readthedocs.io/).

## 🔧 Extension Settings

Configure diagnostic rules in VS Code settings:

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

Valid severity levels: `"error"`, `"warning"`, `"hint"`, `"none"`

## 🐛 Known Issues

None currently. Please report issues on [GitHub](https://github.com/lichman0405/xtb-extension/issues).

## 📖 Documentation

- [Development Documentation](docs/) - Architecture and implementation details
- [Testing Guide](TESTING-GUIDE.md) - How to test the extension
- [Changelog](CHANGELOG.md) - Version history

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [xTB](https://github.com/grimme-lab/xtb) - The extended tight-binding program
- [VS Code Extension API](https://code.visualstudio.com/api) - Microsoft's extension framework
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) - LSP specification

## 📮 Contact

- GitHub: [@lichman0405](https://github.com/lichman0405)
- Issues: [GitHub Issues](https://github.com/lichman0405/xtb-extension/issues)

---

**Enjoy coding with xTB!** 🎉
