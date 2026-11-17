# JsonZen

<div align="center">

![JsonZen Logo](https://img.shields.io/badge/JsonZen-JSON%20工具-blue?style=for-the-badge)

**🚀 功能强大的在线 JSON 工具 —— 支持 JSON 注释与数字键名，并具备大数字精度保护、Java 对象转换，可免源码一键启动**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![npm](https://img.shields.io/badge/npm-jsonzen-blue)](https://www.npmjs.com/package/@bigvvg/jsonzen)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[English](README_EN.md) | 简体中文

</div>

## ✨ 特性

- 🎯 **JSON 注释支持** —— 原生支持 `//` 与 `/* */` 注释，格式化时完整保留位置与内容（多数 JSON 工具缺失的能力）
- 🗝️ **整数键名支持** —— 完美支持纯数字作为 JSON 对象的键名，并提供专属语法高亮（如 `{"123": "value"}`）
- 🚀 **零配置一键启动** —— 使用者无需 clone 源码、无需 `npm install`，`npx @bigvvg/jsonzen`（或全局安装后用 `jsonzen`）即可运行（详见下方「快速开始」）
- 🔢 **大数字精度保护** —— 自动识别超出 JavaScript 安全整数范围的数字并转为字符串，杜绝精度丢失
- ☕ **Java 对象转换** —— 智能解析 Java `toString` 输出（传统 / Lombok / 数组）为标准 JSON
- 🎨 **专业编辑器** —— 基于 Monaco Editor，提供 VS Code 级别的编辑体验
- ⚡ **实时验证** —— 语法错误精确定位（行号 + 列号 + Monaco 错误标记）
- 🛠️ **丰富工具集** —— 格式化、压缩、转义、注释管理等一站式功能
- 📱 **现代化界面** —— 深色主题 + 渐变设计，响应式适配桌面与移动端

## 🖼️ 预览

![JsonZen 主界面](https://raw.githubusercontent.com/bigwg/PicRepo/main/imgJsonZenHomePage.jpg)

## 🚀 快速开始

JsonZen 提供两条使用路径：**使用者**无需源码即可运行，**开发者**可基于源码二次开发。

### 💡 使用者：免源码一键启动（推荐）

不想 clone 源码、也不需要 `npm install`？JsonZen 提供预构建的静态产物，服务默认运行在 `http://localhost:8508`。

#### 方式一：`npx` 命令（最简单）

```bash
npx @bigvvg/jsonzen            # 启动（等价于 jsonzen start）
# 若想用简短命令，先全局安装：npm i -g @bigvvg/jsonzen，之后可简写为：
jsonzen stop                 # 停止后台服务
jsonzen update               # 更新到最新版
```

- `@bigvvg/jsonzen` 是一个**独立的轻量 npm 包**（运行命令 `npx @bigvvg/jsonzen`，全局安装后命令为 `jsonzen`），内部已内置预构建静态产物 + 零依赖静态服务器，**不依赖本仓库源码**。
- 首次运行自动下载；之后用 `start / stop / update` 管理后台进程（PID 记录在 `~/.jsonzen/pid`）。

#### 方式二：Docker 一键启动

```bash
# macOS / Linux
bash scripts/start.sh

# Windows (PowerShell 管理员)
powershell -ExecutionPolicy Bypass -File scripts/start.ps1
```

脚本会自动拉取（或本地构建兜底）镜像、用 `docker run -p 8508:80` 起服务，并在终端打印访问地址。

> 两种方式均不需本地安装 Node.js 运行环境，也不接触工程源码。

### 🛠️ 开发者：基于源码运行

#### 环境要求

- Node.js >= 16.0.0
- npm 或 pnpm

#### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm (推荐)
pnpm install
```

#### 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
```

访问 `http://localhost:9500` 开始使用。

#### 构建生产版本

```bash
npm run build
# 或
pnpm build
```

## 🎯 核心功能

> JsonZen 最与众不同的两项能力是 **JSON 注释支持** 与 **整数键名支持** —— 它们正是其它 JSON 工具普遍缺失、而 JsonZen 原生支持的特性。

### 🎯 JSON 注释支持

JSON 标准本身不支持注释，但 JsonZen 完整支持，并在格式化与压缩时智能保留：

```json
{
  // 单行注释
  "name": "JsonZen",
  /* 块注释 */
  "version": 1
}
```

- 原生支持 `//` 单行注释与 `/* */` 块注释
- 格式化时完整保留注释的位置与内容
- 注释格式可在工具集中互相转换（`//` ↔ `/* */`）

### 🗝️ 整数键名支持

完美支持纯数字作为 JSON 对象的键名，并提供专属语法高亮：

```json
{
  123: "纯数字键名",         // ✅ 支持
  "456": "字符串数字键名",   // ✅ 支持
  789: { "nested": "value" }, // ✅ 支持嵌套
  0: "索引类型的键名"         // ✅ 支持
}
```

- 语法高亮识别数字键名（如 `{"123": "value"}`）
- 格式化后精确还原，不被当作非法 JSON

### 🔧 专业工具集

| 功能 | 描述 | 支持格式 |
|------|------|----------|
| **格式化** | 美化 JSON 结构，保持注释 | 标准 JSON + 注释 |
| **压缩** | 移除空白字符，最小化体积 | 标准 JSON |
| **注释管理** | 添加、删除、转换注释格式 | `//` 单行 ↔ `/* */` 块注释 |
| **转义处理** | 字符串转义 / 反转义 | 双向转换 |
| **Java 转换** | `toString` 输出转 JSON | 多种 Java 格式 |

### 🔢 大数字处理

```javascript
// 输入（超过 JavaScript 安全范围）
{
  "userId": 1234567890123456789,   // 原生 JSON.parse 会丢失精度
  "timestamp": "1234567890123456789"
}

// JsonZen 智能处理
{
  "userId": "1234567890123456789", // 自动转为字符串保护精度
  "timestamp": "1234567890123456789"
}
```

### ☕ Java 对象转换

支持多种 Java `toString` 格式，自动转换为标准 JSON：

```java
// 传统格式
Person{name=张三, age=25, address=Address{city=北京}}

// Lombok 格式
Person(name=张三, age=25, hobbies=[读书, 运动])

// 数组格式
[Student(name=张三, age=18), Student(name=李四, age=19)]
```

### 📝 其它编辑增强

- **语法高亮**：自定义 JSON 语法高亮，完美支持纯数字键名（如 `{"123": "value"}`）
- **智能缩进**：2 格 / 4 格缩进自由切换，格式化时自动应用
- **错误提示**：实时语法检查，精确定位错误位置（行号 + 列号）
- **扩展兼容**：兼容 JSON5 特性，支持更灵活的 JSON 格式

## 🏗️ 技术架构

### 技术栈

- **前端框架**：React 18 + Vite
- **UI 组件**：Radix UI + Tailwind CSS + shadcn/ui
- **编辑器**：Monaco Editor
- **状态管理**：React Hooks + TanStack Query
- **路由**：React Router（HashRouter）
- **测试**：Vitest + 覆盖率测试

### 核心模块

```
src/
├── components/            # UI 组件
│   ├── ui/               # 基础 UI 组件（shadcn/ui）
│   ├── json-tools/       # 工具集配置与组件
│   └── JsonTools.jsx      # JSON 工具栏
├── hooks/                # 自定义 Hooks
│   ├── useJsonEditor.js
│   └── useJsonOperations.js
├── utils/                # 核心工具函数
│   ├── jsonAst.js         # AST 节点定义与遍历
│   ├── jsonAstParser.js   # 递归下降解析器（注释 / 数字 key / 大数字 / 重复 key 检测）
│   ├── jsonAstFormatter.js # AST → 字符串（格式化 / 压缩，保留注释）
│   ├── jsonAstUtils.js    # 对外统一 API
│   └── jsonParser.js      # Java toString → JSON 解析器
├── pages/                # 页面组件
└── test/                 # 测试文件
    ├── unit/             # 单元测试
    ├── integration/      # 集成测试
    └── e2e/              # 端到端测试
```

### 自研 AST 引擎

JsonZen 的核心竞争力是一套**手写的 JSON AST 系统**（不依赖正则或原生 `JSON.parse`）：

- **解析阶段**：内置数字 key 预处理、注释绑定、重复 key 精确检测（含行列号）、超安全整数范围的数字保留为字符串。
- **格式化阶段**：注释作为节点属性随 AST 流转，按原位置重绘；`_hasNumericKeys` 决定是否还原数字 key。
- **验证阶段**：解析失败抛出结构化错误，由页面写入 Monaco `setModelMarkers` 实现精准标记。

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行测试 UI
npm run test:ui
```

## 🐛 问题反馈

遇到问题或有建议？请通过以下方式联系：

- [GitHub Issues](../../issues)
- 企业微信：zhaozhiwei04

## 📄 开源协议

本项目基于 [Apache License 2.0](LICENSE) 开源协议。

## 🙏 致谢

感谢所有贡献者的付出，特别感谢以下开源项目：

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 强大的代码编辑器
- [Radix UI](https://www.radix-ui.com/) - 优秀的无样式组件库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Vite](https://vitejs.dev/) - 快速的构建工具

## 📊 项目统计

![GitHub stars](https://img.shields.io/github/stars/bigwg/JsonZen?style=social)
![GitHub forks](https://img.shields.io/github/forks/bigwg/JsonZen?style=social)
![GitHub issues](https://img.shields.io/github/issues/bigwg/JsonZen)
![GitHub contributors](https://img.shields.io/github/contributors/bigwg/JsonZen)

---

<div align="center">

**如果这个项目对您有帮助，请给我们一个 ⭐️ Star！**

Made with ❤️ by [bigwg](https://github.com/bigwg)

</div>
