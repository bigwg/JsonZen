# JsonZen

<div align="center">

![JsonZen Logo](https://img.shields.io/badge/JsonZen-JSON%20Tools-blue?style=for-the-badge)

**🚀 Powerful Online JSON Tools — Native JSON comment & numeric-key support (missing in most tools), with big-number precision, Java object conversion, and zero-source one-command launch**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![npm](https://img.shields.io/badge/npm-jsonzen-blue)](https://www.npmjs.com/package/@bigvvg/jsonzen)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

English | [简体中文](README.md)

</div>

## ✨ Features

- 🎯 **JSON Comment Support** — Native `//` and `/* */` comments, fully preserved during formatting (a capability missing in most JSON tools)
- 🗝️ **Numeric Key Support** — Perfect support for pure numbers as JSON object keys, with dedicated syntax highlighting (e.g., `{"123": "value"}`)
- 🚀 **Zero-config One-command Launch** — No need to clone source or run `npm install`; just `npx @bigvvg/jsonzen` (or `jsonzen` after global install) or a single Docker command (see Quick Start)
- 🔢 **Big Number Precision** — Prevents precision loss for numbers exceeding the JavaScript safe integer range
- ☕ **Java Object Conversion** — Smart parsing of Java `toString` output (traditional / Lombok / array) into JSON
- 🎨 **Professional Editor** — Monaco Editor based, VS Code-level editing experience
- ⚡ **Real-time Validation** — Smart syntax checking with precise error location (line + column)
- 🛠️ **Rich Toolset** — Format, compress, escape, comment management and more
- 📱 **Responsive Design** — Perfect adaptation for desktop and mobile devices
- 🌙 **Modern Interface** — Dark theme + gradient design

## 🖼️ Preview

![JsonZen Homepage](https://raw.githubusercontent.com/bigwg/PicRepo/main/imgJsonZenHomePage.jpg)

## 🚀 Quick Start

JsonZen offers two paths: **end users** can run it without source code, while **developers** can build on the source.

### 💡 For End Users: Zero-source One-command Launch (Recommended)

Don't want to clone the source or run `npm install`? JsonZen ships prebuilt static assets and runs at `http://localhost:8508` by default.

#### Option 1: `npx` command (simplest)

```bash
npx @bigvvg/jsonzen            # start (equivalent to jsonzen start)
# For the short command, install globally first: npm i -g @bigvvg/jsonzen, then use:
jsonzen stop                 # stop the background service
jsonzen update               # update to the latest version
```

- `@bigvvg/jsonzen` is a **standalone lightweight npm package** (run via `npx @bigvvg/jsonzen`, or `jsonzen` after global install) that bundles prebuilt static assets + a zero-dependency static server, and **does not depend on this repository's source**.
- Downloaded automatically on first run; afterwards use `start / stop / update` to manage the background process (PID stored in `~/.jsonzen/pid`).

#### Option 2: Docker one-command launch

```bash
# macOS / Linux
bash scripts/start.sh

# Windows (PowerShell as Administrator)
powershell -ExecutionPolicy Bypass -File scripts/start.ps1
```

The script auto-pulls (or builds locally as fallback) the image, runs it with `docker run -p 8508:80`, and prints the access URL.

> Both options require no local Node.js runtime and never touch the project source.

### 🛠️ For Developers: Run from Source

#### Requirements

- Node.js >= 16.0.0
- npm or pnpm

#### Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm (recommended)
pnpm install
```

#### Start Development Server

```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:9500` to start using.

#### Build for Production

```bash
npm run build
# or
pnpm build
```

## 🎯 Core Features

> The two most distinctive capabilities of JsonZen are **JSON comment support** and **numeric key support** — features commonly missing in other JSON tools but natively supported here.

### 🎯 JSON Comment Support

The JSON standard does not support comments, but JsonZen fully supports them and preserves them intelligently during formatting and compression:

```json
{
  // line comment
  "name": "JsonZen",
  /* block comment */
  "version": 1
}
```

- Native `//` line comments and `/* */` block comments
- Comments' positions and content are fully preserved during formatting
- Comment formats can be converted in the toolset (`//` ↔ `/* */`)

### 🗝️ Numeric Key Support

Perfect support for pure numbers as JSON object keys, with dedicated syntax highlighting:

```json
{
  123: "Pure numeric key",       // ✅ Supported
  "456": "String numeric key",   // ✅ Supported
  789: { "nested": "value" },    // ✅ Nested supported
  0: "Index-like key"            // ✅ Supported
}
```

- Syntax highlighting recognizes numeric keys (e.g., `{"123": "value"}`)
- Precisely restored after formatting, never treated as invalid JSON

### 🔧 Professional Toolset

| Feature | Description | Supported Formats |
|---------|-------------|------------------|
| **Format** | Beautify JSON structure while preserving comments | Standard JSON + Comments |
| **Compress** | Remove whitespace and minimize size | Standard JSON |
| **Comment Management** | Add, remove, convert comment formats | `//` line ↔ `/* */` block |
| **Escape Processing** | String escape/unescape | Bidirectional conversion |
| **Java Conversion** | Convert toString output to JSON | Multiple Java formats |

### 🔢 Big Number Handling

```javascript
// Input (exceeds JavaScript safe range)
{
  "userId": 1234567890123456789,  // Will lose precision
  "timestamp": "1234567890123456789"  // String format preserves precision
}

// JsonZen smart processing
{
  "userId": "1234567890123456789",  // Auto-convert to string for precision protection
  "timestamp": "1234567890123456789"
}
```

### ☕ Java Object Conversion

Supports multiple Java `toString` formats:

```java
// Traditional format
Person{name=John, age=25, address=Address{city=Beijing}}

// Lombok format
Person(name=John, age=25, hobbies=[reading, sports])

// Array format
[Student(name=John, age=18), Student(name=Jane, age=19)]
```

Automatically converts to standard JSON format.

### 📝 Other Editing Enhancements

- **Syntax Highlighting**: Custom JSON syntax highlighting, perfect support for pure numeric keys (e.g., `{"123": "value"}`)
- **Smart Indentation**: Switch between 2/4 space indentation with auto-formatting
- **Error Hints**: Real-time syntax checking with precise error location (line + column)
- **Extended Compatibility**: Compatible with JSON5 features for more flexible JSON formats

## 🏗️ Technical Architecture

### Tech Stack

- **Frontend Framework**: React 18 + Vite
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **Editor**: Monaco Editor
- **State Management**: React Hooks + TanStack Query
- **Routing**: React Router (Hash Router)
- **Testing**: Vitest + Coverage Testing

### Core Modules

```
src/
├── components/            # UI Components
│   ├── ui/               # Base UI Components (shadcn/ui)
│   ├── json-tools/       # Toolset config & components
│   └── JsonTools.jsx      # JSON Toolbar
├── hooks/                # Custom Hooks
│   ├── useJsonEditor.js
│   └── useJsonOperations.js
├── utils/                # Utility Functions
│   ├── jsonAst.js         # AST node definitions & traversal
│   ├── jsonAstParser.js   # Recursive descent parser (comments / numeric keys / big numbers / duplicate key detection)
│   ├── jsonAstFormatter.js # AST → string (format / compress, preserve comments)
│   ├── jsonAstUtils.js    # Public unified API
│   └── jsonParser.js      # Java toString → JSON parser
├── pages/                # Page Components
└── test/                 # Test Files
    ├── unit/             # Unit Tests
    ├── integration/      # Integration Tests
    └── e2e/              # End-to-End Tests
```

### Custom AST Engine

JsonZen's core competitiveness is a **hand-written JSON AST system** (no regex, no native `JSON.parse`):

- **Parsing**: Built-in numeric-key preprocessing, comment binding, duplicate-key precise detection (with line/column), and preservation of numbers beyond the safe integer range as strings.
- **Formatting**: Comments flow as node attributes through the AST and are redrawn at their original positions; `_hasNumericKeys` decides whether to restore numeric keys.
- **Validation**: On parse failure, a structured error is thrown and written to Monaco `setModelMarkers` for precise marking.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run test UI
npm run test:ui
```

## 🐛 Issues

Encountered problems or have suggestions? Please contact us through:

- [GitHub Issues](../../issues)
- Enterprise WeChat: zhaozhiwei04

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE).

## 🙏 Acknowledgments

Thanks to all contributors and especially the following open source projects:

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Powerful code editor
- [Radix UI](https://www.radix-ui.com/) - Excellent unstyled component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vite](https://vitejs.dev/) - Fast build tool

## 📊 Project Statistics

![GitHub stars](https://img.shields.io/github/stars/bigwg/JsonZen?style=social)
![GitHub forks](https://img.shields.io/github/forks/bigwg/JsonZen?style=social)
![GitHub issues](https://img.shields.io/github/issues/bigwg/JsonZen)
![GitHub contributors](https://img.shields.io/github/contributors/bigwg/JsonZen)

---

<div align="center">

**If this project helps you, please give us a ⭐️ Star!**

Made with ❤️ by [bigwg](https://github.com/bigwg)

</div>
