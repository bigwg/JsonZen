# 贡献指南

感谢您对 JsonZen 项目的关注！我们欢迎任何形式的贡献，包括但不限于：

- 🐛 Bug 报告
- 💡 新功能建议
- 🔧 代码贡献
- 📚 文档改进
- 🌍 国际化翻译

## 🚀 快速开始

### 环境准备

1. **Fork 项目**
   ```bash
   # 点击 GitHub 页面右上角的 Fork 按钮
   ```

2. **克隆项目**
   ```bash
   git clone https://github.com/your-username/JsonZen.git
   cd JsonZen
   ```

3. **安装依赖**
   ```bash
   pnpm install
   # 或
   npm install
   ```

4. **启动开发服务器**
   ```bash
   pnpm dev
   # 或
   npm run dev
   ```

## 📝 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 提交类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例

```bash
feat(parser): 添加对数字键名的支持
fix(editor): 修复注释格式化时的位置错误
docs: 更新 API 文档
test(ast): 添加 AST 解析器单元测试
```

## 🔍 开发流程

### 1. 创建功能分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 2. 开发与测试

- 编写代码，确保符合项目的代码风格
- 编写必要的测试用例
- 运行测试确保通过

```bash
# 运行测试
pnpm test

# 代码检查
pnpm run lint

# 构建测试
pnpm run build
```

### 3. 提交代码

```bash
git add .
git commit -m "feat: 添加新功能描述"
```

### 4. 推送并创建 PR

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request。

## 🧪 测试要求

- 新功能必须包含相应的测试用例
- 确保所有测试通过
- 测试覆盖率不应显著下降

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test src/test/unit/jsonAst.test.js

# 生成覆盖率报告
pnpm run test:coverage
```

## 📋 代码规范

### JavaScript/JSX 规范

- 使用 ES6+ 语法
- 优先使用函数式组件和 Hooks
- 遵循 ESLint 配置

### 文件命名

- 组件文件：`PascalCase.jsx`
- 工具函数：`camelCase.js`
- 测试文件：`*.test.js`
- 样式文件：`kebab-case.css`

### 代码风格

```javascript
// ✅ 推荐
const formatJson = (jsonString, options = {}) => {
  const { indent = 4, preserveComments = true } = options;
  // 实现逻辑
};

// ❌ 不推荐
function formatJson(jsonString, options) {
  if (!options) options = {};
  var indent = options.indent || 4;
  // 实现逻辑
}
```

## 🐛 Bug 报告

报告 Bug 时，请提供以下信息：

1. **Bug 描述**：清晰描述遇到的问题
2. **复现步骤**：详细的操作步骤
3. **预期行为**：期望的正确行为
4. **实际行为**：实际发生的情况
5. **环境信息**：
   - 操作系统
   - 浏览器版本
   - Node.js 版本

### Bug 报告模板

```markdown
## Bug 描述
简明扼要地描述遇到的问题

## 复现步骤
1. 打开应用
2. 点击格式化按钮
3. 输入以下 JSON...
4. 看到错误

## 预期行为
应该显示格式化后的 JSON

## 实际行为
显示了错误信息

## 环境信息
- OS: macOS 13.0
- Browser: Chrome 108
- Node.js: 18.12.0

## 附加信息
其他可能有用的信息...
```

## 💡 功能建议

提出新功能时，请说明：

1. **功能描述**：详细描述提议的功能
2. **使用场景**：说明该功能的使用场景
3. **解决问题**：解释该功能解决了什么问题
4. **实现思路**：如果有，可以提供实现思路

## 📚 文档贡献

- API 文档改进
- 用户指南更新
- 代码注释完善
- README 翻译

## 🌍 国际化

我们欢迎多语言支持：

1. 复制 `src/i18n/zh-CN.json` 为新的语言文件
2. 翻译其中的文本内容
3. 在 `src/i18n/index.js` 中注册新语言

## ⭐ 认可贡献者

所有贡献者都会在项目中得到认可：

- 在 README.md 中列出
- 在 CHANGELOG.md 中记录贡献
- 获得 GitHub 贡献者徽章

## 📞 联系方式

如有疑问，请通过以下方式联系：

- 创建 [GitHub Issue](../../issues)
- 企业微信：zhaozhiwei04

## 📋 检查清单

提交 PR 前，请确认：

- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 所有测试通过
- [ ] 更新了相关文档
- [ ] 提交信息符合规范
- [ ] 已经 rebase 到最新的 main 分支

---

再次感谢您的贡献！🎉