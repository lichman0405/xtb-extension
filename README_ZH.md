# xTB xcontrol VS Code 扩展

中文 | [English](README.md)

一个全面的 VS Code 扩展，为 xTB xcontrol 文件提供语法高亮、智能诊断和代码片段支持。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.85.0+-blue.svg)](https://code.visualstudio.com/)

## 🌟 功能特性

### 语法高亮

为所有 xcontrol 语法元素提供丰富的颜色标记：

- **指令**：`$fix`、`$constrain`、`$wall`、`$opt`、`$scan` 等
- **选项**：使用 `:` 或 `=` 操作符的键值对
- **注释**：`#` 行注释
- **数据类型**：数字、字符串、布尔值、范围

### 智能诊断（语言服务器协议）

实时错误检测，包含 6 条诊断规则：

| 规则               | 严重程度 | 描述                                |
| ------------------ | -------- | ----------------------------------- |
| **R1：未知指令**   | 错误     | 检测无法识别的指令（如 `$unknwon`） |
| **R2：未知选项**   | 警告     | 识别已知指令中的无效选项            |
| **R3：可疑操作符** | 警告     | 建议正确的操作符用法（`:` vs `=`）  |
| **R4：重复选项**   | 警告     | 警告同一块中的重复选项              |
| **R5：孤立选项**   | 错误     | 检测不在任何指令块内的选项          |
| **R6：缺失 $end**  | 提示     | 当缺少 `$end` 终止符时提示          |

### 代码片段

19 个预置代码片段，快速编写代码：

- `xtb.fix` → 固定原子位置
- `xtb.constrain` → 几何约束
- `xtb.wall` → 势能壁
- `xtb.opt` → 优化设置
- `xtb.scan` → 坐标扫描
- `xtb.template` → 完整文件模板
- 更多...

### 语言配置

- **自动补全**：输入 `$` 触发指令建议
- **括号匹配**：引号和括号自动闭合
- **注释快捷键**：`Ctrl+/`（Windows/Linux）或 `Cmd+/`（Mac）

## 📦 安装

### 从 VSIX 文件安装（手动安装）

1. 从 releases 下载 `.vsix` 文件
2. 打开 VS Code
3. 按 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（Mac）
4. 输入"从 VSIX 安装"并选择下载的文件

### 从 VS Code 市场安装（即将推出）

在扩展视图（`Ctrl+Shift+X`）中搜索"xTB xcontrol"。

## 🚀 快速开始

1. **创建新文件**，扩展名为 `.xcontrol`、`.xtbrc` 或 `xtb.inp`
2. **开始输入** `$` 查看指令建议
3. **使用代码片段**：输入 `xtb.` 并按 `Tab` 键展开模板
4. **查看诊断**：错误和警告以波浪线显示

### 示例

```xcontrol
# 带约束的优化
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

## 🎯 支持的文件类型

扩展会为以下文件激活：

- `.xcontrol` - 主 xTB 控制文件
- `.xtbrc` - xTB 配置文件
- `xtb.inp` - 替代输入格式

## 📚 xTB 指令参考

### 常用指令

| 指令         | 用途              | 常用选项                                       |
| ------------ | ----------------- | ---------------------------------------------- |
| `$fix`       | 固定原子位置/元素 | `atoms`, `elements`                            |
| `$constrain` | 几何约束          | `distance`, `angle`, `dihedral`                |
| `$wall`      | 球形/椭球势能壁   | `potential`, `sphere`, `alpha`, `beta`, `temp` |
| `$opt`       | 优化设置          | `maxcycle`, `engine`, `optlevel`               |
| `$scan`      | 坐标扫描          | `mode`, `steps`                                |
| `$hess`      | Hessian 计算      | `sccacc`, `step`                               |
| `$write`     | 输出控制          | `charges`, `wiberg`, `gbsa`                    |

完整文档请参阅 [xTB 官方文档](https://xtb-docs.readthedocs.io/)。

## 🔧 扩展设置

在 VS Code 设置中配置诊断规则：

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

有效的严重程度级别：`"error"`、`"warning"`、`"hint"`、`"none"`

## 🐛 已知问题

目前没有已知问题。请在 [GitHub](https://github.com/lichman0405/xtb-extension/issues) 上报告问题。

## 📖 文档

- [开发文档](docs/) - 架构和实现细节
- [测试指南](TESTING-GUIDE.md) - 如何测试扩展
- [更新日志](CHANGELOG.md) - 版本历史

## 🤝 贡献

欢迎贡献！请随时提交 pull request 或提出 issue。

## 📄 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [xTB](https://github.com/grimme-lab/xtb) - 扩展紧束缚程序
- [VS Code Extension API](https://code.visualstudio.com/api) - 微软的扩展框架
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) - LSP 规范

## 📮 联系方式

- GitHub：[@lichman0405](https://github.com/lichman0405)
- 问题反馈：[GitHub Issues](https://github.com/lichman0405/xtb-extension/issues)

---

**祝您使用 xTB 编程愉快！** 🎉
