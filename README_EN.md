# JsonZen

<div align="center">

![JsonZen Logo](https://img.shields.io/badge/JsonZen-JSON%20Tools-blue?style=for-the-badge)

**🚀 Powerful Online JSON Tools - Comments Support, Big Number Precision, Java Object Conversion**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

English | [简体中文](README.md)

</div>

## ✨ Features

- 🎯 **Full Comments Support** - Support `//` line comments and `/* */` block comments, fully preserved during formatting
- 🔢 **Big Number Precision** - Prevent precision loss for numbers exceeding JavaScript safe range
- 🗝️ **Integer Key Support** - Perfect support for pure numbers as JSON object keys with syntax highlighting
- 🔄 **Java Object Conversion** - Smart parsing of Java toString output to JSON
- 🎨 **Professional Editor** - Monaco Editor based, VS Code level editing experience
- ⚡ **Real-time Validation** - Smart syntax checking and error hints
- 🛠️ **Rich Toolset** - Format, compress, escape, comment management and more
- 📱 **Responsive Design** - Perfect adaptation for desktop and mobile devices
- 🌙 **Modern Interface** - Dark theme + gradient design

## 🚀 Quick Start

### Requirements

- Node.js >= 16.0.0
- npm or pnpm

### Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm (recommended)
pnpm install
```

### Start Development Server

```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:5173` to start using.

### Build for Production

```bash
npm run build
# or
pnpm build
```

## 🎯 Core Features

### 📝 Enhanced JSON Editing

- **Syntax Highlighting**: Custom JSON syntax highlighting, perfect support for pure numeric keys (e.g., `{"123": "value"}`)
- **Smart Indentation**: Switch between 2/4 space indentation with auto-formatting
- **Comment Preservation**: Support `//` line comments and `/* */` block comments, fully preserved during formatting
- **Error Hints**: Real-time syntax checking with precise error location
- **Extended Compatibility**: Compatible with JSON5 features for more flexible JSON formats

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

### 🗝️ Integer Key Support

Perfect support for pure numbers as JSON object keys with professional syntax highlighting:

```javascript
// Supported integer key formats
{
  123: "Pure numeric key",        // ✅ Supported
  "456": "String numeric key",    // ✅ Supported  
  789: {                          // ✅ Nested support
    "nested": "value"
  },
  // Comment: Integer keys are common in some API responses
  0: "Index-like key"             // ✅ Supported
}
```

### ☕ Java Object Conversion

Supports multiple Java toString formats:

```java
// Traditional format
Person{name=John, age=25, address=Address{city=Beijing}}

// Lombok format  
Person(name=John, age=25, hobbies=[reading, sports])

// Array format
[Student(name=John, age=18), Student(name=Jane, age=19)]
```

Automatically converts to standard JSON format.

## 🏗️ Technical Architecture

### Tech Stack

- **Frontend Framework**: React 18 + Vite
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **Editor**: Monaco Editor
- **State Management**: React Hooks + TanStack Query
- **Routing**: React Router (Hash Router)
- **Testing**: Vitest + Coverage Testing

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run test UI
npm run test:ui
```

## 🤝 Contributing

We welcome all forms of contribution! Please read the [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

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

---

<div align="center">

**If this project helps you, please give us a ⭐️ Star!**

Made with ❤️ by [zhaozhiwei04](https://github.com/yourusername)

</div>