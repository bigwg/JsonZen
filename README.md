# JsonZen

<div align="center">

![JsonZen Logo](https://img.shields.io/badge/JsonZen-JSON%20工具-blue?style=for-the-badge)

**🚀 功能强大的在线 JSON 工具 - 支持注释、大数字精度保护、Java 对象转换**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[English](README_EN.md) | 简体中文

</div>

## ✨ 特性

- 🎯 **Json注释支持** - 支持 `//` 和 `/* */` 格式的单行注释，格式化时完整保留
- 🔢 **大数字精度保护** - 防止超过 JavaScript 安全范围的数字精度丢失
- 🗝️ **整数键名支持** - 完美支持纯数字作为 JSON 对象的键名，语法高亮识别
- 🔄 **Java 对象转换** - 智能解析 Java toString 输出为 JSON
- 🎨 **专业编辑器** - 基于 Monaco Editor，提供 VS Code 级别的编辑体验
- ⚡ **实时验证** - 智能语法检查和错误提示
- 🛠️ **丰富工具集** - 格式化、压缩、转义、注释管理等一站式功能
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🌙 **现代化界面** - 深色主题 + 渐变设计

## 🖼️ 预览

![JsonZen 主界面](https://raw.githubusercontent.com/bigwg/PicRepo/main/imgJsonZenHomePage.jpg)

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm 或 pnpm

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm (推荐)
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
```

访问 `http://localhost:9500` 开始使用。

### 构建生产版本

```bash
npm run build
# 或
pnpm build
```

## 🎯 核心功能

### 📝 JSON 编辑增强

- **语法高亮**: 自定义 JSON 语法高亮，完美支持纯数字键名（如 `{"123": "value"}`）
- **智能缩进**: 2格/4格缩进自由切换，格式化时自动应用
- **注释保护**: 支持 `//` 单行注释和 `/* */` 块注释，格式化时完整保留位置和内容
- **错误提示**: 实时语法检查，精确定位错误位置
- **扩展兼容**: 兼容 JSON5 特性，支持更灵活的 JSON 格式

### 🔧 专业工具集

| 功能 | 描述 | 支持格式 |
|------|------|----------|
| **格式化** | 美化 JSON 结构，保持注释 | 标准 JSON + 注释 |
| **压缩** | 移除空白字符，最小化体积 | 标准 JSON |
| **注释管理** | 添加、删除、转换注释格式 | `//` 单行 ↔ `/* */` 块注释 |
| **转义处理** | 字符串转义/反转义 | 双向转换 |
| **Java 转换** | toString 输出转 JSON | 多种 Java 格式 |

### 🔢 大数字处理

```javascript
// 输入 (超过 JavaScript 安全范围)
{
  "userId": 1234567890123456789,  // 会丢失精度
  "timestamp": "1234567890123456789"  // 字符串形式保持精度
}

// JsonZen 智能处理
{
  "userId": "1234567890123456789",  // 自动转为字符串保护精度
  "timestamp": "1234567890123456789"
}
```

### 🗝️ 整数键名支持

完美支持纯数字作为 JSON 对象的键名，提供专业的语法高亮：

```javascript
// 支持的整数键名格式
{
  123: "纯数字键名",           // ✅ 支持
  "456": "字符串数字键名",     // ✅ 支持  
  789: {                      // ✅ 支持嵌套
    "nested": "value"
  },
  // 评论: 整数键名在某些API返回中很常见
  0: "索引类型的键名"          // ✅ 支持
}
```

### ☕ Java 对象转换

支持多种 Java toString 格式：

```java
// 传统格式
Person{name=张三, age=25, address=Address{city=北京}}

// Lombok 格式  
Person(name=张三, age=25, hobbies=[读书, 运动])

// 数组格式
[Student(name=张三, age=18), Student(name=李四, age=19)]
```

自动转换为标准 JSON 格式。

## 🏗️ 技术架构

### 技术栈

- **前端框架**: React 18 + Vite
- **UI 组件**: Radix UI + Tailwind CSS + shadcn/ui
- **编辑器**: Monaco Editor
- **状态管理**: React Hooks + TanStack Query
- **路由**: React Router (Hash Router)
- **测试**: Vitest + 覆盖率测试

### 核心模块

```
src/
├── components/          # UI 组件
│   ├── ui/             # 基础 UI 组件
│   └── JsonTools.jsx   # JSON 工具栏
├── hooks/              # 自定义 Hooks
│   ├── useJsonEditor.js
│   └── useJsonOperations.js
├── utils/              # 工具函数
│   ├── jsonAst.js      # AST 核心
│   ├── jsonAstParser.js
│   ├── jsonAstFormatter.js
│   └── jsonParser.js   # Java 解析器
├── pages/              # 页面组件
└── test/               # 测试文件
    ├── unit/           # 单元测试
    ├── integration/    # 集成测试
    └── e2e/            # 端到端测试
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行测试 UI
npm run test:ui
```

## 📚 API 文档

### 核心工具函数

```javascript
import { formatJson, compressJson, validateJson } from '@/utils/jsonAstUtils';

// 格式化 JSON（保持注释）
const formatted = formatJson(jsonString, { indent: 4 });

// 压缩 JSON
const compressed = compressJson(jsonString);

// 验证 JSON
const result = validateJson(jsonString);
```

更多 API 文档请查看 [docs/api.md](docs/api.md)

## 🤝 贡献指南

我们欢迎所有形式的贡献！请阅读 [贡献指南](CONTRIBUTING.md) 了解详情。

### 开发流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format
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